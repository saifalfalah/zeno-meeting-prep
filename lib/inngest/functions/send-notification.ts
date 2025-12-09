import { inngest } from '../client';
import { db } from '@/lib/db/client';
import { meetings, adHocResearchRequests } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Send email notification when research completes or fails
 * Triggered by: research/notification.send
 *
 * This is an optional feature for US5 (T098)
 */
export const sendResearchNotification = inngest.createFunction(
  {
    id: 'send-research-notification',
    name: 'Send Research Notification',
    retries: 2,
  },
  { event: 'research/notification.send' },
  async ({ event, step }) => {
    const { type, meetingId, adHocRequestId, status } = event.data;

    // Step 1: Fetch the relevant data
    const notificationData = await step.run('fetch-notification-data', async () => {
      if (type === 'calendar' && meetingId) {
        const meeting = await db.query.meetings.findFirst({
          where: eq(meetings.id, meetingId),
          with: {
            campaign: {
              with: {
                user: true,
              },
            },
            researchBrief: true,
          },
        });

        if (!meeting?.campaign?.user) {
          throw new Error('Meeting or user not found');
        }

        return {
          type: 'calendar' as const,
          userEmail: meeting.campaign.user.email,
          userName: meeting.campaign.user.name || 'User',
          meetingTitle: meeting.title,
          meetingStartTime: meeting.startTime.toISOString(),
          status: meeting.researchStatus,
          failureReason: meeting.researchFailureReason,
          briefId: meeting.researchBriefId,
        };
      } else if (type === 'adhoc' && adHocRequestId) {
        const request = await db.query.adHocResearchRequests.findFirst({
          where: eq(adHocResearchRequests.id, adHocRequestId),
          with: {
            user: true,
            campaign: true,
            researchBrief: true,
          },
        });

        if (!request?.user) {
          throw new Error('Ad-hoc request or user not found');
        }

        return {
          type: 'adhoc' as const,
          userEmail: request.user.email,
          userName: request.user.name || 'User',
          prospectName: request.prospectName || 'Unknown',
          companyName: request.companyName,
          status: request.status,
          failureReason: request.failureReason,
          briefId: request.researchBriefId,
        };
      }

      throw new Error('Invalid notification type');
    });

    // Step 2: Prepare email content based on status
    const emailContent = await step.run('prepare-email-content', async () => {
      if (status === 'ready') {
        const subject = notificationData.type === 'calendar'
          ? `Research Brief Ready: ${notificationData.meetingTitle}`
          : `Ad-Hoc Research Brief Ready: ${notificationData.prospectName}`;

        const details = notificationData.type === 'calendar'
          ? `Meeting: ${notificationData.meetingTitle}\nTime: ${new Date(notificationData.meetingStartTime).toLocaleString()}`
          : `Prospect: ${notificationData.prospectName}${notificationData.companyName ? `\nCompany: ${notificationData.companyName}` : ''}`;

        return {
          subject,
          body: `
            Hi ${notificationData.userName},

            Your research brief is ready!

            ${details}

            View your brief: ${process.env.NEXT_PUBLIC_APP_URL}/meetings/${meetingId || adHocRequestId}

            Best regards,
            Pre-Call Intelligence Dashboard
          `,
        };
      } else if (status === 'failed') {
        const subject = notificationData.type === 'calendar'
          ? `Research Failed: ${notificationData.meetingTitle}`
          : `Research Failed: ${notificationData.prospectName}`;

        const details = notificationData.type === 'calendar'
          ? `Meeting: ${notificationData.meetingTitle}\nTime: ${new Date(notificationData.meetingStartTime).toLocaleString()}`
          : `Prospect: ${notificationData.prospectName}${notificationData.companyName ? `\nCompany: ${notificationData.companyName}` : ''}`;

        return {
          subject,
          body: `
            Hi ${notificationData.userName},

            Unfortunately, we couldn't complete the research for your ${notificationData.type === 'calendar' ? 'meeting' : 'ad-hoc request'}.

            ${details}

            Error: ${notificationData.failureReason}

            You can retry the research from the dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/meetings/${meetingId || adHocRequestId}

            Best regards,
            Pre-Call Intelligence Dashboard
          `,
        };
      }

      throw new Error('Invalid notification status');
    });

    // Step 3: Send email notification
    // NOTE: This is a placeholder. In production, integrate with:
    // - SendGrid
    // - AWS SES
    // - Resend
    // - Postmark
    // etc.
    await step.run('send-email', async () => {
      // Log for development purposes
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log('📧 Email notification prepared (not sent - email service not configured):', {
          to: notificationData.userEmail,
          subject: emailContent.subject,
        });
      }

      // Example with Resend (commented out):
      // const { Resend } = require('resend');
      // const resend = new Resend(process.env.RESEND_API_KEY);
      //
      // await resend.emails.send({
      //   from: 'noreply@yourdomain.com',
      //   to: notificationData.userEmail,
      //   subject: emailContent.subject,
      //   text: emailContent.body,
      // });

      return {
        sent: false, // Set to true when email service is configured
        recipient: notificationData.userEmail,
      };
    });

    return {
      notificationSent: false, // Would be true in production
      recipient: notificationData.userEmail,
      status,
    };
  }
);
