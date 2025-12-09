import { NextRequest, NextResponse } from 'next/server';
import { inngest } from '@/lib/inngest/client';

/**
 * Google Calendar Webhook Endpoint
 * Receives notifications when calendar events change
 *
 * POST /api/webhooks/google-calendar
 */
export async function POST(request: NextRequest) {
  try {
    // Extract Google webhook headers
    const channelId = request.headers.get('x-goog-channel-id');
    const resourceId = request.headers.get('x-goog-resource-id');
    const resourceState = request.headers.get('x-goog-resource-state');
    const resourceUri = request.headers.get('x-goog-resource-uri');

    if (!channelId || !resourceId || !resourceState) {
      return NextResponse.json(
        { error: 'Missing required webhook headers' },
        { status: 400 }
      );
    }

    // Extract campaign ID and calendar ID from channel ID
    // Format: campaignId:calendarId
    const [campaignId, calendarId] = channelId.split(':');

    if (!campaignId || !calendarId) {
      return NextResponse.json(
        { error: 'Invalid channel ID format' },
        { status: 400 }
      );
    }

    // Send event to Inngest for processing
    await inngest.send({
      name: 'calendar/webhook.received',
      data: {
        channelId,
        resourceId,
        resourceState,
        campaignId,
        calendarId,
        resourceUri: resourceUri || '',
        receivedAt: new Date().toISOString(),
      },
    });

    // Return 200 immediately to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);

    // Return 200 even on error to prevent Google from retrying
    // The error will be handled by Inngest
    return NextResponse.json({ received: true, error: 'Processing failed' });
  }
}

/**
 * Handle verification challenges from Google (if implemented)
 */
export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
