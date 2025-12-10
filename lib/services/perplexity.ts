import { RetryAfterError, NonRetriableError } from 'inngest';
import { withRetry } from '../utils/retry';
import { withTimeout } from '../utils/timeout';

export interface CompanyResearchData {
  name?: string;
  industry?: string;
  employeeCount?: string;
  revenue?: string;
  fundingStage?: string;
  headquarters?: string;
  website?: string;
  recentNews?: string[];
  sources?: ResearchSource[];
  metadata?: ResearchMetadata;
  [key: string]: unknown;
}

export interface ResearchSource {
  url: string;
  title?: string;
  snippet?: string;
}

export interface ResearchMetadata {
  model: string;
  totalTokens?: number;
  durationMs?: number;
  timestamp: string;
  usedDomainFilter?: boolean;
  fallbackOccurred?: boolean;
}

export interface PerplexityResearchConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
  systemMessage: string;
}

export interface ResearchPass {
  passNumber: number;
  name: string;
  prompt: string;
  searchDomainFilter?: string;
  result?: string;
  sources?: ResearchSource[];
  metadata?: ResearchMetadata;
  error?: string;
}

export interface ResearchOperationLog {
  operation: string;
  startTime: string;
  endTime?: string;
  durationMs?: number;
  status: 'success' | 'failed' | 'partial';
  details?: Record<string, unknown>;
}

// Perplexity API Configuration Constants
export const PERPLEXITY_CONFIG = {
  MODEL: 'sonar-pro',
  TEMPERATURE: {
    MIN: 0.1,
    MAX: 0.3,
    DEFAULT: 0.2,
  },
  MAX_TOKENS: {
    COMPANY_RESEARCH: 4000,
    PROSPECT_RESEARCH: 3000,
    DEFAULT: 2000,
  },
  TIMEOUT: {
    PER_PASS: 60000, // 60 seconds
    TOTAL_MULTI_PASS: 180000, // 3 minutes
    HARD_MAX: 300000, // 5 minutes
  },
  SYSTEM_MESSAGE: {
    WEB_BROWSING: 'You are a business research assistant. Browse the web to find factual, verified information. ALWAYS include citations and source URLs. Provide information in JSON format only.',
    COMPANY_RESEARCH: 'You are a business research assistant specializing in company research. Focus on factual, verified information from official company sources. ALWAYS include citations and source URLs. Provide information in JSON format only.',
    PROSPECT_RESEARCH: 'You are a professional research assistant specializing in researching business professionals. Focus on factual, publicly available professional information. ALWAYS include citations and source URLs. Provide information in JSON format only.',
  },
  RETRY: {
    MAX_ATTEMPTS: 3,
    INITIAL_DELAY_MS: 1000,
    MAX_DELAY_MS: 10000,
    BACKOFF_FACTOR: 2,
  },
} as const;

// Custom Error Classes
export class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class TimeoutError extends Error {
  constructor(
    message: string,
    public timeoutMs?: number
  ) {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class InsufficientDataError extends Error {
  constructor(
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'InsufficientDataError';
  }
}

export interface ProspectResearchData {
  name?: string;
  title?: string;
  companyName?: string;
  location?: string;
  background?: string;
  recentActivity?: string[];
  linkedinUrl?: string;
  sources?: ResearchSource[];
  metadata?: ResearchMetadata;
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

export interface ResearchCompanyOptions {
  searchDomainFilter?: string;
  includeDomainFallback?: boolean;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

/**
 * Research a company using Perplexity API with sonar-pro model
 * @param companyDomain - The company domain (e.g., "acmecorp.com")
 * @param options - Research options including domain filter, temperature, etc.
 * @returns Structured company research data with sources and metadata
 * @throws RetryAfterError when rate limited (429)
 * @throws NonRetriableError for 4xx errors
 * @throws Error for 5xx errors (retryable)
 */
export async function researchCompany(
  companyDomain: string,
  options: ResearchCompanyOptions = {}
): Promise<CompanyResearchData> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    throw new NonRetriableError('PERPLEXITY_API_KEY is not configured');
  }

  // Extract options with defaults
  const {
    searchDomainFilter,
    includeDomainFallback = false,
    temperature = PERPLEXITY_CONFIG.TEMPERATURE.DEFAULT,
    maxTokens = PERPLEXITY_CONFIG.MAX_TOKENS.COMPANY_RESEARCH,
    timeout = PERPLEXITY_CONFIG.TIMEOUT.PER_PASS,
  } = options;

  // T025: Log operation start
  const startTime = Date.now();
  if (process.env.NODE_ENV === 'development') {
    console.warn('[Perplexity] Starting company research', {
      companyDomain,
      searchDomainFilter,
      includeDomainFallback,
      temperature,
      maxTokens,
      timeout,
    });
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

  // Helper function to check if data is insufficient
  const isInsufficientData = (data: CompanyResearchData): boolean => {
    const criticalFields = [data.name, data.industry];
    const filledFields = criticalFields.filter(
      (field) => field !== null && field !== undefined && field !== ''
    );
    return filledFields.length < 2;
  };

  // T020-T024: Make API call with sonar-pro model and optional domain filter
  const makeApiCall = async (
    useDomainFilter: boolean
  ): Promise<{ data: CompanyResearchData; apiResponse: PerplexityResponse }> => {
    const requestBody: Record<string, unknown> = {
      model: PERPLEXITY_CONFIG.MODEL, // T020: Use sonar-pro
      messages: [
        {
          role: 'system',
          content: PERPLEXITY_CONFIG.SYSTEM_MESSAGE.COMPANY_RESEARCH, // T021: Explicit web browsing system message
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature,
      max_tokens: maxTokens,
      search_context_size: 10,
    };

    // T023: Add search_domain_filter if provided and useDomainFilter is true
    if (useDomainFilter && searchDomainFilter) {
      requestBody.search_domain_filter = [searchDomainFilter];
    }

    // T025: Log API call parameters
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Perplexity] API call parameters', {
        model: requestBody.model,
        temperature: requestBody.temperature,
        max_tokens: requestBody.max_tokens,
        search_domain_filter: requestBody.search_domain_filter,
      });
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
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

    const apiResponse: PerplexityResponse = await response.json();
    const content = apiResponse.choices[0].message.content;

    try {
      // Try to parse JSON response
      const parsed = JSON.parse(content);
      return { data: parsed as CompanyResearchData, apiResponse };
    } catch {
      // If not valid JSON, try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        return {
          data: JSON.parse(jsonMatch[1]) as CompanyResearchData,
          apiResponse,
        };
      }
      throw new Error('Failed to parse Perplexity response as JSON');
    }
  };

