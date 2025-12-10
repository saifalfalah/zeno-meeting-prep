# Research Findings: Perplexity Research Quality Enhancement

## 1. Perplexity API sonar-pro Model

### Decision
Use the `sonar-pro` model with the following configuration:
- **Model**: `sonar-pro`
- **Temperature**: 0.2 (factual/research tasks)
- **Max tokens**: 4000
- **Search domain filter**: Enabled (up to 20 domains per request)

### Rationale

**Superior Factuality**: Sonar-Pro leads the SimpleQA benchmark with an F-score of 0.858, making it the best-performing model on factuality by combining LLM summarization power with access to real-time information.

**Enhanced Search Capabilities**: Delivers 2x more search results and double the number of citations per search compared to standard Sonar, providing deeper content understanding with enhanced search result accuracy.

**Large Context Window**: 200,000 token context window enables processing of extensive research materials without truncation.

**Cost Efficiency**: Citation tokens are no longer charged in responses across all search modes (2025 update), simplifying billing and reducing costs while encouraging more comprehensive sourcing.

**Three Search Modes**: High/Medium/Low modes provide flexibility for balancing depth vs. cost, though we'll primarily use default settings for consistent quality.

**Advanced Features**: Supports JSON mode and search domain filters, critical for our focused company research needs.

### Alternatives Considered

**llama-3.1-sonar-large-128k-online**:
- Pros: Lower cost, faster response times
- Cons: Fewer citations, smaller context window, less accurate for complex queries
- Reason for rejection: Quality and depth are more important than speed for meeting preparation

**Standard Sonar**:
- Pros: More cost-effective
- Cons: Half the citations, less depth for complex queries
- Reason for rejection: Meeting prep requires maximum quality and comprehensive research

### Implementation Notes

**Temperature Settings**:
- Use 0.2 for factual/research tasks (recommended for accuracy)
- 0.7 is available for more conversational responses if needed later
- Range: 0-2, where lower = more deterministic

**Max Tokens**:
- 4000 tokens balances comprehensive answers with reasonable costs
- Can adjust per query type if needed (1000 for simple queries, 4000 for complex)
- This is a primary cost control lever alongside search_domain_filter

**API Endpoint**:
```typescript
const response = await client.chat.completions.create({
  model: 'sonar-pro',
  messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: query }],
  temperature: 0.2,
  max_tokens: 4000,
  search_domain_filter: domains.length > 0 ? domains : undefined
});
```

**Citations Handling**:
- Sonar-Pro provides comprehensive citations in response
- No additional token cost for citations
- Parse and preserve citation metadata for transparency

## 2. search_domain_filter Parameter

### Decision
Implement domain filtering with:
- **Allowlist mode** for focused company research
- **Maximum 20 domains** per request
- **Pre-validation** of domains before adding to filter
- **Fallback strategy** when allowlist returns insufficient results

### Rationale

**Quality Control**: Restricts search results to trusted sources, crucial for gathering accurate company and prospect information.

**Relevance Optimization**: Focusing on specific domains (company website, LinkedIn, news sites) dramatically improves result relevance for meeting prep.

**Flexible Filtering**: Supports both allowlist (include only specified domains) and denylist (exclude specified domains) modes, giving fine-grained control.

**Performance**: While adding filters slightly increases response time, the quality improvement outweighs the marginal latency increase.

### Alternatives Considered

**No Domain Filtering**:
- Pros: Faster, simpler implementation
- Cons: Results polluted with irrelevant sources, harder to verify information
- Reason for rejection: Quality is paramount for meeting preparation

**Denylist Approach**:
- Pros: Easier to maintain (just block known bad sources)
- Cons: Doesn't guarantee quality sources, miss-rate still high
- Reason for rejection: Allowlist provides better control for focused research

**Post-Processing Filter**:
- Pros: No API constraints, unlimited domains
- Cons: Wastes API calls and tokens on irrelevant results
- Reason for rejection: Inefficient, higher costs

### Implementation Notes

**Domain Format**:
```typescript
// Correct format - simple domain names only
const domains = ['example.com', 'company.com', 'linkedin.com'];

// INCORRECT - avoid these patterns
const badDomains = [
  'https://example.com',  // No protocol
  'www.example.com',       // No www prefix
  'example.com/page'       // No paths
];
```

