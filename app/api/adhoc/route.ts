import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db/client'
import { users, campaigns } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import {
  createAdHocResearchRequest,
  getAdHocResearchRequestsByUserId,
} from '@/lib/db/queries/adhoc'
import { inngest } from '@/lib/inngest/client'
import { z } from 'zod'

// Custom URL validator that accepts bare domains
const validateWebsiteUrl = (value: string | undefined): boolean => {
  if (!value || value.length === 0) return true; // Optional field

  let url: URL;
  try {
    // Try parsing as-is
    url = new URL(value);
  } catch {
    try {
      // Try with https:// prefix for bare domains
      url = new URL(`https://${value}`);
    } catch {
      return false;
    }
  }

  // Only allow http and https protocols (reject javascript:, data:, etc.)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return false;
  }

  // Must have a valid hostname
  if (!url.hostname || url.hostname.length === 0) {
    return false;
  }

  // Hostname must contain at least one dot (reject bare hostnames like "invalid")
  if (!url.hostname.includes('.')) {
    return false;
  }

  return true;
};

// Validation schema for ad-hoc research request creation
const createAdHocSchema = z
  .object({
    prospectName: z.string().trim().optional(),
    companyName: z.string().trim().optional(),
    email: z.string().email('Invalid email format').trim().optional(),
    website: z
      .string()
      .trim()
      .optional()
      .refine(
        (val) => validateWebsiteUrl(val),
        { message: 'Invalid website URL (e.g., https://example.com or example.com)' }
      ),
    campaignId: z.string().min(1, 'Campaign ID is required'),
  })
  .refine(
    (data) =>
      (data.prospectName && data.prospectName.length > 0) ||
      (data.companyName && data.companyName.length > 0) ||
      (data.email && data.email.length > 0) ||
      (data.website && data.website.length > 0),
    {
      message: 'At least one of prospectName, companyName, email, or website must be provided',
      path: ['form'],
    }
  )

/**
 * POST /api/adhoc
 * Creates a new ad-hoc research request and triggers background research generation
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createAdHocSchema.parse(body)

    // Get user
    const user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify campaign belongs to user and is active
    const campaign = await db.query.campaigns.findFirst({
      where: eq(campaigns.id, validatedData.campaignId),
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    if (campaign.userId !== user.id) {
      return NextResponse.json(
        { error: 'Campaign does not belong to this user' },
        { status: 403 }
      )
    }

    if (campaign.status !== 'active') {
      return NextResponse.json(
        { error: 'Campaign is not active' },
        { status: 400 }
      )
    }

    // Create ad-hoc research request
    const request_data = await createAdHocResearchRequest({
      userId: user.id,
      campaignId: validatedData.campaignId,
      prospectName: validatedData.prospectName || null,
      companyName: validatedData.companyName || null,
      email: validatedData.email || null,
      website: validatedData.website || null,
      status: 'pending',
    })

    // Trigger background research generation
    await inngest.send({
      name: 'research/generate.adhoc',
      data: {
        adHocRequestId: request_data.id,
        campaignId: validatedData.campaignId,
        prospectName: validatedData.prospectName,
        companyName: validatedData.companyName,
        email: validatedData.email,
        website: validatedData.website,
      },
    })

    // Return created request with campaign info
    const requestWithCampaign = await db.query.adHocResearchRequests.findFirst({
      where: eq(users.id, request_data.id),
      with: {
        campaign: true,
      },
    })

    return NextResponse.json(
      {
        request: requestWithCampaign || request_data,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to create ad-hoc research request:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.issues,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to create ad-hoc research request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/adhoc
 * Lists all ad-hoc research requests for the authenticated user
 */
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user
    const user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
    })

    if (!user) {
      return NextResponse.json({ requests: [] })
    }

    // Get all ad-hoc research requests for user
    const requests = await getAdHocResearchRequestsByUserId(user.id)

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Failed to fetch ad-hoc research requests:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch ad-hoc research requests',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
