import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db/client'
import { campaigns, users, webhookSubscriptions } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { createWebhookSubscription } from '@/lib/services/google-calendar'
import { z } from 'zod'

// Validation schema for campaign creation
const createCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').optional(),
  googleCalendarId: z.string().min(1, 'Calendar ID is required'),
  googleCalendarName: z.string().min(1, 'Calendar name is required'),
  companyName: z.string().min(1, 'Company name is required'),
  companyDomain: z.string().min(1, 'Company domain is required').regex(/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i, 'Invalid domain format'),
  companyDescription: z.string().min(20, 'Company description must be at least 20 characters'),
  offeringTitle: z.string().min(1, 'Offering title is required'),
  offeringDescription: z.string().min(20, 'Offering description must be at least 20 characters'),
  targetCustomer: z.string().min(1, 'Target customer is required'),
  keyPainPoints: z.array(z.string()).min(1, 'At least one pain point is required'),
})

/**
 * POST /api/campaigns
 * Creates a new campaign with webhook subscription
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!session.access_token) {
      return NextResponse.json(
        { error: 'Missing access token' },
        { status: 401 }
      )
    }

    if (session.error === 'RefreshAccessTokenError') {
      return NextResponse.json(
        { error: 'Token refresh failed - Please re-authenticate' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createCampaignSchema.parse(body)

    // Get or create user
    let user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
    })

    if (!user) {
      // Create user if doesn't exist
      const [newUser] = await db.insert(users).values({
        email: session.user.email,
        name: session.user.name || null,
        googleId: session.user.id || '',
        googleAccessToken: session.access_token,
      }).returning()
      user = newUser
    }

    // Check if calendar is already being monitored by this user
    const existingCampaign = await db.query.campaigns.findFirst({
      where: and(
        eq(campaigns.userId, user.id),
        eq(campaigns.googleCalendarId, validatedData.googleCalendarId)
      ),
    })

    if (existingCampaign) {
      return NextResponse.json(
        { error: 'This calendar is already being monitored by another campaign' },
        { status: 400 }
      )
    }

    // Generate campaign name if not provided
    const campaignName = validatedData.name || `${validatedData.companyName} - ${validatedData.googleCalendarName}`

    // Create campaign
    const [campaign] = await db.insert(campaigns).values({
      userId: user.id,
      name: campaignName,
      status: 'active',
      googleCalendarId: validatedData.googleCalendarId,
      googleCalendarName: validatedData.googleCalendarName,
      companyName: validatedData.companyName,
      companyDomain: validatedData.companyDomain.toLowerCase(),
      companyDescription: validatedData.companyDescription,
      offeringTitle: validatedData.offeringTitle,
      offeringDescription: validatedData.offeringDescription,
      targetCustomer: validatedData.targetCustomer,
      keyPainPoints: JSON.stringify(validatedData.keyPainPoints),
    }).returning()

    // Create webhook subscription (skip in development)
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/google-calendar`
    const isLocalhost = webhookUrl.includes('localhost') || webhookUrl.includes('127.0.0.1')

    if (!isLocalhost) {
      try {
        const subscription = await createWebhookSubscription(
          validatedData.googleCalendarId,
          webhookUrl,
          session.access_token
        )

        // Store webhook subscription
        await db.insert(webhookSubscriptions).values({
          campaignId: campaign.id,
          googleResourceId: subscription.resourceId,
          googleChannelId: subscription.id,
          expiresAt: new Date(parseInt(subscription.expiration)),
          status: 'active',
        })
      } catch (webhookError) {
        // Rollback campaign creation if webhook subscription fails
        await db.delete(campaigns).where(eq(campaigns.id, campaign.id))

        console.error('Failed to create webhook subscription:', webhookError)

        return NextResponse.json(
          {
            error: 'Failed to create webhook subscription',
            message: webhookError instanceof Error ? webhookError.message : 'Unknown error',
          },
          { status: 500 }
        )
      }
    } else {
      console.warn('Skipping webhook creation in development mode (localhost)')
    }

    return NextResponse.json(
      {
        campaign: {
          ...campaign,
          keyPainPoints: JSON.parse(campaign.keyPainPoints || '[]'),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to create campaign:', error)

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
        error: 'Failed to create campaign',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/campaigns
 * Lists all campaigns for the authenticated user
 */
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user
    const user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
    })

    if (!user) {
      return NextResponse.json({ campaigns: [] })
    }

    // Get all campaigns for user with webhook subscriptions
    const userCampaigns = await db.query.campaigns.findMany({
      where: eq(campaigns.userId, user.id),
      with: {
        webhookSubscription: true,
      },
      orderBy: (campaigns, { desc }) => [desc(campaigns.createdAt)],
    })

    // Parse keyPainPoints JSON
    const parsedCampaigns = userCampaigns.map(campaign => ({
      ...campaign,
      keyPainPoints: JSON.parse(campaign.keyPainPoints || '[]'),
    }))

    return NextResponse.json({ campaigns: parsedCampaigns })
  } catch (error) {
    console.error('Failed to fetch campaigns:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch campaigns',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
