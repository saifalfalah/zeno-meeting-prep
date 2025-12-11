import {
  performMultiPassResearch,
  type CompanyResearchData,
  type ProspectResearchData,
  type MultiPassResearchResult
} from './perplexity';
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
  multiPassResults?: MultiPassResearchResult[];
}

export interface ProspectInput {
  email: string;
  name?: string;
  companyDomain?: string;
  website?: string;
}

/**
 * Orchestrate the full research pipeline (T062-T063):
 * 1. Use multi-pass research for each prospect (company website, company news, prospect background)
 * 2. Aggregate multi-pass results into structured company and prospect data
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

  // T062: Use performMultiPassResearch for each prospect
  const multiPassPromises = prospects.map(async (prospect) => {
    try {
      let domain = prospect.companyDomain;
      let companyName: string | undefined;

      // Prioritize website for domain extraction
      if (!domain && prospect.website) {
        domain = extractDomainFromWebsite(prospect.website);
      }

      // Fallback to email domain
      if (!domain && prospect.email) {
        domain = extractDomainFromEmail(prospect.email);
      }

      // Extract company name from email if not provided
      if (!companyName && domain) {
        companyName = domain.split('.')[0];
      }

      return await performMultiPassResearch(
        {
          prospectName: prospect.name,
          prospectEmail: prospect.email,
          companyName,
          companyDomain: domain,
          website: prospect.website,
        },
        {
          // Use default timeouts from PERPLEXITY_CONFIG
        }
      );
    } catch (error) {
      console.error(`Failed to perform multi-pass research for ${prospect.email || prospect.name}:`, error);
      // Return null to continue with other prospects
      return null;
    }
  });

  const multiPassResults = await Promise.all(multiPassPromises);
  const successfulMultiPassResults = multiPassResults.filter(
    (result): result is MultiPassResearchResult => result !== null
  );

  // T062: Aggregate multi-pass results into structured data for Claude
  // Extract prospect research data from multi-pass results
  const prospectResearch: ProspectResearchData[] = successfulMultiPassResults.map((multiPass) => {
    const prospectData: ProspectResearchData = {};

    // Combine data from all three passes
    if (multiPass.prospectBackgroundPass) {
      // Primary source: prospect background pass
      try {
        const parsed = JSON.parse(multiPass.prospectBackgroundPass.content);
        Object.assign(prospectData, parsed);
      } catch {
        // If not JSON, store as background text
        prospectData.background = multiPass.prospectBackgroundPass.content;
      }
    }

    // Add sources from all passes
    prospectData.sources = [
      ...(multiPass.companyWebsitePass?.sources || []),
      ...(multiPass.companyNewsPass?.sources || []),
      ...(multiPass.prospectBackgroundPass?.sources || []),
    ];

    prospectData.metadata = multiPass.metadata;

    return prospectData;
  });

  // Extract company research data from multi-pass results
  // Use the first successful multi-pass result for company data
  const primaryMultiPass = successfulMultiPassResults[0];
  const companyResearch: CompanyResearchData = {};

  if (primaryMultiPass) {
    if (primaryMultiPass.companyWebsitePass) {
      try {
        const parsed = JSON.parse(primaryMultiPass.companyWebsitePass.content);
        Object.assign(companyResearch, parsed);
      } catch {
        // If not JSON, store as basic company data
        companyResearch.website = primaryMultiPass.companyWebsitePass.content;
      }
    }

    // Enhance with company news data
    if (primaryMultiPass.companyNewsPass) {
      try {
        const parsed = JSON.parse(primaryMultiPass.companyNewsPass.content);
        if (parsed.recentNews) {
          companyResearch.recentNews = parsed.recentNews;
        }
      } catch {
        // If not JSON, add as single news item
        if (!companyResearch.recentNews) {
          companyResearch.recentNews = [];
        }
        companyResearch.recentNews.push(primaryMultiPass.companyNewsPass.content);
      }
    }

    // Add aggregated sources and metadata
    companyResearch.sources = [
      ...(primaryMultiPass.companyWebsitePass?.sources || []),
      ...(primaryMultiPass.companyNewsPass?.sources || []),
    ];
    companyResearch.metadata = primaryMultiPass.metadata;
  }

  // T063: Track if we have partial data from multi-pass research
  const failedMultiPassCount = multiPassResults.filter(r => r === null).length;
  const hasMultiPassFailures = failedMultiPassCount > 0;
  const hasPartialMultiPassData = successfulMultiPassResults.some(r => r.isPartialData);
  const isPartialData = hasMultiPassFailures || hasPartialMultiPassData || successfulMultiPassResults.length === 0;

  // T064: Log comprehensive operation details
  if (process.env.NODE_ENV === 'development') {
    console.warn('[Research] Multi-pass orchestration completed', {
      totalProspects: prospects.length,
      successfulMultiPass: successfulMultiPassResults.length,
      failedMultiPass: failedMultiPassCount,
      isPartialData,
      operationLogs: successfulMultiPassResults.flatMap(r => r.operationLogs || []),
    });
  }

  // Step 3: Generate research brief using Claude
  let brief: ResearchBriefData;

  try {
    brief = await generateResearchBrief({
      campaignContext,
      companyResearch,
      prospectResearch,
    });

    // T063: Override confidence to LOW if we have partial data
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
    // T063: If brief generation fails but we have some data, try to create a minimal brief
    if (isPartialData && (prospectResearch.length > 0 || Object.keys(companyResearch).length > 0)) {
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
    prospectResearch,
    companyResearch,
    isPartialData,
    multiPassResults: successfulMultiPassResults,
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

/**
 * Extract domain from website URL
 * @param website - Website URL (can be full URL or bare domain)
 * @returns Domain or undefined if invalid URL
 */
function extractDomainFromWebsite(website: string): string | undefined {
  try {
    // Try parsing as-is
    let url: URL;
    try {
      url = new URL(website);
    } catch {
      // Try with https:// prefix for bare domains
      url = new URL(`https://${website}`);
    }

    // Extract domain (without www)
    let hostname = url.hostname.replace(/^www\./, '');

    // Extract base domain (e.g., acme.com from subdomain.acme.com)
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      hostname = parts.slice(-2).join('.');
    }

    return hostname.toLowerCase();
  } catch (error) {
    console.warn('Failed to extract domain from website:', website, error);
    return undefined;
  }
}