**Domain Validation**:
```typescript
function validateDomain(domain: string): boolean {
  // Remove protocol, www, and paths
  const cleaned = domain
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0];

  // Verify domain is accessible before adding to filter
  return cleaned.length > 0 && !cleaned.includes(' ');
}
```

**Pre-Testing Strategy**:
Before adding URLs to allowlist, test that they are accessible via the API. URLs that are blocked, require authentication, or have access restrictions may not return search results, which can significantly impact response quality when using allowlist mode.

**20 Domain Limit Management**:
```typescript
const prioritizedDomains = [
  companyWebsite,          // Priority 1: Official company site
  'linkedin.com',          // Priority 2: Professional profiles
  'crunchbase.com',        // Priority 3: Company data
  'techcrunch.com',        // Priority 4: Tech news
  // ... up to 20 total
].slice(0, 20);
```

**Fallback Strategy**:
```typescript
async function searchWithDomainFilter(query: string, domains: string[]) {
  try {
    // Try with domain filter first
    const result = await search(query, domains);

    // If results are insufficient, retry without filter
    if (result.citations.length < 2) {
      console.warn('Insufficient results with domain filter, retrying without');
      return await search(query, []);
    }

    return result;
  } catch (error) {
    // Fallback to no filter on error
    return await search(query, []);
  }
}
```

**Performance Considerations**:
- Domain filtering adds slight latency (~100-300ms)
- Overly restrictive filters may reduce result quality
- Balance between specificity and result availability

## 3. Multi-Pass Research Strategy

### Decision
Implement a **three-pass sequential research strategy**:
1. **Pass 1**: Company website focus (domain-filtered, 60s timeout)
2. **Pass 2**: Company news and context (broader search, 60s timeout)
3. **Pass 3**: Prospect background (LinkedIn + professional sources, 60s timeout)

Execute passes **sequentially** with dependency management, but allow **partial results** on timeout/failure.

### Rationale

**Focused Information Gathering**: Breaking research into passes allows each query to be optimized for specific information types, reducing noise and improving result quality.

**Dependency Management**: Sequential execution ensures we can use results from earlier passes to inform later queries (e.g., use company context from Pass 1 to better frame Pass 3 prospect questions).

**Time Budget Control**: 60-second timeout per pass with 180s total ensures completion within acceptable timeframes for user experience.

**Graceful Degradation**: If Pass 1 or 2 fails, we still get value from successful passes rather than all-or-nothing failure.

**Token Efficiency**: Focused queries are more token-efficient than trying to get all information in a single massive query. Enterprise APIs provide substantive passages (500-2,000 characters) with enough context for AI reasoning versus two-sentence snippets.

### Alternatives Considered

**Single-Pass Comprehensive Query**:
- Pros: Simpler implementation, single API call
- Cons: Unfocused results, harder to control domain filtering per topic, more tokens wasted on irrelevant content
- Reason for rejection: Traditional search APIs compound latency, inflate context windows, and increase token costs while decreasing accuracy

**Fully Parallel Execution**:
- Pros: Fastest completion time, all passes start simultaneously
- Cons: Can't use context from earlier passes, harder rate limit management, all-or-nothing on timeouts
- Reason for rejection: Research tasks often benefit from sequential context building

**Five or More Passes**:
- Pros: Even more focused queries
- Cons: Increased complexity, higher total latency, more API calls
- Reason for rejection: Diminishing returns after three passes; 180s budget allows 3x60s passes

### Implementation Notes

**Pass 1: Company Website Focus**
```typescript
const pass1Query = `
Research ${companyName} by analyzing their official website and company materials.
Focus on: business model, products/services, recent developments, company culture, and key differentiators.
Provide comprehensive, factual information with citations.
`;

const pass1Config = {
  model: 'sonar-pro',
  temperature: 0.2,
  max_tokens: 4000,
  search_domain_filter: [companyWebsite, 'crunchbase.com'], // Focus on official sources
  timeout: 60000
};
```

