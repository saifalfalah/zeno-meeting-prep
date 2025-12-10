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
  pass: 'company_website' | 'company_news' | 'prospect_background';
  startTime: number;
  endTime: number;
  duration: number;
  apiCallParams: {
    model: string;
    temperature: number;
    max_tokens: number;
    search_domain_filter?: string[];
  };
  responseMetadata: {
    tokenCount: number;
    sourcesCited: number;
  };
  error?: string;
  isPartialResult: boolean;
  fallbackOccurred: boolean;
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
  company?: string;
  companyName?: string;
  email?: string;
  location?: string;
  background?: string;
  recentActivity?: string[];
  linkedinUrl?: string;
  twitterUrl?: string;
  sources?: ResearchSource[];
  metadata?: ResearchMetadata;
  [key: string]: unknown;
}

export interface PassResult {
  content: string;
  sources: ResearchSource[];
}

export interface MultiPassResearchMetadata extends ResearchMetadata {
  totalDurationMs: number;
  passesCompleted: number;
  errors?: string[];
}

export interface MultiPassResearchResult {
  companyWebsitePass: PassResult | null;
  companyNewsPass: PassResult | null;
  prospectBackgroundPass: PassResult | null;
  metadata: MultiPassResearchMetadata;
  isPartialData: boolean;
  operationLogs?: ResearchOperationLog[];
}

export interface MultiPassResearchInput {
  prospectName?: string;
  prospectEmail?: string;
  companyName?: string;
  companyDomain?: string;
  website?: string;
}

export interface MultiPassResearchOptions {
  temperature?: number;
  maxTokens?: number;
  perPassTimeout?: number;
  totalTimeout?: number;
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

export interface ResearchProspectOptions {
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

/**
 * Research a prospect using Perplexity API with sonar-pro model (T052-T053)
 * @param prospect - Prospect information (email, name, companyDomain)
 * @param options - Research options including temperature, maxTokens, timeout
 * @returns Structured prospect research data with sources and metadata
 * @throws RetryAfterError when rate limited (429)
 * @throws NonRetriableError for 4xx errors
 * @throws Error for 5xx errors (retryable)
 */
export async function researchProspect(
  prospect: {
    email: string;
    name?: string;
    companyDomain?: string;
  },
  options: ResearchProspectOptions = {}
): Promise<ProspectResearchData> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    throw new NonRetriableError('PERPLEXITY_API_KEY is not configured');
  }

  // Extract options with defaults (T053)
  const {
    temperature = PERPLEXITY_CONFIG.TEMPERATURE.DEFAULT,
    maxTokens = PERPLEXITY_CONFIG.MAX_TOKENS.PROSPECT_RESEARCH,
    timeout = PERPLEXITY_CONFIG.TIMEOUT.PER_PASS,
  } = options;

  const startTime = Date.now();

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

