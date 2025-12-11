import { inngest } from '../client';
import { RetryAfterError } from 'inngest';
import { db } from '@/lib/db/client';
import { meetings, adHocResearchRequests, researchBriefs, prospectInfo, researchSources, campaigns, companies, prospects } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { orchestrateResearch, type ResearchError } from '@/lib/services/research';

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

        // Extract failure step from ResearchError if available
        const researchError = error as ResearchError;
        const failureStep = researchError.step || 'unknown';
        const failureMessage = `[${failureStep}] ${error.message}`;

        if (eventData.type === 'calendar' && eventData.meetingId) {
          await db.update(meetings)
            .set({
              researchStatus: 'failed',
              researchFailureReason: failureMessage,
              updatedAt: new Date(),
            })
            .where(eq(meetings.id, eventData.meetingId));
        } else if (eventData.type === 'adhoc' && eventData.adHocRequestId) {
          await db.update(adHocResearchRequests)
            .set({
              status: 'failed',
              failureReason: failureMessage,
              updatedAt: new Date(),
            })
            .where(eq(adHocResearchRequests.id, eventData.adHocRequestId));
        }
      });
    },
  },
  { event: 'research/generate.requested' },
  async ({ event, step }) => {
    const { type, meetingId, adHocRequestId, campaignId, prospects, isIncremental } = event.data;

    // Step 0: T090 - Check for cached research (7-day cache)
    const cachedResearch = await step.run('check-cached-research', async () => {
      // Skip cache for ad-hoc requests and incremental research
      if (type === 'adhoc' || isIncremental) {
        return { hasCachedResearch: false, cachedBriefId: null };
      }

      // Check if we have recent research for this meeting's prospects
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Get prospect emails
      const prospectEmails = prospects.map((p: { email: string }) => p.email);

      if (prospectEmails.length === 0) {
        return { hasCachedResearch: false, cachedBriefId: null };
      }

      // Find recent meetings with the same prospects
      const recentMeetingsWithSameProspects = await db.query.meetings.findFirst({
        where: and(
          eq(meetings.campaignId, campaignId),
          eq(meetings.researchStatus, 'ready')
        ),
        with: {
          meetingProspects: {
            with: {
              prospect: true,
            },
          },
          researchBrief: true,
        },
        orderBy: (meetings, { desc }) => [desc(meetings.createdAt)],
      });

      if (!recentMeetingsWithSameProspects?.researchBrief) {
        return { hasCachedResearch: false, cachedBriefId: null };
      }

      // Check if the prospects match and research is within 7 days
      const cachedProspectEmails = recentMeetingsWithSameProspects.meetingProspects
        .map((mp) => mp.prospect.email)
        .sort();
      const currentProspectEmails = prospectEmails.sort();

      const prospectsMatch =
        cachedProspectEmails.length === currentProspectEmails.length &&
        cachedProspectEmails.every((email, i) => email === currentProspectEmails[i]);

      const isWithinSevenDays =
        new Date(recentMeetingsWithSameProspects.researchBrief.generatedAt) > sevenDaysAgo;

      if (prospectsMatch && isWithinSevenDays) {
        return {
          hasCachedResearch: true,
          cachedBriefId: recentMeetingsWithSameProspects.researchBrief.id,
        };
      }

      return { hasCachedResearch: false, cachedBriefId: null };
    });

    // If cached research exists, reuse it
    if (cachedResearch.hasCachedResearch && cachedResearch.cachedBriefId && type === 'calendar' && meetingId) {
      await step.run('reuse-cached-research', async () => {
        await db.update(meetings)
          .set({
            researchStatus: 'ready',
            researchBriefId: cachedResearch.cachedBriefId,
            updatedAt: new Date(),
          })
          .where(eq(meetings.id, meetingId));
      });

      return {
        briefId: cachedResearch.cachedBriefId,
        cached: true,
        message: 'Reused cached research from within 7 days',
      };
    }

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
    // T067-T068: Apply new Perplexity configuration (sonar-pro, multi-pass) with comprehensive logging
    // T070: 5-minute timeout enforced by performMultiPassResearch (60s per pass, 180s total, with 5min hard max)
    const researchResult = await step.run('orchestrate-research', async () => {
      const startTime = Date.now();

      try {
        // Starting multi-pass research with sonar-pro model
        const result = await orchestrateResearch({
          campaignContext,
          prospects,
        });

        const durationMs = Date.now() - startTime;

        // Log completion for monitoring
        if (result.isPartialData) {
          console.warn('[generate-research] Multi-pass research completed with partial data', {
            durationMs,
            prospectResearchCount: result.prospectResearch.length,
            confidenceRating: result.brief.confidenceRating,
          });
        }

        return result;
      } catch (error) {
        const durationMs = Date.now() - startTime;
        console.error('[generate-research] Research orchestration failed', {
          durationMs,
          error: error instanceof Error ? error.message : 'Unknown error',
          type,
        });

        // T069: Check if it's a rate limit error
        if (error instanceof RetryAfterError) {
          console.warn('[generate-research] Rate limit encountered, will retry', {
            retryAfter: (error as any).retryAfter,
          });
          throw error;
        }

        // Otherwise, throw to trigger retry or failure handler
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
    // T069: Mark brief as partial if some research passes failed
    const briefId = await step.run('create-brief-record', async () => {
      // Log partial data condition
      if (researchResult.isPartialData) {
        console.warn('[generate-research] Creating research brief with partial data', {
          confidenceRating: researchResult.brief.confidenceRating,
          prospectResearchCount: researchResult.prospectResearch.length,
        });
      }

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
