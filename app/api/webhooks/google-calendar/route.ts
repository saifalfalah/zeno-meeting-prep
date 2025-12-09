import { NextRequest, NextResponse } from 'next/server'
import { inngest } from '@/lib/inngest/client'
import { db } from '@/lib/db/client'
import { webhookSubscriptions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

/**
 * POST /api/webhooks/google-calendar
 * Receives webhook notifications from Google Calendar
 */
export async function POST(request: NextRequest) {
  try {
    // Get webhook headers
    const channelId = request.headers.get('x-goog-channel-id')
    const resourceId = request.headers.get('x-goog-resource-id')
    const resourceState = request.headers.get('x-goog-resource-state')
    const resourceUri = request.headers.get('x-goog-resource-uri')

    if (!channelId || !resourceId) {
      return NextResponse.json(
        { error: 'Missing required webhook headers' },
        { status: 400 }
      )
    }

    console.log('Received webhook:', {
      channelId,
      resourceId,
      resourceState,
      resourceUri,
    })

    // Find the webhook subscription
    const subscription = await db.query.webhookSubscriptions.findFirst({
      where: eq(webhookSubscriptions.googleChannelId, channelId),
      with: {
        campaign: {
          with: {
            user: true,
          },
        },
      },
    })

    if (!subscription || !subscription.campaign) {
      console.log('Webhook subscription not found')
      return NextResponse.json({ received: true })
    }

    // Update last notification time
    await db
      .update(webhookSubscriptions)
      .set({ lastNotificationAt: new Date() })
      .where(eq(webhookSubscriptions.id, subscription.id))

    // Handle different resource states
    if (resourceState === 'sync') {
      // Initial sync notification - just acknowledge
      console.log('Sync notification received')
      return NextResponse.json({ received: true })
    }

    if (resourceState === 'exists') {
      // Calendar event was created, updated, or deleted
      console.log('Event change notification received')

      // Trigger webhook processing
      // Note: We don't have the specific event ID from the webhook,
      // so we need to fetch recent events from the calendar
      await inngest.send({
        name: 'calendar/webhook.received',
        data: {
          channelId,
          resourceId,
          resourceState,
          campaignId: subscription.campaign.id,
          userId: subscription.campaign.userId,
        },
      })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/webhooks/google-calendar
 * Webhook verification endpoint (for testing)
 */
export async function GET() {
  return NextResponse.json({ status: 'webhook endpoint active' })
}