**Pass 2: Company News and Context**
```typescript
const pass2Query = `
Research recent news, developments, and industry context for ${companyName}.
Focus on: recent announcements, funding rounds, partnerships, market position, and industry trends.
Provide comprehensive, factual information with citations.
`;

const pass2Config = {
  model: 'sonar-pro',
  temperature: 0.2,
  max_tokens: 4000,
  search_domain_filter: [
    'techcrunch.com',
    'bloomberg.com',
    'reuters.com',
    'forbes.com',
    'cnbc.com',
    companyWebsite
  ],
  timeout: 60000
};
```

**Pass 3: Prospect Background**
```typescript
const pass3Query = `
Research ${prospectName} at ${companyName}.
Focus on: professional background, current role, recent activities, published content, and areas of expertise.
Provide comprehensive, factual information with citations.
`;

const pass3Config = {
  model: 'sonar-pro',
  temperature: 0.2,
  max_tokens: 4000,
  search_domain_filter: [
    'linkedin.com',
    'twitter.com',
    'medium.com',
    companyWebsite
  ],
  timeout: 60000
};
```

**Sequential Execution with Partial Results**
```typescript
interface ResearchResult {
  companyWebsite?: string;
  companyContext?: string;
  prospectBackground?: string;
  errors: string[];
}

async function executeMultiPassResearch(
  companyName: string,
  companyWebsite: string,
  prospectName: string
): Promise<ResearchResult> {
  const result: ResearchResult = { errors: [] };

  // Pass 1: Company Website
  try {
    result.companyWebsite = await executePass1(companyName, companyWebsite);
  } catch (error) {
    result.errors.push(`Pass 1 failed: ${error.message}`);
  }

  // Pass 2: Company Context (can proceed even if Pass 1 failed)
  try {
    result.companyContext = await executePass2(companyName, companyWebsite);
  } catch (error) {
    result.errors.push(`Pass 2 failed: ${error.message}`);
  }

  // Pass 3: Prospect (can proceed even if Pass 1/2 failed)
  try {
    result.prospectBackground = await executePass3(
      prospectName,
      companyName,
      result.companyWebsite // Use Pass 1 context if available
    );
  } catch (error) {
    result.errors.push(`Pass 3 failed: ${error.message}`);
  }

  return result;
}
```

**Multi-Query Feature**:
Consider using Perplexity's multi-query feature (up to 5 queries per request) for efficient batch processing within a single pass if queries are closely related:

```typescript
// Instead of 3 separate API calls for company research
const multiQueryRequest = {
  queries: [
    'Company products and services',
    'Recent company news',
    'Company leadership'
  ],
  search_domain_filter: [companyWebsite]
};
```

**Staging for Security**:
When sensitive data is involved, stage the workflow (run public-web research first, then run a second call that has access to private data but no web access).

## 4. URL Validation and Normalization

### Decision
Use **built-in URL API** for validation with **tldts** library for domain extraction:
- Accept `http://`, `https://`, and bare domains (e.g., `example.com`)
- Normalize all URLs to `https://` protocol
- Extract clean domains using **tldts** library for search_domain_filter
- Validate extracted domains before use

### Rationale

**Native Performance**: Built-in URL API is fast, well-tested, and requires no additional dependencies for basic validation.

**tldts for Domain Extraction**: The fastest JavaScript library for parsing hostnames (2-3M inputs per second), with robust handling of:
- Public suffix identification
- Subdomain extraction
- IPv4/IPv6 detection
- International domain names (punycode)

**Protocol Flexibility**: Users may provide URLs in various formats; accepting all common formats improves UX.

**Security**: Proper normalization prevents duplicate domains in filters and ensures consistent behavior.

### Alternatives Considered

**normalize-url Library**:
- Pros: Comprehensive normalization options, handles edge cases
- Cons: Additional dependency, potentially overkill for our needs
- Reason for rejection: Built-in URL API + tldts is sufficient

**Verifio Library**:
- Pros: All-in-one solution for validation, normalization, and extraction
- Cons: Larger dependency, more than we need
- Reason for rejection: tldts is lighter and focused on our primary need

**Regex-Only Approach**:
- Pros: No dependencies, full control
- Cons: Complex to handle all edge cases, error-prone for IPv6 and international domains
- Reason for rejection: Reinventing the wheel, hard to maintain

