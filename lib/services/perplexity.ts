import { RetryAfterError, NonRetriableError } from 'inngest';

export interface CompanyResearchData {
  name?: string;
  industry?: string;
  employeeCount?: string;
  revenue?: string;
  fundingStage?: string;
  headquarters?: string;
  website?: string;
  recentNews?: string[];
  [key: string]: unknown;
}

export interface ProspectResearchData {
  email: string; // Always include email to match back to prospect
  name?: string;
  title?: string;
  companyName?: string;
  location?: string;
  background?: string;
  recentActivity?: string[];
  linkedinUrl?: string;
  [key: string]: unknown;
}

interface PerplexityResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Research a company using Perplexity API
 * @param companyDomain - The company domain (e.g., "acmecorp.com")
 * @returns Structured company research data
 * @throws RetryAfterError when rate limited (429)
 * @throws NonRetriableError for 4xx errors
 * @throws Error for 5xx errors (retryable)
 */
export async function researchCompany(
  companyDomain: string
): Promise<CompanyResearchData> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    throw new NonRetriableError('PERPLEXITY_API_KEY is not configured');
  }

  const prompt = `Research the company at domain "${companyDomain}".

IMPORTANT: You MUST visit the actual company website at ${companyDomain} and browse it thoroughly. Do not rely only on third-party sources.

Provide the following information in JSON format:
- name: Company name (from their website)
- industry: Industry classification
- employeeCount: Employee count range (e.g., "50-200")
- revenue: Revenue range if available
- fundingStage: Funding stage (e.g., "Series B")
- headquarters: HQ location
- website: Full company website URL
- recentNews: Array of recent developments (last 90 days)

Focus on factual, verified information from the company's actual website and recent news sources. If information is not available, use null.
Return ONLY valid JSON, no additional text.`;

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content:
            'You are a sales research assistant. Always browse the live web and visit company websites directly. Use multiple authoritative sources and include recent information. Provide factual, cited information in JSON format only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 2000,
      search_mode: 'web',
      search_context_size: 'high',
      search_recency_filter: 'month',
      search_domain_filter: [companyDomain, 'linkedin.com', 'crunchbase.com'],
      return_related_questions: false,
    }),
  });

  // Handle rate limiting
  if (response.status === 429) {
    const retryAfter = response.headers.get('retry-after') || '60';
    throw new RetryAfterError(
      'Rate limited by Perplexity API',
      `${retryAfter}s`
    );
  }

  // Handle client errors (don't retry)
  if (response.status >= 400 && response.status < 500) {
    const error = await response.json();
    throw new NonRetriableError(
      `Perplexity API error: ${error.error || 'Invalid request'}`
    );
  }

  // Handle server errors (retry)
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Perplexity API error: ${error.error || 'Server error'}`);
  }

  const data: PerplexityResponse = await response.json();
  const content = data.choices[0].message.content;

  try {
    // Try to parse JSON response
    const parsed = JSON.parse(content);
    return parsed as CompanyResearchData;
  } catch (_e) {
    // If not valid JSON, try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]) as CompanyResearchData;
    }
    throw new Error('Failed to parse Perplexity response as JSON');
  }
}

/**
 * Research a prospect using Perplexity API
 * @param prospect - Prospect information (email, name, companyDomain)
 * @returns Structured prospect research data
 * @throws RetryAfterError when rate limited (429)
 * @throws NonRetriableError for 4xx errors
 * @throws Error for 5xx errors (retryable)
 */
export async function researchProspect(prospect: {
  email: string;
  name?: string;
  companyDomain?: string;
}): Promise<ProspectResearchData> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    throw new NonRetriableError('PERPLEXITY_API_KEY is not configured');
  }

  const identityInfo = [
    prospect.name,
    prospect.email,
    prospect.companyDomain && `at ${prospect.companyDomain}`,
  ]
    .filter(Boolean)
    .join(' ');

  const prompt = `Research the person: ${identityInfo}.

IMPORTANT: Search for this person on LinkedIn and other professional networks. Find their actual profile and recent activity.

Provide the following information in JSON format:
- name: Full name
- title: Current job title
- companyName: Current company name
- location: Geographic location
- background: Brief professional background summary (2-3 sentences)
- recentActivity: Array of recent professional activities (LinkedIn posts, speaking engagements, articles, etc. from last 3 months)
- linkedinUrl: LinkedIn profile URL if available

Focus on professional information only from authoritative sources. If information is not available, use null.
Return ONLY valid JSON, no additional text.`;

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content:
            'You are a professional research assistant. Always browse the live web and search LinkedIn, company websites, and professional networks directly. Provide factual information about business professionals in JSON format only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 1500,
      search_mode: 'web',
      search_context_size: 'high',
      search_recency_filter: 'month',
      search_domain_filter: ['linkedin.com', 'twitter.com', 'x.com'],
      return_related_questions: false,
    }),
  });

  // Handle rate limiting
  if (response.status === 429) {
    const retryAfter = response.headers.get('retry-after') || '60';
    throw new RetryAfterError(
      'Rate limited by Perplexity API',
      `${retryAfter}s`
    );
  }

  // Handle client errors (don't retry)
  if (response.status >= 400 && response.status < 500) {
    const error = await response.json();
    throw new NonRetriableError(
      `Perplexity API error: ${error.error || 'Invalid request'}`
    );
  }

  // Handle server errors (retry)
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Perplexity API error: ${error.error || 'Server error'}`);
  }

  const data: PerplexityResponse = await response.json();
  const content = data.choices[0].message.content;

  try {
    // Try to parse JSON response
    const parsed = JSON.parse(content);
    return parsed as ProspectResearchData;
  } catch (_e) {
    // If not valid JSON, try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]) as ProspectResearchData;
    }
    throw new Error('Failed to parse Perplexity response as JSON');
  }
}
