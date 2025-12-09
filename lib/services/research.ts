import { researchCompany, researchProspect, type CompanyResearchData, type ProspectResearchData } from './perplexity';
import { generateResearchBrief, type ResearchBriefData, type CampaignContext } from './claude';

export interface ResearchResult {
  brief: ResearchBriefData;
  prospectResearch: ProspectResearchData[];
  companyResearch: CompanyResearchData;
}

export interface ProspectInput {
  email: string;
  name?: string;
  companyDomain?: string;
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

  // Step 3: Research companies in parallel (with error handling)
  // Only research the first company domain found (typically all prospects are from same company)
  const primaryCompanyDomain = Array.from(companyDomains)[0];
  let companyResearch: CompanyResearchData = {};

  if (primaryCompanyDomain) {
    try {
      companyResearch = await researchCompany(primaryCompanyDomain);
    } catch (error) {
      console.error(`Failed to research company ${primaryCompanyDomain}:`, error);
      // Continue with empty company data
    }
  }

  // Step 4: Generate research brief using Claude
  const brief = await generateResearchBrief({
    campaignContext,
    companyResearch,
    prospectResearch: successfulProspectResearch,
  });

  return {
    brief,
    prospectResearch: successfulProspectResearch,
    companyResearch,
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