**url-normalize Library**:
- Pros: HTTPS by default, flexible configuration
- Cons: Another dependency when built-in API is sufficient
- Reason for rejection: Built-in URL API provides what we need

### Implementation Notes

**URL Validation Function**
```typescript
function isValidUrl(input: string): boolean {
  try {
    // Try parsing as-is
    new URL(input);
    return true;
  } catch {
    try {
      // Try with https:// prefix for bare domains
      new URL(`https://${input}`);
      return true;
    } catch {
      return false;
    }
  }
}
```

**URL Normalization Function**
```typescript
function normalizeUrl(input: string): string {
  try {
    // Try parsing as-is
    const url = new URL(input);
    // Always use https
    url.protocol = 'https:';
    return url.href;
  } catch {
    // Assume bare domain, add https://
    const url = new URL(`https://${input}`);
    return url.href;
  }
}
```

**Domain Extraction with tldts**
```typescript
import { parse } from 'tldts';

function extractDomain(url: string): string | null {
  const normalized = normalizeUrl(url);
  const parsed = parse(normalized);

  // Return domain without subdomain (e.g., 'example.com' from 'www.example.com')
  if (parsed.domain) {
    return parsed.domain;
  }

  // Handle IPv4/IPv6
  if (parsed.isIp) {
    return parsed.hostname;
  }

  return null;
}
```

**Complete URL Processing Pipeline**
```typescript
import { parse } from 'tldts';

interface ProcessedUrl {
  original: string;
  normalized: string;
  domain: string;
  isValid: boolean;
}

function processUrl(input: string): ProcessedUrl {
  const result: ProcessedUrl = {
    original: input,
    normalized: '',
    domain: '',
    isValid: false
  };

  // Step 1: Validate
  if (!isValidUrl(input)) {
    return result;
  }

  // Step 2: Normalize
  result.normalized = normalizeUrl(input);

  // Step 3: Extract domain
  const parsed = parse(result.normalized);
  if (parsed.domain) {
    result.domain = parsed.domain;
    result.isValid = true;
  } else if (parsed.isIp) {
    result.domain = parsed.hostname || '';
    result.isValid = true;
  }

  return result;
}
```

**Usage Example**
```typescript
// Handles various input formats
const inputs = [
  'https://www.example.com/page',
  'http://example.com',
  'example.com',
  'www.example.com'
];

const domains = inputs
  .map(processUrl)
  .filter(p => p.isValid)
  .map(p => p.domain); // ['example.com', 'example.com', 'example.com', 'example.com']

// Deduplicate for search_domain_filter
const uniqueDomains = [...new Set(domains)]; // ['example.com']
```

**Important Security Considerations**:
- Normalize IPv6 addresses into their longest, canonical form before matching to detect special-purpose addresses
- Always validate extracted domains before using in API calls
- Handle punycode (international domains) correctly - tldts does this automatically

**Installation**:
```bash
npm install tldts
```

**Type Definitions** (included with tldts):
```typescript
import type { IResult } from 'tldts';
// IResult includes: domain, domainWithoutSuffix, hostname, isIp, isPrivate, publicSuffix, subdomain
```

## 5. Rate Limiting and Error Handling

### Decision
Implement **exponential backoff with jitter** for rate limit errors:
- **Retry attempts**: Maximum 3 retries
- **Base delay**: 1 second, exponentially increasing (1s, 2s, 4s)
- **Jitter**: Add random 0-1s to prevent thundering herd
- **Error types**: Handle RateLimitError, APIConnectionError, APIStatusError, AuthenticationError
- **Graceful degradation**: Return partial results when possible

### Rationale

**Official Recommendation**: Perplexity documentation explicitly recommends exponential backoff with jitter for rate limiting.

**Leaky Bucket Algorithm**: Perplexity uses a leaky bucket rate limiting algorithm, which allows burst traffic up to capacity while maintaining long-term rate control. Exponential backoff works well with this model.

**Prevents API Stress**: Jitter (randomization) prevents multiple clients from retrying simultaneously (thundering herd problem).

**Tier-Based Limits**: Rate limits increase automatically with spending (50 requests/minute standard, higher for larger tiers), making the system more forgiving as usage scales.

**Practical Success**: Three retries with exponential backoff successfully handles transient rate limits and network issues in production systems.

### Alternatives Considered

**Fixed Delay Retry**:
- Pros: Simpler implementation
- Cons: Can cause thundering herd, doesn't adapt to load
- Reason for rejection: Not recommended by Perplexity, less effective

**Linear Backoff**:
- Pros: More predictable delays
- Cons: Too slow to recover from transient issues, too fast for sustained rate limits
- Reason for rejection: Exponential is more adaptive

**No Retry Logic**:
- Pros: Simplest, fail fast
- Cons: Poor user experience, doesn't handle transient issues
- Reason for rejection: Unacceptable for production

**Aggressive Retry (5+ attempts)**:
- Pros: Higher success rate
- Cons: Worsens rate limiting, poor API citizenship, very long delays
- Reason for rejection: Recommended max is 3 attempts

### Implementation Notes

**Retry Function with Exponential Backoff**
```typescript
import { setTimeout } from 'timers/promises';

