import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db/client'
import { campaigns, users, webhookSubscriptions } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { stopWebhookSubscription } from '@/lib/services/google-calendar'
import { z } from 'zod'

// Validation schema for campaign update
const updateCampaignSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.enum(['active', 'paused']).optional(),
  companyName: z.string().min(1).optional(),
  companyDomain: z.string().regex(/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i).optional(),
  companyDescription: z.string().min(20).optional(),
  offeringTitle: z.string().min(1).optional(),
  offeringDescription: z.string().min(20).optional(),
  targetCustomer: z.string().min(1).optional(),
  keyPainPoints: z.array(z.string()).min(1).optional(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/campaigns/[id]
 * Fetches a single campaign by ID
 */
export async function GET(request: NextRequest, props: RouteParams) {
  const params = await props.params
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
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get campaign
    const campaign = await db.query.campaigns.findFirst({
      where: and(
        eq(campaigns.id, params.id),
        eq(campaigns.userId, user.id)
      ),
      with: {
        webhookSubscription: true,
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      campaign: {
        ...campaign,
        keyPainPoints: JSON.parse(campaign.keyPainPoints || '[]'),
      },
    })
  } catch (error) {
    console.error('Failed to fetch campaign:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch campaign',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/campaigns/[id]
 * Updates a campaign
 */
export async function PATCH(request: NextRequest, props: RouteParams) {
  const params = await props.params
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

    // Get user
    const user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify campaign ownership
    const existingCampaign = await db.query.campaigns.findFirst({
      where: and(
        eq(campaigns.id, params.id),
        eq(campaigns.userId, user.id)
      ),
    })

    if (!existingCampaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateCampaignSchema.parse(body)

    // Prepare update data
    const updateData: Record<string, unknown> = {
      ...validatedData,
      updatedAt: new Date(),
    }

    // Handle keyPainPoints serialization
    if (validatedData.keyPainPoints) {
      updateData.keyPainPoints = JSON.stringify(validatedData.keyPainPoints)
    }

    // Handle domain normalization
    if (validatedData.companyDomain) {
      updateData.companyDomain = validatedData.companyDomain.toLowerCase()
    }

    // Handle status change (pause/resume)
    if (validatedData.status && validatedData.status !== existingCampaign.status) {
      if (validatedData.status === 'paused') {
        // Stop webhook when pausing
        const subscription = await db.query.webhookSubscriptions.findFirst({
          where: eq(webhookSubscriptions.campaignId, params.id),
        })

        if (subscription && subscription.status === 'active') {
          try {
            await stopWebhookSubscription(
              subscription.googleChannelId,
              subscription.googleResourceId,
              session.access_token
            )

            // Update webhook status
            await db.update(webhookSubscriptions)
              .set({ status: 'cancelled', updatedAt: new Date() })
              .where(eq(webhookSubscriptions.id, subscription.id))
          } catch (webhookError) {
            console.error('Failed to stop webhook subscription:', webhookError)
            // Continue with campaign pause even if webhook stop fails
          }
        }
      }
      // Note: Resuming a campaign requires creating a new webhook subscription
      // This is handled separately in T104
    }

    // Update campaign
    const [updatedCampaign] = await db.update(campaigns)
      .set(updateData)
      .where(eq(campaigns.id, params.id))
      .returning()

    return NextResponse.json({
      campaign: {
        ...updatedCampaign,
        keyPainPoints: JSON.parse(updatedCampaign.keyPainPoints || '[]'),
      },
    })
  } catch (error) {
    console.error('Failed to update campaign:', error)

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
        error: 'Failed to update campaign',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/campaigns/[id]
 * Deletes a campaign and stops its webhook subscription
 */
export async function DELETE(request: NextRequest, props: RouteParams) {
  const params = await props.params
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

    // Get user
    const user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify campaign ownership
    const campaign = await db.query.campaigns.findFirst({
      where: and(
        eq(campaigns.id, params.id),
        eq(campaigns.userId, user.id)
      ),
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Stop webhook subscription if active
    const subscription = await db.query.webhookSubscriptions.findFirst({
      where: eq(webhookSubscriptions.campaignId, params.id),
    })

    if (subscription && subscription.status === 'active') {
      try {
        await stopWebhookSubscription(
          subscription.googleChannelId,
          subscription.googleResourceId,
          session.access_token
        )
      } catch (webhookError) {
        console.error('Failed to stop webhook subscription:', webhookError)
        // Continue with campaign deletion even if webhook stop fails
      }
    }

    // Delete campaign (cascade will delete webhook subscription)
    await db.delete(campaigns).where(eq(campaigns.id, params.id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete campaign:', error)

    return NextResponse.json(
      {
        error: 'Failed to delete campaign',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
