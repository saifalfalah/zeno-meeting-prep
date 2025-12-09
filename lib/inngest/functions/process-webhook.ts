/**
 * Process Google Calendar Webhook
 *
 * This function processes incoming webhook notifications from Google Calendar.
 * It fetches the event details and triggers research if needed.
 */

import { inngest } from '../client'
import { db } from '../../db/client'
import { campaigns, meetings, webhookSubscriptions, meetingProspects, prospects } from '../../db/schema'
import { eq, and } from 'drizzle-orm'
import { getCalendarEvent, getExternalAttendees } from '../../services/google-calendar'

export const processWebhook = inngest.createFunction(
  {
    id: 'process-webhook',
    name: 'Process Google Calendar Webhook',
    retries: 3,
  },
  { event: 'calendar/webhook.received' },
  async ({ event, step }) => {
    const { channelId, resourceId } = event.data

    // Step 1: Find the webhook subscription and campaign
    const subscription = await step.run('find-subscription', async () => {
      return await db.query.webhookSubscriptions.findFirst({
        where: and(
          eq(webhookSubscriptions.googleChannelId, channelId),
          eq(webhookSubscriptions.googleResourceId, resourceId)
        ),
        with: {
          campaign: true,
        },
      })
    })

    if (!subscription || !subscription.campaign) {
      console.log('Webhook subscription not found or inactive')
      return { skipped: true, reason: 'subscription_not_found' }
    }

    // Check if campaign is active
    if (subscription.campaign.status !== 'active') {
      console.log('Campaign is paused, skipping webhook')
      return { skipped: true, reason: 'campaign_paused' }
    }

    // Step 2: Get user's access token (would need to store this)
    // For now, we'll need to handle this differently
    // This is a simplified version - in production, we'd need proper token storage

    const campaign = subscription.campaign

    // Step 3: Fetch recent calendar events
    // Since we don't have the specific event ID from the webhook,
    // we'll need to fetch recent events and process them
    // This is handled by the webhook endpoint which will pass event IDs

    return {
      processed: true,
      campaignId: campaign.id,
      message: 'Webhook received and campaign identified',
    }
  }
)

export const processCalendarEvent = inngest.createFunction(
  {
    id: 'process-calendar-event',
    name: 'Process Calendar Event',
    retries: 3,
  },
  { event: 'calendar/event.detected' },
  async ({ event, step }) => {
    const { campaignId, eventId, accessToken } = event.data

    // Step 1: Get campaign
    const campaign = await step.run('get-campaign', async () => {
      return await db.query.campaigns.findFirst({
        where: eq(campaigns.id, campaignId),
      })
    })

    if (!campaign) {
      throw new Error('Campaign not found')
    }

    // Step 2: Fetch event details from Google Calendar
    const calendarEvent = await step.run('fetch-calendar-event', async () => {
      return await getCalendarEvent(
        campaign.googleCalendarId,
        eventId,
        accessToken
      )
    })

    // Step 3: Check for external attendees
    const externalAttendees = getExternalAttendees(
      calendarEvent.attendees || [],
      campaign.companyDomain
    )

    if (externalAttendees.length === 0) {
      console.log('No external attendees found, skipping')
      return { skipped: true, reason: 'no_external_attendees' }
    }

    // Step 4: Create or update meeting record
    const meeting = await step.run('create-or-update-meeting', async () => {
      // Check if meeting already exists
      const existing = await db.query.meetings.findFirst({
        where: and(
          eq(meetings.campaignId, campaignId),
          eq(meetings.googleEventId, eventId)
        ),
      })

      const meetingData = {
        title: calendarEvent.summary || 'Untitled Meeting',
        description: calendarEvent.description || null,
        startTime: new Date(calendarEvent.start.dateTime || calendarEvent.start.date!),
        endTime: new Date(calendarEvent.end.dateTime || calendarEvent.end.date!),
        timezone: calendarEvent.start.timeZone || 'UTC',
        location: calendarEvent.location || null,
        meetLink: calendarEvent.hangoutLink || null,
        status: (calendarEvent.status === 'cancelled' ? 'cancelled' : 'scheduled') as 'scheduled' | 'cancelled' | 'completed',
        hasExternalAttendees: true,
      }

      if (existing) {
        // Update existing meeting
        const [updated] = await db
          .update(meetings)
          .set(meetingData)
          .where(eq(meetings.id, existing.id))
          .returning()

        return updated
      } else {
        // Create new meeting
        const [created] = await db
          .insert(meetings)
          .values({
            campaignId,
            googleEventId: eventId,
            ...meetingData,
            researchStatus: 'pending',
          })
          .returning()

        return created
      }
    })

    // Step 5: Create prospect records and link to meeting
    await step.run('create-prospects', async () => {
      for (const attendee of externalAttendees) {
        // Create or get prospect
        const [prospect] = await db
          .insert(prospects)
          .values({
            email: attendee.email,
            name: attendee.displayName || attendee.email.split('@')[0],
          })
          .onConflictDoUpdate({
            target: prospects.email,
            set: {
              name: attendee.displayName || attendee.email.split('@')[0],
            },
          })
          .returning()

        // Link prospect to meeting
        await db
          .insert(meetingProspects)
          .values({
            meetingId: meeting.id,
            prospectId: prospect.id,
            responseStatus: attendee.responseStatus as 'accepted' | 'declined' | 'tentative' | 'needsAction' | null,
          })
          .onConflictDoNothing()
      }
    })

    // Step 6: Trigger research generation
    await step.run('trigger-research', async () => {
      // Only trigger if meeting hasn't been researched yet
      if (meeting.researchStatus === 'pending' || meeting.researchStatus === 'none') {
        await inngest.send({
          name: 'research/generate.requested',
          data: {
            meetingId: meeting.id,
            campaignId: campaign.id,
          },
        })
      }
    })

    return {
      processed: true,
      meetingId: meeting.id,
      externalAttendeeCount: externalAttendees.length,
      researchTriggered: meeting.researchStatus === 'pending' || meeting.researchStatus === 'none',
    }
  }
)