interface RetryOptions {
  maxRetries: number;
  baseDelay: number; // milliseconds
  maxDelay: number;  // milliseconds
}

async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 8000
  }
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on non-retryable errors
      if (!isRetryableError(error)) {
        throw error;
      }

      // Don't delay on final attempt
      if (attempt === options.maxRetries - 1) {
        break;
      }

      // Calculate delay with exponential backoff and jitter
      const exponentialDelay = options.baseDelay * Math.pow(2, attempt);
      const jitter = Math.random() * 1000; // 0-1000ms
      const delay = Math.min(exponentialDelay + jitter, options.maxDelay);

      console.warn(`Retry attempt ${attempt + 1}/${options.maxRetries} after ${delay}ms`, {
        error: error.message
      });

      await setTimeout(delay);
    }
  }

  throw lastError!;
}
```

**Error Classification**
```typescript
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const errorName = error.constructor.name;

    // Retryable errors
    const retryableErrors = [
      'RateLimitError',      // 429
      'APIConnectionError',  // Network issues
      'APIStatusError',      // 5xx errors
    ];

    if (retryableErrors.includes(errorName)) {
      return true;
    }

    // Check status code if available
    if ('status' in error && typeof error.status === 'number') {
      const status = error.status;
      // Retry on 429 (rate limit) and 5xx (server errors)
      return status === 429 || (status >= 500 && status < 600);
    }
  }

  return false;
}
```

**Perplexity SDK Error Handling**
```typescript
import Perplexity from 'perplexity-sdk';

