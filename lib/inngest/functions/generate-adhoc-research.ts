import { inngest } from '../client'
import { extractDomain } from '@/lib/utils/email'

/**
 * Generate research brief for ad-hoc requests
 * Triggered by: research/generate.adhoc
 * Handles partial information and infers missing data
 */
export const generateAdHocResearch = inngest.createFunction(
  {
    id: 'generate-adhoc-research',
    name: 'Generate Ad-Hoc Research Brief',
    retries: 3,
  },
  { event: 'research/generate.adhoc' },
  async ({ event, step }) => {
    const { adHocRequestId, campaignId, prospectName, companyName, email } = event.data

    // Step 1: Infer company from email domain if not provided
    const inferredData = await step.run('infer-missing-data', async () => {
      let finalCompanyName = companyName
      let companyDomain: string | null = null

      // If email is provided, extract domain
      if (email) {
        companyDomain = extractDomain(email)

        // If company name not provided, infer from email domain
        if (!finalCompanyName && companyDomain) {
          // Simple heuristic: capitalize first letter of domain before TLD
          const domainParts = companyDomain.split('.')
          if (domainParts.length >= 2) {
            const companyPart = domainParts[0]
            finalCompanyName =
              companyPart.charAt(0).toUpperCase() + companyPart.slice(1)
          }
        }
      }

      return {
        finalProspectName: prospectName || null,
        finalCompanyName: finalCompanyName || null,
        finalEmail: email || null,
        companyDomain,
      }
    })

    // Step 2: Build prospects array for research service
    const prospects = []
    if (inferredData.finalEmail) {
      prospects.push({
        email: inferredData.finalEmail,
        name: inferredData.finalProspectName || undefined,
        companyDomain: inferredData.companyDomain || undefined,
      })
    } else if (inferredData.finalCompanyName) {
      // Company-only research
      prospects.push({
        email: `unknown@${inferredData.companyDomain || 'unknown.com'}`,
        name: inferredData.finalProspectName || undefined,
        companyDomain: inferredData.companyDomain || undefined,
      })
    }

    // Step 3: Trigger research generation
    await step.sendEvent('trigger-research-generation', {
      name: 'research/generate.requested',
      data: {
        type: 'adhoc',
        adHocRequestId,
        campaignId,
        prospects,
        requestedAt: new Date().toISOString(),
      },
    })

    return {
      success: true,
      inferredData,
      message: 'Ad-hoc research generation triggered',
    }
  }
)
