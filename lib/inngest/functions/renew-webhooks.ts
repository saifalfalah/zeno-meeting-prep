import { inngest } from '../client'
import { db } from '@/lib/db/client'
import { webhookSubscriptions } from '@/lib/db/schema'
import { lt, eq, and } from 'drizzle-orm'
import { createWebhookSubscription } from '@/lib/services/google-calendar'

/**
 * Cron function to renew webhook subscriptions before they expire
 * Runs daily at midnight UTC
 *
 * Google Calendar webhooks expire after 7 days (we set them to 6 days)
 * This function finds webhooks expiring within 24 hours and renews them
 */
export const renewWebhookSubscriptions = inngest.createFunction(
  {
    id: 'renew-webhook-subscriptions',
    name: 'Renew Webhook Subscriptions',
  },
  // Run daily at midnight UTC
  { cron: '0 0 * * *' },
  async ({ step, logger }) => {
    // Find webhooks expiring within next 24 hours
    const expiringWebhooks = await step.run('find-expiring-webhooks', async () => {
      const now = new Date()
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      logger.info('Checking for expiring webhooks', {
        now: now.toISOString(),
        tomorrow: tomorrow.toISOString(),
      })

      const expiring = await db.query.webhookSubscriptions.findMany({
        where: and(
          eq(webhookSubscriptions.status, 'active'),
          lt(webhookSubscriptions.expiresAt, tomorrow)
        ),
        with: {
          campaign: {
            with: {
              user: true,
            },
          },
        },
      })

      logger.info(`Found ${expiring.length} expiring webhooks`)

      return expiring
    })

    // Renew each webhook
    const results = []

    for (const webhook of expiringWebhooks) {
      const result = await step.run(`renew-webhook-${webhook.id}`, async () => {
        // Skip if campaign is paused
        if (webhook.campaign.status === 'paused') {
          logger.info(`Skipping renewal for paused campaign ${webhook.campaign.id}`, {
            campaignName: webhook.campaign.name,
          })

          return {
            webhookId: webhook.id,
            campaignId: webhook.campaign.id,
            status: 'skipped',
            reason: 'Campaign is paused',
          }
        }

        try {
          // Get fresh access token from user
          const user = webhook.campaign.user

          if (!user.googleAccessToken) {
            throw new Error('User has no access token')
          }

          // Create new webhook subscription
          const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/google-calendar`

          logger.info(`Creating new webhook subscription for campaign ${webhook.campaign.id}`, {
            calendarId: webhook.campaign.googleCalendarId,
            webhookUrl,
          })

          const newSubscription = await createWebhookSubscription(
            webhook.campaign.googleCalendarId,
            webhookUrl,
            user.googleAccessToken
          )

          const expiresAt = new Date(parseInt(newSubscription.expiration))

          logger.info(`New webhook created, expires at ${expiresAt.toISOString()}`)

          // Delete old webhook record
          await db.delete(webhookSubscriptions).where(eq(webhookSubscriptions.id, webhook.id))

          // Create new webhook record
          await db.insert(webhookSubscriptions).values({
            campaignId: webhook.campaign.id,
            googleResourceId: newSubscription.resourceId,
            googleChannelId: newSubscription.id,
            expiresAt,
            status: 'active',
          })

          logger.info(`Successfully renewed webhook for campaign ${webhook.campaign.id}`)

          return {
            webhookId: webhook.id,
            campaignId: webhook.campaign.id,
            status: 'renewed',
            newExpiresAt: expiresAt.toISOString(),
          }
        } catch (error) {
          logger.error(`Failed to renew webhook for campaign ${webhook.campaign.id}`, {
            error: error instanceof Error ? error.message : 'Unknown error',
          })

          // Mark webhook as expired
          await db
            .update(webhookSubscriptions)
            .set({ status: 'expired', updatedAt: new Date() })
            .where(eq(webhookSubscriptions.id, webhook.id))

          return {
            webhookId: webhook.id,
            campaignId: webhook.campaign.id,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          }
        }
      })

      results.push(result)
    }

    // Summary
    const renewed = results.filter((r) => r.status === 'renewed').length
    const failed = results.filter((r) => r.status === 'failed').length
    const skipped = results.filter((r) => r.status === 'skipped').length

    logger.info('Webhook renewal complete', {
      total: results.length,
      renewed,
      failed,
      skipped,
    })

    return {
      total: results.length,
      renewed,
      failed,
      skipped,
      details: results,
    }
  }
)