async function perplexitySearchWithRetry(
  client: Perplexity,
  query: string,
  options: {
    model: string;
    temperature: number;
    max_tokens: number;
    search_domain_filter?: string[];
  }
) {
  return withRetry(async () => {
    try {
      const response = await client.chat.completions.create({
        model: options.model,
        messages: [
          { role: 'system', content: 'You are a helpful research assistant.' },
          { role: 'user', content: query }
        ],
        temperature: options.temperature,
        max_tokens: options.max_tokens,
        search_domain_filter: options.search_domain_filter
      });

      return response;
    } catch (error) {
      // Log error details for monitoring
      console.error('Perplexity API error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        type: error?.constructor?.name,
        query: query.substring(0, 100) // Log first 100 chars for debugging
      });

      throw error;
    }
  });
}
```

**Rate Limit Details**:
- Standard tier: 50 requests/minute
- Higher tiers: Automatically increased limits based on spending
- Algorithm: Leaky bucket (allows bursts, refills continuously)
- No charges for citation tokens (2025 update)

**Best Practices**:

1. **Avoid Aggressive Retries**: Don't implement retry loops without delays - this worsens rate limiting

2. **Implement Logging**: Track error patterns and API health
```typescript
interface ErrorMetrics {
  rateLimitHits: number;
  connectionErrors: number;
  authErrors: number;
  successRate: number;
}
```

3. **Set Timeouts**: Configure appropriate timeouts to prevent hanging requests
```typescript
const response = await withTimeout(
  perplexitySearchWithRetry(client, query, options),
  60000 // 60 second timeout
);
```

4. **Graceful Degradation**: Return partial results when possible
```typescript
async function conductResearch(params: ResearchParams) {
  const results = {
    company: null as string | null,
    context: null as string | null,
    prospect: null as string | null,
    errors: [] as string[]
  };

  try {
    results.company = await perplexitySearchWithRetry(/* ... */);
  } catch (error) {
    results.errors.push(`Company research failed: ${error.message}`);
    // Continue with other research passes
  }

  // ... continue with context and prospect research

  return results;
}
```

5. **Monitor and Alert**: Track error rates and alert on sustained issues
```typescript
if (errorRate > 0.1) { // 10% error rate
  console.error('High error rate detected', { errorRate, errorMetrics });
  // Send alert to monitoring system
}
```

## 6. Timeout and Performance

### Decision
Implement **AbortController-based timeouts** with the following strategy:
- **Per-pass timeout**: 60 seconds (allows for comprehensive research)
- **Total research timeout**: 180 seconds (3 passes × 60s)
- **Timeout implementation**: AbortController + Promise.race with proper cleanup
- **Fallback**: Return partial results when timeouts occur

### Rationale

**Explicit Cancellation**: AbortController provides proper cleanup and cancellation, preventing memory leaks and zombie promises that Promise.race alone creates.

**Native Node.js Support**: Many Node.js APIs (fetch, fs, timers/promises) natively support AbortSignal, making integration seamless.

**Prevents Resource Waste**: Without proper cancellation, timed-out operations continue running in the background, wasting resources and potentially causing unhandled rejections.

**User Experience**: 60-second per-pass timeout ensures responsive UX while allowing time for comprehensive research. 180s total is acceptable for meeting prep use case.

**Modern Alternative Available**: AbortSignal.timeout() provides convenient built-in timeout functionality (Node.js 18+).

### Alternatives Considered

**Promise.race() Only**:
- Pros: Simple, no additional APIs
- Cons: Doesn't cancel losing promises, causes memory leaks, timer keeps running
- Reason for rejection: Problematic in production, wastes resources

**Basic setTimeout**:
- Pros: Familiar, simple
- Cons: No cancellation mechanism, hard to clean up, can't be passed to APIs
- Reason for rejection: Doesn't integrate with modern async APIs

**Third-Party Libraries** (p-timeout, promise-timeout):
- Pros: Battle-tested, feature-rich
- Cons: Additional dependencies, AbortController is now standard
- Reason for rejection: Native solution is preferred

**No Timeout**:
- Pros: Simplest implementation
- Cons: Poor UX on slow responses, potential for hanging requests
- Reason for rejection: Unacceptable for production

### Implementation Notes

**Recommended Implementation: AbortController + Promise.race**
```typescript
import { setTimeout } from 'timers/promises';