  // T024: Implement domain filter fallback logic
  // T029: Wrap with retry logic for rate limits
  // T030: Wrap with timeout control
  let result: CompanyResearchData;
  let apiResponse: PerplexityResponse;
  let fallbackOccurred = false;

  try {
    // Wrap the entire operation with timeout
    const executeWithFallback = async () => {
      // First attempt with domain filter if provided - wrapped with retry
      const firstAttempt = await withRetry(
        () => makeApiCall(true),
        {
          maxAttempts: PERPLEXITY_CONFIG.RETRY.MAX_ATTEMPTS,
          initialDelayMs: PERPLEXITY_CONFIG.RETRY.INITIAL_DELAY_MS,
          maxDelayMs: PERPLEXITY_CONFIG.RETRY.MAX_DELAY_MS,
          backoffFactor: PERPLEXITY_CONFIG.RETRY.BACKOFF_FACTOR,
          shouldRetry: (error) => {
            // Retry on rate limits and server errors, but not on client errors
            if (error instanceof RetryAfterError) return true;
            if (error instanceof NonRetriableError) return false;
            if (error instanceof Error) {
              // Retry on generic errors (likely 5xx)
              return !error.message.includes('Invalid request');
            }
            return false;
          },
        }
      );

      let finalResult = firstAttempt.data;
      let finalResponse = firstAttempt.apiResponse;
      let didFallback = false;

      // Check if we should retry without domain filter
      if (
        searchDomainFilter &&
        includeDomainFallback &&
        isInsufficientData(finalResult)
      ) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            '[Perplexity] Insufficient data with domain filter, retrying without filter',
            { result: finalResult }
          );
        }

        const fallbackAttempt = await withRetry(
          () => makeApiCall(false),
          {
            maxAttempts: PERPLEXITY_CONFIG.RETRY.MAX_ATTEMPTS,
            initialDelayMs: PERPLEXITY_CONFIG.RETRY.INITIAL_DELAY_MS,
            maxDelayMs: PERPLEXITY_CONFIG.RETRY.MAX_DELAY_MS,
            backoffFactor: PERPLEXITY_CONFIG.RETRY.BACKOFF_FACTOR,
            shouldRetry: (error) => {
              if (error instanceof RetryAfterError) return true;
              if (error instanceof NonRetriableError) return false;
              if (error instanceof Error) {
                return !error.message.includes('Invalid request');
              }
              return false;
            },
          }
        );

        finalResult = fallbackAttempt.data;
        finalResponse = fallbackAttempt.apiResponse;
        didFallback = true;
      }

      return { data: finalResult, apiResponse: finalResponse, fallbackOccurred: didFallback };
    };

    // Apply timeout wrapper
    const { data, apiResponse: response, fallbackOccurred: didFallback } = await withTimeout(
      executeWithFallback,
      timeout,
      `Company research timed out after ${timeout}ms`
    );

    result = data;
    apiResponse = response;
    fallbackOccurred = didFallback;
  } catch (error) {
    // T025: Log errors
    console.error('[Perplexity] Company research failed', {
      companyDomain,
      error: error instanceof Error ? error.message : 'Unknown error',
      durationMs: Date.now() - startTime,
    });
    throw error;
  }

  // Calculate duration
  const durationMs = Date.now() - startTime;

  // T025: Log response metadata
  if (process.env.NODE_ENV === 'development') {
    console.warn('[Perplexity] Company research completed', {
      companyDomain,
      durationMs,
      totalTokens: apiResponse.usage.total_tokens,
      fallbackOccurred,
    });
  }

  // Add sources and metadata to result
  result.sources = result.sources || [];
  result.metadata = {
    model: PERPLEXITY_CONFIG.MODEL,
    totalTokens: apiResponse.usage.total_tokens,
    durationMs,
    timestamp: new Date().toISOString(),
    usedDomainFilter: searchDomainFilter !== undefined && !fallbackOccurred,
    fallbackOccurred,
  };

  return result;
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
  } catch {
    // If not valid JSON, try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]) as ProspectResearchData;
    }
    throw new Error('Failed to parse Perplexity response as JSON');
  }
}
