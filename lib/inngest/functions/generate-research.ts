/**
 * Generate Research Brief
 *
 * This function generates a research brief for a meeting or ad-hoc request.
 * It uses Perplexity for research and Claude for synthesis.
 */

import { inngest } from '../client'
import { db } from '../../db/client'
import { meetings, adHocResearchRequests } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { conductResearch } from '../../services/research'
import { NonRetriableError, RetryAfterError } from 'inngest'

export const generateResearch = inngest.createFunction(
  {
    id: 'generate-research',
    name: 'Generate Research Brief',
    retries: 4,
    onFailure: async ({ error, event }) => {
      // Send notification about failure
      console.error('Research generation failed:', error)

      // Update the meeting/request status to failed
      const { meetingId, adHocRequestId } = event.data.event.data

      const failureReason = error.message || 'Research generation failed'

      if (meetingId) {
        await db
          .update(meetings)
          .set({
            researchStatus: 'failed',
            researchFailureReason: failureReason,
          })
          .where(eq(meetings.id, meetingId))
      } else if (adHocRequestId) {
        await db
          .update(adHocResearchRequests)
          .set({
            status: 'failed',
            failureReason,
          })
          .where(eq(adHocResearchRequests.id, adHocRequestId))
      }
    },
  },
  { event: 'research/generate.requested' },
  async ({ event, step }) => {
    const { meetingId, adHocRequestId } = event.data

    if (!meetingId && !adHocRequestId) {
      throw new NonRetriableError('Either meetingId or adHocRequestId is required')
    }

    // Step 1: Get the meeting or ad-hoc request
    const target = await step.run('get-research-target', async () => {
      if (meetingId) {
        const meeting = await db.query.meetings.findFirst({
          where: eq(meetings.id, meetingId),
          with: {
            prospects: {
              with: {
                prospect: true,
              },
            },
          },
        })

        if (!meeting) {
          throw new NonRetriableError('Meeting not found')
        }

        // Update status to generating
        await db
          .update(meetings)
          .set({ researchStatus: 'generating' })
          .where(eq(meetings.id, meetingId))

        return {
          type: 'meeting' as const,
          campaignId: meeting.campaignId,
          meetingId: meeting.id,
          prospectEmails: meeting.prospects.map((p) => p.prospect.email),
          prospectNames: meeting.prospects.map((p) => p.prospect.name || p.prospect.email),
          companyDomain: undefined,
          companyName: undefined,
        }
      } else {
        const request = await db.query.adHocResearchRequests.findFirst({
          where: eq(adHocResearchRequests.id, adHocRequestId!),
        })

        if (!request) {
          throw new NonRetriableError('Ad-hoc request not found')
        }

        // Update status to generating
        await db
          .update(adHocResearchRequests)
          .set({ status: 'generating' })
          .where(eq(adHocResearchRequests.id, adHocRequestId!))

        // Parse prospect info
        const prospectEmails = request.email ? [request.email] : []
        const prospectNames = request.prospectName ? [request.prospectName] : []

        // Infer company domain from email if not provided
        let companyDomain = undefined
        let companyName = request.companyName || undefined

        if (request.email && !companyName) {
          const emailDomain = request.email.split('@')[1]
          if (emailDomain) {
            companyDomain = emailDomain
            companyName = emailDomain.split('.')[0] // Basic inference
          }
        }

        return {
          type: 'adhoc' as const,
          campaignId: request.campaignId,
          adHocRequestId: request.id,
          prospectEmails,
          prospectNames,
          companyDomain,
          companyName,
        }
      }
    })

    // Step 2: Conduct research with retry logic for rate limits
    const result = await step.run('conduct-research', async () => {
      try {
        return await conductResearch(target)
      } catch (error) {
        // Check if it's a rate limit error
        if (
          error instanceof Error &&
          (error.message.includes('429') || error.message.includes('rate limit'))
        ) {
          // Retry after 60 seconds
          throw new RetryAfterError('Rate limited by API', '60s')
        }

        // Check if it's a 4xx error (don't retry)
        if (
          error instanceof Error &&
          error.message.match(/40[0-9]/) &&
          !error.message.includes('429')
        ) {
          throw new NonRetriableError(error.message)
        }

        // Network or 5xx errors should be retried
        throw error
      }
    })

    return {
      success: true,
      briefId: result.briefId,
      confidenceRating: result.confidenceRating,
      prospectCount: result.prospectCount,
      companyResearched: result.companyResearched,
    }
  }
)