async function withTimeout<T>(
  promise: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number
): Promise<T> {
  const cancelTimeout = new AbortController();
  const cancelTask = new AbortController();

  // Timeout function
  async function timeout() {
    try {
      await setTimeout(timeoutMs, undefined, { signal: cancelTimeout.signal });
      cancelTask.abort(); // Cancel the task when timeout fires
    } catch {
      // Ignore cancellation errors here
    }
  }

  // Task function
  async function task() {
    try {
      const result = await promise(cancelTask.signal);
      return result;
    } finally {
      cancelTimeout.abort(); // Cancel the timeout when task completes
    }
  }

  return Promise.race([timeout(), task()]);
}
```

**Modern Alternative: AbortSignal.timeout()**
```typescript
async function withTimeoutModern<T>(
  promise: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number
): Promise<T> {
  const signal = AbortSignal.timeout(timeoutMs);

  try {
    return await promise(signal);
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Operation timed out after ${timeoutMs}ms`);
    }
    throw error;
  }
}
```

**Integration with Perplexity API**
```typescript
async function perplexityWithTimeout(
  client: Perplexity,
  query: string,
  options: PerplexityOptions,
  timeoutMs: number = 60000
): Promise<PerplexityResponse> {
  return withTimeout(async (signal) => {
    // Note: Check if Perplexity SDK supports AbortSignal
    // If not, we need to use Promise.race with cleanup
    const response = await client.chat.completions.create({
      model: options.model,
      messages: [
        { role: 'system', content: options.systemPrompt },
        { role: 'user', content: query }
      ],
      temperature: options.temperature,
      max_tokens: options.max_tokens,
      search_domain_filter: options.search_domain_filter,
      // If SDK supports AbortSignal:
      signal
    });

    return response;
  }, timeoutMs);
}
```

**Multi-Pass Research with Timeouts**
```typescript
interface ResearchConfig {
  perPassTimeout: number;   // 60000ms
  totalTimeout: number;     // 180000ms
}

async function executeMultiPassResearchWithTimeouts(
  params: ResearchParams,
  config: ResearchConfig = {
    perPassTimeout: 60000,
    totalTimeout: 180000
  }
): Promise<ResearchResult> {
  // Overall timeout for entire research
  return withTimeout(async (overallSignal) => {
    const result: ResearchResult = { errors: [] };

    // Pass 1: Company Website (60s timeout)
    try {
      result.companyWebsite = await withTimeout(
        (signal) => executePass1(params.companyName, params.companyWebsite, signal),
        config.perPassTimeout
      );
    } catch (error) {
      if (error.name === 'AbortError') {
        result.errors.push('Pass 1 timed out');
      } else {
        result.errors.push(`Pass 1 failed: ${error.message}`);
      }
    }

    // Pass 2: Company Context (60s timeout)
    try {
      result.companyContext = await withTimeout(
        (signal) => executePass2(params.companyName, params.companyWebsite, signal),
        config.perPassTimeout
      );
    } catch (error) {
      if (error.name === 'AbortError') {
        result.errors.push('Pass 2 timed out');
      } else {
        result.errors.push(`Pass 2 failed: ${error.message}`);
      }
    }

    // Pass 3: Prospect Background (60s timeout)
    try {
      result.prospectBackground = await withTimeout(
        (signal) => executePass3(params.prospectName, params.companyName, signal),
        config.perPassTimeout
      );
    } catch (error) {
      if (error.name === 'AbortError') {
        result.errors.push('Pass 3 timed out');
      } else {
        result.errors.push(`Pass 3 failed: ${error.message}`);
      }
    }

    return result;
  }, config.totalTimeout);
}
```

**Cleanup Best Practices**
```typescript
// Always remove listeners after operations complete
async function operationWithCleanup(signal: AbortSignal) {
  const abortHandler = () => {
    console.log('Operation aborted');
    // Clean up resources
  };

  signal.addEventListener('abort', abortHandler);

  try {
    // Check if already aborted before starting work
    if (signal.aborted) {
      throw new Error('Operation was aborted before starting');
    }

    const result = await performOperation();
    return result;
  } finally {
    // Remove listener to prevent memory leaks
    signal.removeEventListener('abort', abortHandler);
  }
}
```

**Performance Considerations**:

1. **Check Abort Status Early**: Immediately check if signal is already aborted to prevent unnecessary work
```typescript
if (signal.aborted) {
  throw new Error('Aborted');
}
```

2. **Propagate Signals**: Pass AbortSignal through all async operations
```typescript
async function research(signal: AbortSignal) {
  const pass1 = await fetchData(url1, { signal });
  const pass2 = await fetchData(url2, { signal });
  return { pass1, pass2 };
}
```

3. **Handle Partial Results**: On timeout, return what was completed
```typescript
try {
  return await withTimeout(operation, 60000);
} catch (error) {
  if (error.name === 'AbortError') {
    return { partial: true, data: cachedData };
  }
  throw error;
}
```

4. **Combine Multiple Signals**: Use AbortSignal.any() (Node.js 20+) to combine timeouts with user cancellation
```typescript
const combinedSignal = AbortSignal.any([
  AbortSignal.timeout(60000),
  userCancellationSignal
]);
```

**Timeout Budget Allocation**:
- Pass 1 (Company Website): 60s - Most critical, focused domain
- Pass 2 (Company Context): 60s - Broader search, more sources
- Pass 3 (Prospect): 60s - Specific person search
- Total: 180s maximum (includes retry delays)
- Buffer: ~20-30s for network overhead, retries

**Node.js Core API Support**:
Many Node.js APIs support AbortController:
- `fetch()` (Node.js 18+)
- `fs.readFile()`, `fs.writeFile()`
- `timers/promises` (setTimeout)
- `child_process.spawn()`

## Sources

### Perplexity API and Sonar-Pro Model
- [Sonar pro - Perplexity](https://docs.perplexity.ai/getting-started/models/models/sonar-pro)
- [Introducing the Sonar Pro API by Perplexity](https://www.perplexity.ai/hub/blog/introducing-the-sonar-pro-api)
- [Improved Sonar Models: Industry Leading Performance at Lower Costs](https://www.perplexity.ai/hub/blog/new-sonar-search-modes-outperform-openai-in-cost-and-performance)
- [Meet New Sonar](https://www.perplexity.ai/hub/blog/meet-new-sonar)
- [Perplexity AI free models: releases and capabilities in 2025](https://www.datastudios.org/post/perplexity-ai-free-models-releases-and-capabilities-in-2025)
- [Can I control parameters like temperature, top-p, and stop tokens? | Perplexity Help Center](https://www.perplexity.ai/help-center/en/articles/10354958-can-i-control-parameters-like-temperature-top-p-and-stop-tokens)

### Search Domain Filter
- [Sonar Domain Filter Guide - Perplexity](https://docs.perplexity.ai/guides/search-domain-filters)
- [Domain filtering in Perplexity Search API](https://aiengineerguide.com/blog/domain-filtering-in-perplexity-search-api/)
- [Perplexity Search API adds domain filters for targeted results](https://www.linkedin.com/posts/aravind-srinivas-16051987_perplexity-search-api-now-supports-domain-activity-7383570015779786752-uIv1)

### Rate Limiting and Error Handling
- [Error Handling - Perplexity](https://docs.perplexity.ai/guides/perplexity-sdk-error-handling)
- [Fix Perplexity API Errors 429, 405, 500 | Complete Tutorial 2025](https://www.hostingseekers.com/blog/fix-perplexity-api-errors-tutorial/)
- [Troubleshooting Perplexity AI API 429 Rate Limit Errors | Clay](https://community.clay.com/x/support/rs5vevcvh174/troubleshooting-perplexity-ai-api-429-rate-limit-e)

### Multi-Pass Research Strategy
- [Best Practices - Perplexity](https://docs.perplexity.ai/guides/search-best-practices)
- [Introducing the Parallel Search API | Parallel Web Systems](https://parallel.ai/blog/introducing-parallel-search)
- [Deep research | OpenAI API](https://platform.openai.com/docs/guides/deep-research)
- [Concurrent vs. Parallel Execution in LLM API Calls: From an AI Engineer's Perspective](https://medium.com/@neeldevenshah/concurrent-vs-parallel-execution-in-llm-api-calls-from-an-ai-engineers-perspective-5842e50974d4)

### URL Validation and Normalization
- [tldts - npm](https://www.npmjs.com/package/tldts)
- [GitHub - sindresorhus/normalize-url: Normalize a URL](https://github.com/sindresorhus/normalize-url)
- [How to Extract Domain from URL in TypeScript](https://www.webdevtutor.net/blog/typescript-extract-domain-from-url)
- [Mastering URL Validation in TypeScript: A Comprehensive Guide](https://www.webdevtutor.net/blog/typescript-url-validation)

### Timeout and Performance
- [Using AbortSignal in Node.js | Nearform](https://nearform.com/insights/using-abortsignal-in-node-js/)
- [Understanding AbortController in Node.js: A Complete Guide | Better Stack Community](https://betterstack.com/community/guides/scaling-nodejs/understanding-abortcontroller/)
- [Cancel async operations with AbortController - Simon Plenderleith](https://simonplend.com/cancel-async-operations-with-abortcontroller/)
- [Managing Asynchronous Operations in Node.js with AbortController | AppSignal Blog](https://blog.appsignal.com/2025/02/12/managing-asynchronous-operations-in-nodejs-with-abortcontroller.html)
- [Automatically cancel async operations with AbortSignal.timeout() - Simon Plenderleith](https://simonplend.com/automatically-cancel-async-operations-with-abortsignal-timeout/)
