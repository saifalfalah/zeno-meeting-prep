/**
 * Research Orchestration Service
 *
 * Coordinates the research process:
 * 1. Fetch company data from Perplexity
 * 2. Fetch prospect data from Perplexity
 * 3. Synthesize into brief using Claude
 * 4. Store in database
 */

import { db } from '../db/client'
import {
  companies,
  prospects,
  researchBriefs,
  prospectInfo,
  meetings,
  adHocResearchRequests,
} from '../db/schema'
import { eq } from 'drizzle-orm'
import { researchCompany, researchProspect } from './perplexity'
import { generateResearchBrief } from './claude'
import { isExternalEmail } from './google-calendar'

export interface ResearchTarget {
  type: 'meeting' | 'adhoc'
  campaignId: string
  meetingId?: string
  adHocRequestId?: string
  companyDomain?: string
  companyName?: string
  prospectEmails: string[]
  prospectNames?: string[]
}

export interface ResearchResult {
  briefId: string
  confidenceRating: 'HIGH' | 'MEDIUM' | 'LOW'
  prospectCount: number
  companyResearched: boolean
}

/**
 * Orchestrates the complete research process for a meeting or ad-hoc request
 */
export async function conductResearch(
  target: ResearchTarget
): Promise<ResearchResult> {
  try {
    // Get campaign context
    const campaign = await db.query.campaigns.findFirst({
      where: (campaigns, { eq }) => eq(campaigns.id, target.campaignId),
    })

    if (!campaign) {
      throw new Error('Campaign not found')
    }

    // Step 1: Research company
    let companyData = null
    let companyId = null
    let companyResearched = false

    if (target.companyDomain || target.companyName) {
      const domain = target.companyDomain
      const name = target.companyName || 'Unknown Company'

      // Check if company already researched recently (24 hour cache)
      if (domain) {
        const existingCompany = await db.query.companies.findFirst({
          where: eq(companies.domain, domain),
        })

        const cacheValid =
          existingCompany?.lastResearchedAt &&
          Date.now() - existingCompany.lastResearchedAt.getTime() <
            24 * 60 * 60 * 1000

        if (cacheValid) {
          companyData = existingCompany
          companyId = existingCompany.id
          companyResearched = false // Used cache
        }
      }

      // Research if not cached
      if (!companyData) {
        const research = await researchCompany(name, domain)

        // Store/update company
        if (domain) {
          const [company] = await db
            .insert(companies)
            .values({
              domain,
              name: research.companyName,
              industry: research.industry,
              employeeCount: research.employeeCount,
              revenue: research.revenue,
              fundingStage: research.fundingStage,
              headquarters: research.headquarters,
              lastResearchedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: companies.domain,
              set: {
                name: research.companyName,
                industry: research.industry,
                employeeCount: research.employeeCount,
                revenue: research.revenue,
                fundingStage: research.fundingStage,
                headquarters: research.headquarters,
                lastResearchedAt: new Date(),
              },
            })
            .returning()

          companyData = {
            ...company,
            ...research,
          }
          companyId = company.id
        } else {
          companyData = research
        }
        companyResearched = true
      }
    }

    // Step 2: Research prospects
    const prospectResearch = []
    const prospectIds: string[] = []

    for (let i = 0; i < target.prospectEmails.length; i++) {
      const email = target.prospectEmails[i]
      const name = target.prospectNames?.[i] || email.split('@')[0]

      // Check if prospect already researched recently
      const existingProspect = await db.query.prospects.findFirst({
        where: eq(prospects.email, email),
      })

      const cacheValid =
        existingProspect?.lastResearchedAt &&
        Date.now() - existingProspect.lastResearchedAt.getTime() <
          7 * 24 * 60 * 60 * 1000 // 7 day cache

      let prospectData

      if (cacheValid && existingProspect) {
        prospectData = existingProspect
        prospectIds.push(existingProspect.id)
      } else {
        // Research prospect
        const research = await researchProspect(
          name,
          email,
          target.companyName || companyData?.companyName
        )

        // Store/update prospect
        const [prospect] = await db
          .insert(prospects)
          .values({
            email,
            name: research.name,
            title: research.title,
            companyId,
            location: research.location,
            linkedinUrl: research.linkedinUrl,
            lastResearchedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: prospects.email,
            set: {
              name: research.name,
              title: research.title,
              companyId,
              location: research.location,
              linkedinUrl: research.linkedinUrl,
              lastResearchedAt: new Date(),
            },
          })
          .returning()

        prospectData = { ...prospect, ...research }
        prospectIds.push(prospect.id)
      }

      prospectResearch.push(prospectData)
    }

    // Step 3: Generate brief using Claude
    const companyOverview = companyData
      ? `${companyData.companyName || companyData.name || 'Company'} is ${companyData.industry || 'a company'} with ${companyData.employeeCount || 'unknown'} employees. ${companyData.marketPosition || ''} ${companyData.growthTrajectory || ''}`
      : 'Limited company information available.'

    const prospectInfoTexts = prospectResearch.map((p) => {
      return `${p.name} - ${p.title || 'Role unknown'} ${p.location ? `based in ${p.location}` : ''}. ${p.background || ''} ${p.recentActivity || ''}`
    })

    const brief = await generateResearchBrief({
      companyOverview,
      prospectInfo: prospectInfoTexts,
      campaignContext: {
        companyName: campaign.companyName,
        companyDescription: campaign.companyDescription || '',
        offeringTitle: campaign.offeringTitle,
        offeringDescription: campaign.offeringDescription,
        targetCustomer: campaign.targetCustomer || '',
        keyPainPoints: JSON.parse(campaign.keyPainPoints || '[]'),
      },
    })

    // Step 4: Store research brief
    const [researchBrief] = await db
      .insert(researchBriefs)
      .values({
        type: target.type === 'meeting' ? 'calendar' : 'adhoc',
        campaignId: target.campaignId,
        meetingId: target.meetingId || null,
        adHocRequestId: target.adHocRequestId || null,
        confidenceRating: brief.confidenceRating,
        confidenceExplanation: brief.confidenceExplanation,
        companyOverview: brief.companyOverview,
        painPoints: brief.painPoints,
        howWeFit: brief.howWeFit,
        openingLine: brief.openingLine,
        discoveryQuestions: JSON.stringify(brief.discoveryQuestions),
        successOutcome: brief.successOutcome,
        watchOuts: brief.watchOuts,
        recentSignals: JSON.stringify(brief.recentSignals),
        generatedAt: new Date(),
      })
      .returning()

    // Store prospect info snapshots
    for (let i = 0; i < prospectIds.length; i++) {
      const prospectId = prospectIds[i]
      const research = prospectResearch[i]

      await db.insert(prospectInfo).values({
        researchBriefId: researchBrief.id,
        prospectId,
        title: research.title,
        location: research.location,
        background: research.background || null,
        reportsTo: research.reportsTo || null,
        teamSize: research.teamSize || null,
        recentActivity: research.recentActivity || null,
      })
    }

    // Update meeting/ad-hoc request status
    if (target.meetingId) {
      await db
        .update(meetings)
        .set({
          researchStatus: 'ready',
          researchBriefId: researchBrief.id,
          researchFailureReason: null,
        })
        .where(eq(meetings.id, target.meetingId))
    } else if (target.adHocRequestId) {
      await db
        .update(adHocResearchRequests)
        .set({
          status: 'ready',
          researchBriefId: researchBrief.id,
          failureReason: null,
        })
        .where(eq(adHocResearchRequests.id, target.adHocRequestId))
    }

    return {
      briefId: researchBrief.id,
      confidenceRating: brief.confidenceRating,
      prospectCount: prospectIds.length,
      companyResearched,
    }
  } catch (error) {
    console.error('Research failed:', error)

    // Update meeting/ad-hoc request with failure
    const failureReason = error instanceof Error ? error.message : 'Unknown error'

    if (target.meetingId) {
      await db
        .update(meetings)
        .set({
          researchStatus: 'failed',
          researchFailureReason: failureReason,
        })
        .where(eq(meetings.id, target.meetingId))
    } else if (target.adHocRequestId) {
      await db
        .update(adHocResearchRequests)
        .set({
          status: 'failed',
          failureReason,
        })
        .where(eq(adHocResearchRequests.id, target.adHocRequestId))
    }

    throw error
  }
}

/**
 * Determines if a meeting should trigger research
 */
export function shouldTriggerResearch(
  attendeeEmails: string[],
  companyDomain: string
): boolean {
  // Check if there are any external attendees
  const externalAttendees = attendeeEmails.filter((email) =>
    isExternalEmail(email, companyDomain)
  )

  return externalAttendees.length > 0
}
