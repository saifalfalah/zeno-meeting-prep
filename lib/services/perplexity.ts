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

  const prompt = `Research the company "${companyDomain}". Provide the following information in JSON format:
- name: Company name
- industry: Industry classification
- employeeCount: Employee count range (e.g., "50-200")
- revenue: Revenue range if available
- fundingStage: Funding stage (e.g., "Series B")
- headquarters: HQ location
- website: Company website URL
- recentNews: Array of recent developments (last 90 days)

Focus on factual, verified information. If information is not available, use null.
Return ONLY valid JSON, no additional text.`;

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-sonar-large-128k-online',
      messages: [
        {
          role: 'system',
          content:
            'You are a business research assistant. Provide factual, cited information in JSON format only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 2000,
      search_context_size: 10,
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

  const prompt = `Research the person: ${identityInfo}. Provide the following information in JSON format:
- name: Full name
- title: Current job title
- companyName: Current company name
- location: Geographic location
- background: Brief professional background summary
- recentActivity: Array of recent professional activities (LinkedIn posts, speaking engagements, etc.)
- linkedinUrl: LinkedIn profile URL if available

Focus on professional information only. If information is not available, use null.
Return ONLY valid JSON, no additional text.`;

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-sonar-large-128k-online',
      messages: [
        {
          role: 'system',
          content:
            'You are a professional research assistant. Provide factual information about business professionals in JSON format only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 1500,
      search_context_size: 10,
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
