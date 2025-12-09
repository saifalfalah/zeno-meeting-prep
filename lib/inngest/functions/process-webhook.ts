import { inngest } from '../client';
import { NonRetriableError, RetryAfterError } from 'inngest';
import { db } from '@/lib/db/client';
import { webhookSubscriptions, campaigns, meetings, prospects, meetingProspects } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { listCalendarEvents } from '@/lib/services/google-calendar';

/**
 * Process Google Calendar webhook notifications
 * Triggered by: calendar/webhook.received
 */
export const processWebhook = inngest.createFunction(
  {
    id: 'process-webhook',
    name: 'Process Google Calendar Webhook',
    retries: 3,
  },
  { event: 'calendar/webhook.received' },
  async ({ event, step }) => {
    const { channelId, resourceId, resourceState, campaignId, calendarId } = event.data;

    // Step 1: Validate webhook
    const validation = await step.run('validate-webhook', async () => {
      // Check if subscription exists and is active
      const subscription = await db.query.webhookSubscriptions.findFirst({
        where: and(
          eq(webhookSubscriptions.googleChannelId, channelId),
          eq(webhookSubscriptions.googleResourceId, resourceId),
          eq(webhookSubscriptions.status, 'active')
        ),
      });

      if (!subscription) {
        throw new NonRetriableError('Webhook subscription not found or inactive');
      }

      // Check if campaign is active
      const campaign = await db.query.campaigns.findFirst({
        where: and(
          eq(campaigns.id, campaignId),
          eq(campaigns.status, 'active')
        ),
      });

      if (!campaign) {
        throw new NonRetriableError('Campaign not found or inactive');
      }

      // Update last notification time
      await db.update(webhookSubscriptions)
        .set({ lastNotificationAt: new Date() })
        .where(eq(webhookSubscriptions.id, subscription.id));

      return { valid: true, campaignId: campaign.id, userId: campaign.userId };
    });

    // Skip sync notifications (initial webhook setup)
    if (resourceState === 'sync') {
      return { message: 'Sync notification received, no action needed' };
    }

    // Step 2: Fetch calendar changes
    const calendarEvents = await step.run('fetch-calendar-changes', async () => {
      try {
        // Fetch recent events from Google Calendar
        // Get user's access token from session/database
        const campaign = await db.query.campaigns.findFirst({
          where: eq(campaigns.id, campaignId),
          with: {
            user: true,
          },
        });

        if (!campaign?.user?.googleAccessToken) {
          throw new Error('User access token not found');
        }

        const events = await listCalendarEvents(
          calendarId,
          campaign.user.googleAccessToken,
          {
            maxResults: 50,
            singleEvents: true,
          }
        );

        return { events };
      } catch (error) {
        if ((error as { status?: number }).status === 429) {
          throw new RetryAfterError('Rate limited by Google Calendar API', '60s');
        }
        throw error;
      }
    });

    // Step 3: Process each event
    const processedEvents = [];
    for (const calEvent of calendarEvents.events) {
      const result = await step.run(`process-event-${calEvent.id}`, async () => {
        // Check if event has external attendees
        const internalDomain = await db.query.campaigns.findFirst({
          where: eq(campaigns.id, campaignId),
          columns: { companyDomain: true },
        });

        const externalAttendees = (calEvent.attendees || []).filter(
          (attendee: { email: string }) =>
            !attendee.email.endsWith(`@${internalDomain?.companyDomain}`)
        );

        const hasExternalAttendees = externalAttendees.length > 0;

        // Find or create meeting
        let meeting = await db.query.meetings.findFirst({
          where: and(
            eq(meetings.campaignId, campaignId),
            eq(meetings.googleEventId, calEvent.id)
          ),
        });

        const isNewMeeting = !meeting;

        // T089: Track existing attendees for detecting new additions
        const existingProspectEmails = meeting
          ? await db.query.meetingProspects.findMany({
              where: eq(meetingProspects.meetingId, meeting.id),
              with: {
                prospect: true,
              },
            }).then((mps) => mps.map((mp) => mp.prospect.email))
          : [];

        if (!meeting) {
          // Create new meeting
          const [newMeeting] = await db.insert(meetings).values({
            campaignId,
            googleEventId: calEvent.id,
            title: calEvent.summary || 'Untitled Meeting',
            description: calEvent.description,
            startTime: new Date(calEvent.start.dateTime || calEvent.start.date || new Date()),
            endTime: new Date(calEvent.end.dateTime || calEvent.end.date || new Date()),
            timezone: calEvent.start.timeZone || 'UTC',
            location: calEvent.location,
            meetLink: calEvent.hangoutLink,
            status: calEvent.status === 'cancelled' ? 'cancelled' : 'scheduled',
            researchStatus: hasExternalAttendees ? 'pending' : 'none',
            hasExternalAttendees,
          }).returning();
          meeting = newMeeting;
        } else {
          // Update existing meeting - T088: preserve research status on reschedule
          // Only update meeting details (time, location, etc.) without affecting research
          await db.update(meetings)
            .set({
              title: calEvent.summary || 'Untitled Meeting',
              description: calEvent.description,
              startTime: new Date(calEvent.start.dateTime || calEvent.start.date || new Date()),
              endTime: new Date(calEvent.end.dateTime || calEvent.end.date || new Date()),
              timezone: calEvent.start.timeZone || 'UTC',
              location: calEvent.location,
              meetLink: calEvent.hangoutLink,
              status: calEvent.status === 'cancelled' ? 'cancelled' : 'scheduled',
              hasExternalAttendees,
              updatedAt: new Date(),
            })
            .where(eq(meetings.id, meeting.id));
          // Note: researchStatus and researchBriefId are intentionally NOT updated
          // This preserves existing research when meeting is rescheduled
        }

        // Process prospect relationships and track new attendees (T089)
        const newAttendeeEmails: string[] = [];

        for (const attendee of externalAttendees) {
          // Find or create prospect
          let prospect = await db.query.prospects.findFirst({
            where: eq(prospects.email, attendee.email),
          });

          if (!prospect) {
            const [newProspect] = await db.insert(prospects).values({
              email: attendee.email,
              name: attendee.displayName,
            }).returning();
            prospect = newProspect;
          }

          // Create meeting-prospect relationship
          const existingRelation = await db.query.meetingProspects.findFirst({
            where: and(
              eq(meetingProspects.meetingId, meeting!.id),
              eq(meetingProspects.prospectId, prospect.id)
            ),
          });

          if (!existingRelation) {
            const validResponseStatuses = ['accepted', 'declined', 'tentative', 'needsAction'] as const;
            const responseStatus = attendee.responseStatus && validResponseStatuses.includes(attendee.responseStatus as typeof validResponseStatuses[number])
              ? (attendee.responseStatus as typeof validResponseStatuses[number])
              : 'needsAction';

            await db.insert(meetingProspects).values({
              meetingId: meeting!.id,
              prospectId: prospect.id,
              isOrganizer: attendee.organizer || false,
              responseStatus,
            });

            // T089: Track new attendee added to existing meeting
            if (!isNewMeeting && !existingProspectEmails.includes(attendee.email)) {
              newAttendeeEmails.push(attendee.email);
            }
          }
        }

        // T089: Determine if incremental research should be triggered
        const hasNewAttendees = newAttendeeEmails.length > 0;
        const shouldTriggerIncrementalResearch =
          !isNewMeeting &&
          hasNewAttendees &&
          meeting!.researchStatus === 'ready'; // Only trigger if previous research is complete

        return {
          meetingId: meeting!.id,
          hasExternalAttendees,
          isNewMeeting,
          externalAttendeesCount: externalAttendees.length,
          hasNewAttendees,
          newAttendeeEmails,
          shouldTriggerIncrementalResearch,
        };
      });

      processedEvents.push(result);
    }

    // Step 4: Trigger research for new meetings with external attendees
    // OR trigger incremental research for new attendees (T089)
    for (const event of processedEvents) {
      const shouldTriggerResearch =
        (event.hasExternalAttendees && event.isNewMeeting) ||
        event.shouldTriggerIncrementalResearch;

      if (shouldTriggerResearch) {
        await step.run(`trigger-research-${event.meetingId}`, async () => {
          // Fetch meeting with prospects
          const meeting = await db.query.meetings.findFirst({
            where: eq(meetings.id, event.meetingId),
            with: {
              meetingProspects: {
                with: {
                  prospect: true,
                },
              },
            },
          });

          if (!meeting) return { researchTriggered: false, isIncremental: false };

          // T089: For incremental research, only research new attendees
          const prospectsToResearch = event.shouldTriggerIncrementalResearch
            ? meeting.meetingProspects
                .filter((mp) => event.newAttendeeEmails?.includes(mp.prospect.email))
                .map((mp) => ({
                  email: mp.prospect.email,
                  name: mp.prospect.name || undefined,
                  companyDomain: undefined, // Will be extracted from email
                }))
            : meeting.meetingProspects.map((mp) => ({
                email: mp.prospect.email,
                name: mp.prospect.name || undefined,
                companyDomain: undefined, // Will be extracted from email
              }));

          // Send research generation event
          await inngest.send({
            name: 'research/generate.requested',
            data: {
              type: 'calendar',
              meetingId: meeting.id,
              campaignId,
              prospects: prospectsToResearch,
              isIncremental: event.shouldTriggerIncrementalResearch || false,
              requestedAt: new Date().toISOString(),
            },
          });

          return {
            researchTriggered: true,
            isIncremental: event.shouldTriggerIncrementalResearch || false,
          };
        });
      }
    }

    return {
      processedEvents: processedEvents.length,
      researchTriggered: processedEvents.filter(
        (e) => (e.hasExternalAttendees && e.isNewMeeting) || e.shouldTriggerIncrementalResearch
      ).length,
      incrementalResearchTriggered: processedEvents.filter((e) => e.shouldTriggerIncrementalResearch).length,
    };
  }
);
