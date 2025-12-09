import { inngest } from '../client';
import { RetryAfterError } from 'inngest';
import { db } from '@/lib/db/client';
import { meetings, adHocResearchRequests, researchBriefs, prospectInfo, researchSources, campaigns, companies, prospects } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { orchestrateResearch } from '@/lib/services/research';

/**
 * Generate research brief using Perplexity and Claude APIs
 * Triggered by: research/generate.requested
 */
export const generateResearch = inngest.createFunction(
  {
    id: 'generate-research',
    name: 'Generate Research Brief',
    retries: 4,
    onFailure: async ({ error, event, step }) => {
      // Send failure notification
      await step.run('mark-research-failed', async () => {
        const eventData = event.data as unknown as {
          type: 'calendar' | 'adhoc';
          meetingId?: string;
          adHocRequestId?: string;
        };

        if (eventData.type === 'calendar' && eventData.meetingId) {
          await db.update(meetings)
            .set({
              researchStatus: 'failed',
              researchFailureReason: error.message,
              updatedAt: new Date(),
            })
            .where(eq(meetings.id, eventData.meetingId));
        } else if (eventData.type === 'adhoc' && eventData.adHocRequestId) {
          await db.update(adHocResearchRequests)
            .set({
              status: 'failed',
              failureReason: error.message,
              updatedAt: new Date(),
            })
            .where(eq(adHocResearchRequests.id, eventData.adHocRequestId));
        }
      });
    },
  },
  { event: 'research/generate.requested' },
  async ({ event, step }) => {
    const { type, meetingId, adHocRequestId, campaignId, prospects } = event.data;

    // Step 1: Update status to generating
    await step.run('update-status-generating', async () => {
      if (type === 'calendar' && meetingId) {
        await db.update(meetings)
          .set({ researchStatus: 'generating', updatedAt: new Date() })
          .where(eq(meetings.id, meetingId));
      } else if (type === 'adhoc' && adHocRequestId) {
        await db.update(adHocResearchRequests)
          .set({ status: 'generating', updatedAt: new Date() })
          .where(eq(adHocResearchRequests.id, adHocRequestId));
      }
      return { updated: true };
    });

    // Step 2: Fetch campaign context
    const campaignContext = await step.run('fetch-campaign-context', async () => {
      const campaign = await db.query.campaigns.findFirst({
        where: eq(campaigns.id, campaignId),
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      return {
        companyName: campaign.companyName,
        companyDescription: campaign.companyDescription || undefined,
        offeringTitle: campaign.offeringTitle,
        offeringDescription: campaign.offeringDescription,
        targetCustomer: campaign.targetCustomer || undefined,
        keyPainPoints: campaign.keyPainPoints ? JSON.parse(campaign.keyPainPoints as string) : undefined,
      };
    });

    // Step 3: Orchestrate research (Perplexity + Claude)
    const researchResult = await step.run('orchestrate-research', async () => {
      try {
        return await orchestrateResearch({
          campaignContext,
          prospects,
        });
      } catch (error) {
        // Check if it's a rate limit error
        if (error instanceof RetryAfterError) {
          throw error;
        }
        // Otherwise, continue with whatever data we have
        console.error('Research orchestration failed:', error);
        throw error;
      }
    });

    // Step 4: Store company data if we have it
    const companyId = await step.run('store-company-data', async () => {
      if (researchResult.companyResearch.name) {
        // Extract domain from first prospect email
        const domain = prospects[0]?.email?.split('@')[1];
        if (!domain) return null;

        // Check if company exists
        let company = await db.query.companies.findFirst({
          where: eq(companies.domain, domain),
        });

        if (company) {
          // Update existing company
          await db.update(companies)
            .set({
              name: researchResult.companyResearch.name,
              industry: researchResult.companyResearch.industry || null,
              employeeCount: researchResult.companyResearch.employeeCount || null,
              revenue: researchResult.companyResearch.revenue || null,
              fundingStage: researchResult.companyResearch.fundingStage || null,
              headquarters: researchResult.companyResearch.headquarters || null,
              website: researchResult.companyResearch.website || null,
              lastResearchedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(companies.id, company.id));
        } else {
          // Create new company
          const [newCompany] = await db.insert(companies).values({
            domain,
            name: researchResult.companyResearch.name,
            industry: researchResult.companyResearch.industry || null,
            employeeCount: researchResult.companyResearch.employeeCount || null,
            revenue: researchResult.companyResearch.revenue || null,
            fundingStage: researchResult.companyResearch.fundingStage || null,
            headquarters: researchResult.companyResearch.headquarters || null,
            website: researchResult.companyResearch.website || null,
            lastResearchedAt: new Date(),
          }).returning();
          company = newCompany;
        }

        return company.id;
      }
      return null;
    });

    // Step 5: Create research brief record
    const briefId = await step.run('create-brief-record', async () => {
      const [brief] = await db.insert(researchBriefs).values({
        type,
        campaignId,
        meetingId: type === 'calendar' ? meetingId : null,
        adHocRequestId: type === 'adhoc' ? adHocRequestId : null,
        confidenceRating: researchResult.brief.confidenceRating,
        confidenceExplanation: researchResult.brief.confidenceExplanation,
        companyOverview: researchResult.brief.companyOverview || null,
        painPoints: researchResult.brief.painPoints || null,
        howWeFit: researchResult.brief.howWeFit || null,
        openingLine: researchResult.brief.openingLine || null,
        discoveryQuestions: researchResult.brief.discoveryQuestions
          ? JSON.stringify(researchResult.brief.discoveryQuestions)
          : null,
        successOutcome: researchResult.brief.successOutcome || null,
        watchOuts: researchResult.brief.watchOuts || null,
        recentSignals: researchResult.brief.recentSignals
          ? JSON.stringify(researchResult.brief.recentSignals)
          : null,
        generatedAt: new Date(),
      }).returning();

      // Store prospect info for each researched prospect
      for (const prospectData of researchResult.prospectResearch) {
        if (prospectData.name) {
          // Find prospect by email
          const prospect = await db.query.prospects.findFirst({
            where: eq(prospects.email, prospectData.name), // This should match by email from the input
          });

          if (prospect) {
            await db.insert(prospectInfo).values({
              researchBriefId: brief.id,
              prospectId: prospect.id,
              title: prospectData.title || null,
              location: prospectData.location || null,
              background: prospectData.background || null,
              reportsTo: null,
              teamSize: null,
              recentActivity: null,
            });
          }
        }
      }

      // Store research sources (placeholder - would be extracted from Perplexity citations)
      if (researchResult.companyResearch.website) {
        await db.insert(researchSources).values({
          researchBriefId: brief.id,
          sourceType: 'company_website',
          url: researchResult.companyResearch.website,
          title: `${researchResult.companyResearch.name} Website`,
          accessedAt: new Date(),
        });
      }

      return brief.id;
    });

    // Step 6: Update meeting/ad-hoc status to ready
    await step.run('update-status-ready', async () => {
      if (type === 'calendar' && meetingId) {
        await db.update(meetings)
          .set({
            researchStatus: 'ready',
            researchBriefId: briefId,
            updatedAt: new Date(),
          })
          .where(eq(meetings.id, meetingId));
      } else if (type === 'adhoc' && adHocRequestId) {
        await db.update(adHocResearchRequests)
          .set({
            status: 'ready',
            researchBriefId: briefId,
            updatedAt: new Date(),
          })
          .where(eq(adHocResearchRequests.id, adHocRequestId));
      }
      return { updated: true };
    });

    return {
      briefId,
      confidenceRating: researchResult.brief.confidenceRating,
      prospectsResearched: researchResult.prospectResearch.length,
      companyId,
    };
  }
);
