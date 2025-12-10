import { researchCompany, researchProspect, type CompanyResearchData, type ProspectResearchData } from './perplexity';
import { generateResearchBrief, type ResearchBriefData, type CampaignContext } from './claude';

export type ResearchFailureStep =
  | 'prospect_lookup_failed'
  | 'company_lookup_failed'
  | 'brief_generation_failed'
  | 'unknown';

export interface ResearchError extends Error {
  step: ResearchFailureStep;
  details?: string;
}

export interface ResearchResult {
  brief: ResearchBriefData;
  prospectResearch: ProspectResearchData[];
  companyResearch: CompanyResearchData;
  isPartialData?: boolean;
}

export interface ProspectInput {
  email: string;
  name?: string;
  companyDomain?: string;
  website?: string;
}

/**
 * Orchestrate the full research pipeline:
 * 1. Research all prospects in parallel
 * 2. Research unique companies (deduplicated)
 * 3. Generate research brief using Claude
 *
 * @param input - Campaign context and prospects to research
 * @returns Complete research result with brief and source data
 */
export async function orchestrateResearch(input: {
  campaignContext: CampaignContext;
  prospects: ProspectInput[];
}): Promise<ResearchResult> {
  const { campaignContext, prospects } = input;

  // Step 1: Extract unique company domains
  const companyDomains = new Set<string>();
  prospects.forEach((prospect) => {
    const domain = prospect.companyDomain || extractDomainFromEmail(prospect.email);
    if (domain) {
      companyDomains.add(domain);
    }
  });

  // Step 2: Research all prospects in parallel (with error handling)
  const prospectResearchPromises = prospects.map(async (prospect) => {
    try {
      const domain = prospect.companyDomain || extractDomainFromEmail(prospect.email);
      return await researchProspect({
        email: prospect.email,
        name: prospect.name,
        companyDomain: domain,
      });
    } catch (error) {
      console.error(`Failed to research prospect ${prospect.email}:`, error);
      // Return partial data to continue with other prospects
      return null;
    }
  });

  const prospectResearchResults = await Promise.all(prospectResearchPromises);
  const successfulProspectResearch = prospectResearchResults.filter(
    (result): result is ProspectResearchData => result !== null
  );

  // Track if we have partial data
  const failedProspectCount = prospectResearchResults.filter(r => r === null).length;
  const hasProspectFailures = failedProspectCount > 0;

  // Step 3: Research companies in parallel (with error handling)
  // Only research the first company domain found (typically all prospects are from same company)
  const primaryCompanyDomain = Array.from(companyDomains)[0];
  let companyResearch: CompanyResearchData = {};
  let companyLookupFailed = false;

  if (primaryCompanyDomain) {
    try {
      companyResearch = await researchCompany(primaryCompanyDomain);
    } catch (error) {
      console.error(`Failed to research company ${primaryCompanyDomain}:`, error);
      companyLookupFailed = true;
      // Continue with empty company data
    }
  }

  // Step 4: Generate research brief using Claude
  let brief: ResearchBriefData;
  const isPartialData = hasProspectFailures || companyLookupFailed || successfulProspectResearch.length === 0;

  try {
    brief = await generateResearchBrief({
      campaignContext,
      companyResearch,
      prospectResearch: successfulProspectResearch,
    });

    // Override confidence to LOW if we have partial data
    if (isPartialData && brief.confidenceRating !== 'LOW') {
      brief = {
        ...brief,
        confidenceRating: 'LOW',
        confidenceExplanation: brief.confidenceExplanation
          ? `${brief.confidenceExplanation} Note: Some research data was unavailable or incomplete.`
          : 'Limited information available. Some research data was unavailable or incomplete.',
      };
    }
  } catch (error) {
    // If brief generation fails but we have some data, try to create a minimal brief
    if (isPartialData && (successfulProspectResearch.length > 0 || Object.keys(companyResearch).length > 0)) {
      console.warn('Brief generation failed but partial data available, creating minimal brief');
      brief = {
        confidenceRating: 'LOW',
        confidenceExplanation: 'Minimal information available due to research limitations.',
        companyOverview: companyResearch.name ? `${companyResearch.name} (limited information)` : 'Company information unavailable',
        painPoints: 'Unable to determine specific pain points.',
        howWeFit: 'Further research needed to determine fit.',
        openingLine: 'Thank you for taking the time to meet.',
        discoveryQuestions: ['Can you tell me about your current situation?', 'What challenges are you facing?'],
        successOutcome: 'Establish rapport and gather information.',
        watchOuts: 'Limited background information available.',
        recentSignals: [],
      };
    } else {
      // No usable data at all, throw error
      const researchError = new Error(
        `Failed to generate research brief: ${error instanceof Error ? error.message : 'Unknown error'}`
      ) as ResearchError;
      researchError.step = 'brief_generation_failed';
      researchError.details = error instanceof Error ? error.message : undefined;
      throw researchError;
    }
  }

  return {
    brief,
    prospectResearch: successfulProspectResearch,
    companyResearch,
    isPartialData,
  };
}

/**
 * Extract domain from email address
 * @param email - Email address
 * @returns Domain or undefined if invalid email
 */
function extractDomainFromEmail(email: string): string | undefined {
  const match = email.match(/@(.+)$/);
  return match ? match[1].toLowerCase() : undefined;
}