  // T052: Use sonar-pro model with explicit system message
  const makeApiCall = async () => {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: PERPLEXITY_CONFIG.MODEL, // T052: Use sonar-pro
        messages: [
          {
            role: 'system',
            content: PERPLEXITY_CONFIG.SYSTEM_MESSAGE.PROSPECT_RESEARCH, // T052: Explicit system message
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature,
        max_tokens: maxTokens,
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

    return await response.json();
  };

  let result: ProspectResearchData;
  let apiResponse: PerplexityResponse;

  try {
    // Wrap with timeout and retry logic
    apiResponse = await withTimeout(
      () =>
        withRetry(makeApiCall, {
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
        }),
      timeout,
      `Prospect research timed out after ${timeout}ms`
    );
  } catch (error) {
    console.error('[Perplexity] Prospect research failed', {
      prospect: identityInfo,
      error: error instanceof Error ? error.message : 'Unknown error',
      durationMs: Date.now() - startTime,
    });
    throw error;
  }

  const content = apiResponse.choices[0].message.content;

  try {
    // Try to parse JSON response
    result = JSON.parse(content) as ProspectResearchData;
  } catch {
    // If not valid JSON, try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      result = JSON.parse(jsonMatch[1]) as ProspectResearchData;
    } else {
      throw new Error('Failed to parse Perplexity response as JSON');
    }
  }

  // Calculate duration
  const durationMs = Date.now() - startTime;

  // Add sources and metadata to result (T052)
  result.sources = result.sources || [];
  result.metadata = {
    model: PERPLEXITY_CONFIG.MODEL,
    totalTokens: apiResponse.usage.total_tokens,
    durationMs,
    timestamp: new Date().toISOString(),
  };

  return result;
}

/**
 * Perform multi-pass research strategy (US3: T054-T061)
 * Executes 3 focused research passes:
 * 1. Company Website Focus (with domain filtering)
 * 2. Company News & Context (broader search)
 * 3. Prospect Background (LinkedIn, professional sources)
 *
 * @param input - Research input including prospect and company information
 * @param options - Research options (temperature, timeouts, etc.)
 * @returns Multi-pass research result with graceful degradation
 */
export async function performMultiPassResearch(
  input: MultiPassResearchInput,
  options: MultiPassResearchOptions = {}
): Promise<MultiPassResearchResult> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    throw new NonRetriableError('PERPLEXITY_API_KEY is not configured');
  }

  // Extract options with defaults (T054)
  const {
    temperature = PERPLEXITY_CONFIG.TEMPERATURE.DEFAULT,
    maxTokens = PERPLEXITY_CONFIG.MAX_TOKENS.PROSPECT_RESEARCH,
    perPassTimeout = PERPLEXITY_CONFIG.TIMEOUT.PER_PASS, // T058: 60s per pass
    totalTimeout = PERPLEXITY_CONFIG.TIMEOUT.TOTAL_MULTI_PASS, // T059: 180s total
  } = options;

  const totalStartTime = Date.now();
  const operationLogs: ResearchOperationLog[] = [];
  const errors: string[] = [];
  let passesCompleted = 0;

  // Determine domain for filtering
  const domainForFilter = input.website
    ? input.website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
    : input.companyDomain;

  // Helper function to execute a single pass
  const executePass = async (
    passName: 'company_website' | 'company_news' | 'prospect_background',
    prompt: string,
    useDomainFilter: boolean
  ): Promise<PassResult | null> => {
    const passStartTime = Date.now();

    try {
      const requestBody: Record<string, unknown> = {
        model: PERPLEXITY_CONFIG.MODEL,
        messages: [
          {
            role: 'system',
            content: PERPLEXITY_CONFIG.SYSTEM_MESSAGE.WEB_BROWSING,
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

      // Add domain filter for Pass 1 (T055)
      if (useDomainFilter && domainForFilter) {
        requestBody.search_domain_filter = [domainForFilter];
      }

      // T058: Wrap each pass with per-pass timeout
      const makeApiCall = async () => {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (response.status === 429) {
          const retryAfter = response.headers.get('retry-after') || '60';
          throw new RetryAfterError('Rate limited by Perplexity API', `${retryAfter}s`);
        }

        if (response.status >= 400 && response.status < 500) {
          const error = await response.json();
          throw new NonRetriableError(
            `Perplexity API error: ${error.error || 'Invalid request'}`
          );
        }

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Perplexity API error: ${error.error || 'Server error'}`);
        }

        return await response.json();
      };

      const apiResponse: PerplexityResponse = await withTimeout(
        () =>
          withRetry(makeApiCall, {
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
          }),
        perPassTimeout,
        `${passName} pass timed out after ${perPassTimeout}ms`
      );

      const content = apiResponse.choices[0].message.content;
      const passEndTime = Date.now();

      // Log operation (T064)
      operationLogs.push({
        pass: passName,
        startTime: passStartTime,
        endTime: passEndTime,
        duration: passEndTime - passStartTime,
        apiCallParams: {
          model: PERPLEXITY_CONFIG.MODEL,
          temperature,
          max_tokens: maxTokens,
          ...(useDomainFilter && domainForFilter
            ? { search_domain_filter: [domainForFilter] }
            : {}),
        },
        responseMetadata: {
          tokenCount: apiResponse.usage.total_tokens,
          sourcesCited: 0, // We don't have direct citation count from API
        },
        isPartialResult: false,
        fallbackOccurred: false,
      });

      passesCompleted++;

      return {
        content,
        sources: [], // Perplexity doesn't return structured sources in this format
      };
    } catch (error) {
      // T060: Graceful degradation - log error and continue
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      errors.push(`${passName} failed: ${errorMessage}`);

      if (process.env.NODE_ENV === 'development') {
        console.warn(`[Perplexity] ${passName} pass failed`, {
          error: errorMessage,
          durationMs: Date.now() - passStartTime,
        });
      }

      // Log failed operation
      operationLogs.push({
        pass: passName,
        startTime: passStartTime,
        endTime: Date.now(),
        duration: Date.now() - passStartTime,
        apiCallParams: {
          model: PERPLEXITY_CONFIG.MODEL,
          temperature,
          max_tokens: maxTokens,
          ...(useDomainFilter && domainForFilter
            ? { search_domain_filter: [domainForFilter] }
            : {}),
        },
        responseMetadata: {
          tokenCount: 0,
          sourcesCited: 0,
        },
        error: errorMessage,
        isPartialResult: true,
        fallbackOccurred: false,
      });

      return null; // T060: Return null for failed passes
    }
  };

  // T059: Wrap total execution with total timeout
  const executeAllPasses = async () => {
    // T055: Pass 1 - Company Website Focus (with domain filtering)
    const pass1Prompt = `Research the company ${input.companyName || input.companyDomain || 'unknown'}${
      domainForFilter ? ` (website: ${domainForFilter})` : ''
    }.

Focus specifically on information from their official company website. Provide:
- Company overview and mission
- Products and services
- Recent announcements or launches
- Company size and locations
- Key leadership

Prioritize information directly from the company website. Be detailed and factual.`;

    const companyWebsitePass = await executePass('company_website', pass1Prompt, true);

    // T056: Pass 2 - Company News & Context (no domain filter for broader search)
    const pass2Prompt = `Find recent news and developments about ${
      input.companyName || input.companyDomain || 'the company'
    }.

Focus on:
- Recent news articles and press releases
- Funding announcements
- Product launches
- Industry recognition or awards
- Market trends affecting the company

Search broadly across news sources, industry publications, and business databases.`;

    const companyNewsPass = await executePass('company_news', pass2Prompt, false);

    // T057: Pass 3 - Prospect Background (LinkedIn, professional sources)
    const pass3Prompt = `Research the professional ${input.prospectName || 'prospect'}${
      input.prospectEmail ? ` (${input.prospectEmail})` : ''
    }${input.companyName ? ` at ${input.companyName}` : ''}.

Focus on:
- Current role and responsibilities
- Professional background and experience
- LinkedIn profile information
- Recent professional activities (posts, articles, speaking engagements)
- Areas of expertise

Search LinkedIn, company team pages, professional networks, and industry publications.`;

    const prospectBackgroundPass = await executePass(
      'prospect_background',
      pass3Prompt,
      false
    );

    return {
      companyWebsitePass,
      companyNewsPass,
      prospectBackgroundPass,
    };
  };

  let passes: {
    companyWebsitePass: PassResult | null;
    companyNewsPass: PassResult | null;
    prospectBackgroundPass: PassResult | null;
  };

  try {
    passes = await withTimeout(
      executeAllPasses,
      totalTimeout,
      `Multi-pass research timed out after ${totalTimeout}ms`
    );
  } catch (error) {
    // If total timeout exceeded, return whatever we have completed
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Total timeout exceeded: ${errorMessage}`);

    if (process.env.NODE_ENV === 'development') {
      console.warn('[Perplexity] Multi-pass research timed out', {
        error: errorMessage,
        passesCompleted,
        totalDurationMs: Date.now() - totalStartTime,
      });
    }

    // Return partial results
    passes = {
      companyWebsitePass: null,
      companyNewsPass: null,
      prospectBackgroundPass: null,
    };
  }

  const totalDurationMs = Date.now() - totalStartTime;

  // T061: Determine if we have partial data
  const isPartialData =
    passesCompleted < 3 ||
    passes.companyWebsitePass === null ||
    passes.companyNewsPass === null ||
    passes.prospectBackgroundPass === null;

  if (process.env.NODE_ENV === 'development') {
    console.warn('[Perplexity] Multi-pass research completed', {
      passesCompleted,
      isPartialData,
      totalDurationMs,
      errors: errors.length > 0 ? errors : undefined,
    });
  }

  return {
    companyWebsitePass: passes.companyWebsitePass,
    companyNewsPass: passes.companyNewsPass,
    prospectBackgroundPass: passes.prospectBackgroundPass,
    metadata: {
      model: PERPLEXITY_CONFIG.MODEL,
      timestamp: new Date().toISOString(),
      totalDurationMs,
      passesCompleted,
      ...(errors.length > 0 ? { errors } : {}),
    },
    isPartialData,
    operationLogs,
  };
}
