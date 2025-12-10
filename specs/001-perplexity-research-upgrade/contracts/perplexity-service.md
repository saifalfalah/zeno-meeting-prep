# Perplexity Service Contract

**Feature**: 001-perplexity-research-upgrade
**Service**: lib/services/perplexity.ts
**Version**: 2.0.0

## Overview

This document defines the contract for the Perplexity API integration service. The service is responsible for making research API calls to Perplexity with the upgraded sonar-pro model, search_domain_filter parameter, and multi-pass research strategy.

## Public API

### Function: `researchCompany`

**Purpose**: Research a company using Perplexity's sonar-pro model with optional domain filtering

**Signature**:
```typescript
async function researchCompany(
  companyDomain: string,
  options?: ResearchCompanyOptions
): Promise<CompanyResearchData>
```

**Parameters**:
- `companyDomain` (string, required): The primary domain of the company to research (e.g., "acme.com")
- `options` (ResearchCompanyOptions, optional):
  ```typescript
  interface ResearchCompanyOptions {
    searchDomainFilter?: string[];        // Domains to prioritize in search (max 20)
    includeDomainFallback?: boolean;      // If true, retry without filter on insufficient results (default: true)
    temperature?: number;                 // 0.1-0.3, default 0.2
    maxTokens?: number;                   // 2000-4000, default 4000
    timeout?: number;                     // Milliseconds, default 60000 (60s)
  }
  ```

**Returns**: `Promise<CompanyResearchData>`
```typescript
interface CompanyResearchData {
  name: string;
  industry?: string;
  employeeCount?: string;
  revenue?: string;
  fundingStage?: string;
  headquarters?: string;
  website?: string;
  recentNews?: string[];
  sources: ResearchSource[];              // NEW: Citations from Perplexity
  metadata: ResearchMetadata;             // NEW: API call metadata
}
```

**Throws**:
- `RateLimitError`: When Perplexity API rate limit is exceeded (429)
- `APIConnectionError`: Network or connection failures
- `AuthenticationError`: Invalid API key (401)
- `TimeoutError`: Request exceeds timeout limit
- `InsufficientDataError`: No useful results found even after fallback

**Behavior Changes (v2.0.0)**:
- Uses `sonar-pro` model instead of `llama-3.1-sonar-large-128k-online`
- Includes explicit web browsing system message
- Supports `searchDomainFilter` to bias results toward specific domains
- Automatically retries without domain filter if initial results are insufficient
- Returns sources and metadata for logging/debugging

**Example**:
```typescript
const companyData = await researchCompany("acme.com", {
  searchDomainFilter: ["acme.com", "www.acme.com"],
  includeDomainFallback: true,
  temperature: 0.2,
  maxTokens: 4000,
});
```

---

### Function: `researchProspect`

**Purpose**: Research an individual prospect using Perplexity's sonar-pro model

**Signature**:
```typescript
async function researchProspect(
  prospect: ProspectResearchInput,
  options?: ResearchProspectOptions
): Promise<ProspectResearchData>
```

**Parameters**:
- `prospect` (ProspectResearchInput, required):
  ```typescript
  interface ProspectResearchInput {
    name: string;
    email?: string;
    companyName?: string;
    companyDomain?: string;
  }
  ```
- `options` (ResearchProspectOptions, optional):
  ```typescript
  interface ResearchProspectOptions {
    temperature?: number;                 // 0.1-0.3, default 0.2
    maxTokens?: number;                   // 1500-3000, default 3000
    timeout?: number;                     // Milliseconds, default 60000 (60s)
  }
  ```

**Returns**: `Promise<ProspectResearchData>`
```typescript
interface ProspectResearchData {
  name: string;
  title?: string;
  companyName?: string;
  location?: string;
  background?: string;
  recentActivity?: string[];
  linkedinUrl?: string;
  sources: ResearchSource[];              // NEW: Citations from Perplexity
  metadata: ResearchMetadata;             // NEW: API call metadata
}
```

**Throws**:
- `RateLimitError`: When Perplexity API rate limit is exceeded (429)
- `APIConnectionError`: Network or connection failures
- `AuthenticationError`: Invalid API key (401)
- `TimeoutError`: Request exceeds timeout limit

**Behavior Changes (v2.0.0)**:
- Uses `sonar-pro` model instead of `llama-3.1-sonar-large-128k-online`
- Includes explicit web browsing system message
- Returns sources and metadata for logging/debugging

**Example**:
```typescript
const prospectData = await researchProspect({
  name: "Jane Doe",
  email: "jane@acme.com",
  companyName: "Acme Corp",
  companyDomain: "acme.com",
}, {
  temperature: 0.2,
  maxTokens: 3000,
});
```

---

### Function: `performMultiPassResearch` (NEW)

**Purpose**: Orchestrate multiple focused research passes for comprehensive company and prospect research

**Signature**:
```typescript
async function performMultiPassResearch(
  input: MultiPassResearchInput,
  options?: MultiPassResearchOptions
): Promise<MultiPassResearchResult>
```

**Parameters**:
- `input` (MultiPassResearchInput, required):
  ```typescript
  interface MultiPassResearchInput {
    companyDomain: string;
    companyName?: string;
    prospectName?: string;
    prospectEmail?: string;
    explicitWebsite?: string;             // Prioritized domain for search_domain_filter
  }
  ```
- `options` (MultiPassResearchOptions, optional):
  ```typescript
  interface MultiPassResearchOptions {
    timeout?: number;                     // Total timeout in ms, default 180000 (3min)
    passTimeout?: number;                 // Per-pass timeout in ms, default 60000 (60s)
    enableFallback?: boolean;             // Enable domain filter fallback, default true
  }
  ```

**Returns**: `Promise<MultiPassResearchResult>`
```typescript
interface MultiPassResearchResult {
  companyResearch: CompanyResearchData;   // From Pass 1 + Pass 2
  prospectResearch?: ProspectResearchData; // From Pass 3 (if prospect provided)
  passes: ResearchPassResult[];           // Details of each pass
  isPartialData: boolean;                 // True if any pass failed
  totalDuration: number;                  // Total execution time in ms
}

interface ResearchPassResult {
  pass: 'company_website' | 'company_news' | 'prospect_background';
  success: boolean;
  duration: number;
  error?: string;
  fallbackOccurred: boolean;
  metadata: ResearchMetadata;
}
```

**Throws**:
- `TimeoutError`: Total execution time exceeds timeout
- `AuthenticationError`: Invalid API key (401)

**Note**: Does NOT throw on individual pass failures. Returns `isPartialData: true` instead.

**Pass Strategy**:
1. **Pass 1 (Company Website)**: Focused on company website with `search_domain_filter`
   - Uses explicit website if provided, otherwise email domain
   - Automatically falls back without filter if results are insufficient
2. **Pass 2 (Company News)**: Broader search for recent company news and context
   - No domain filter
   - Focuses on news from last 6-12 months
3. **Pass 3 (Prospect Background)**: Individual prospect research
   - Only executed if prospect name/email provided
   - Searches LinkedIn, company leadership pages, recent activities

**Example**:
```typescript
const result = await performMultiPassResearch({
  companyDomain: "acme.com",
  companyName: "Acme Corp",
  prospectName: "Jane Doe",
  prospectEmail: "jane@acme.com",
  explicitWebsite: "https://acme.com",
}, {
  timeout: 180000,      // 3 minutes total
  passTimeout: 60000,   // 60s per pass
});

if (result.isPartialData) {
  console.warn("Some research passes failed", result.passes);
}
```

---

## Supporting Types

### ResearchSource
```typescript
interface ResearchSource {
  type: 'company_website' | 'linkedin' | 'crunchbase' | 'news' | 'twitter' | 'other';
  url: string;
  name?: string;
  relevance?: number;                     // 0.0-1.0 if provided by Perplexity
}
```

### ResearchMetadata
```typescript
interface ResearchMetadata {
  model: string;                          // e.g., "sonar-pro"
  tokenCount: number;                     // Total tokens used
  sourcesCited: number;                   // Number of sources cited
  searchDomainFilterUsed: string[] | null;
  fallbackOccurred: boolean;
  temperature: number;
  duration: number;                       // Milliseconds
  timestamp: string;                      // ISO 8601
}
```

### Error Classes

#### RateLimitError
```typescript
class RateLimitError extends Error {
  retryAfter: number;                     // Seconds to wait before retry
  rateLimitType: 'per_minute' | 'per_day' | 'concurrent';
}
```

#### TimeoutError
```typescript
class TimeoutError extends Error {
  operation: string;                      // e.g., "researchCompany", "Pass 1"
  timeoutMs: number;
}
```

#### InsufficientDataError
```typescript
class InsufficientDataError extends Error {
  attemptedDomains: string[];
  fallbackAttempted: boolean;
}
```

---

## Configuration Constants

```typescript
export const PERPLEXITY_CONFIG = {
  MODEL: 'sonar-pro' as const,
  TEMPERATURE_DEFAULT: 0.2,
  TEMPERATURE_MIN: 0.1,
  TEMPERATURE_MAX: 0.3,
  MAX_TOKENS_COMPANY: 4000,
  MAX_TOKENS_PROSPECT: 3000,
  MAX_DOMAIN_FILTER_SIZE: 20,
  TIMEOUT_PER_PASS_MS: 60000,             // 60s
  TIMEOUT_TOTAL_MS: 180000,               // 3min
  TIMEOUT_HARD_MAX_MS: 300000,            // 5min
  RETRY_ATTEMPTS: 3,
  RETRY_BASE_DELAY_MS: 1000,
  SYSTEM_MESSAGE: "You are a research assistant. Always browse the live web and company websites. Use multiple sources and include recent information from the past 6-12 months.",
} as const;
```

---

## Backward Compatibility

### Breaking Changes from v1.0.0
- `CompanyResearchData` now includes `sources` and `metadata` fields
- `ProspectResearchData` now includes `sources` and `metadata` fields
- Model changed from `llama-3.1-sonar-large-128k-online` to `sonar-pro`
- Default `maxTokens` increased from 2000 to 4000 for company research

### Migration Path
```typescript
// v1.0.0 (OLD)
const data = await researchCompany("acme.com");
// data.recentNews is string

// v2.0.0 (NEW)
const data = await researchCompany("acme.com");
// data.recentNews is string[] (array)
// data.sources is ResearchSource[]
// data.metadata is ResearchMetadata

// Backward-compatible usage:
const newsText = data.recentNews?.join("\n") || "";
```

---

## Contract Tests

Contract tests are located at: `__tests__/contract/perplexity.contract.test.ts`

### Key Test Scenarios
1. ✅ `researchCompany` returns valid `CompanyResearchData` structure
2. ✅ `researchProspect` returns valid `ProspectResearchData` structure
3. ✅ `performMultiPassResearch` returns valid `MultiPassResearchResult` structure
4. ✅ Rate limit errors are properly thrown and typed
5. ✅ Timeout errors are properly thrown when exceeded
6. ✅ Domain filter fallback occurs when results are insufficient
7. ✅ Partial data flag is set when passes fail
8. ✅ All functions accept valid options and reject invalid options

### Example Contract Test
```typescript
describe('Perplexity Service Contract', () => {
  it('researchCompany returns valid structure', async () => {
    const result = await researchCompany("example.com", {
      searchDomainFilter: ["example.com"],
    });

    // Contract assertions
    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('sources');
    expect(result).toHaveProperty('metadata');
    expect(result.sources).toBeInstanceOf(Array);
    expect(result.metadata.model).toBe('sonar-pro');
    expect(result.metadata.tokenCount).toBeGreaterThan(0);
  });
});
```

---

## Performance Guarantees

| Operation | Target | Hard Limit |
|-----------|--------|------------|
| `researchCompany` single pass | 30-45s | 60s |
| `researchProspect` single pass | 20-30s | 60s |
| `performMultiPassResearch` total | 90-120s | 180s (3min) |

**Note**: Timeouts are configurable but defaults ensure reasonable performance.

---

## Usage Guidelines

### When to use `searchDomainFilter`
- ✅ When you have explicit company website from user input
- ✅ When researching specific company and want focused results
- ❌ When researching broader topics or industry trends
- ❌ When company has minimal web presence (filter may be too restrictive)

### When to use `performMultiPassResearch`
- ✅ For ad-hoc research requests with prospect information
- ✅ When comprehensive, multi-source research is needed
- ❌ For quick lookups or cached data refresh
- ❌ When only company overview is needed (use `researchCompany` directly)

### Temperature Guidelines
- **0.1**: Maximum factuality, minimal creativity (financial data, statistics)
- **0.2**: Default balance (general company/prospect research)
- **0.3**: Slightly more exploratory (when data is sparse)

---

## Logging & Observability

All functions log the following to `ResearchMetadata`:
- Model used
- Token count
- Sources cited
- Domain filter configuration
- Fallback occurrences
- Duration
- Timestamp

**Example Log Entry**:
```json
{
  "operation": "researchCompany",
  "companyDomain": "acme.com",
  "metadata": {
    "model": "sonar-pro",
    "tokenCount": 3847,
    "sourcesCited": 5,
    "searchDomainFilterUsed": ["acme.com", "www.acme.com"],
    "fallbackOccurred": false,
    "temperature": 0.2,
    "duration": 42350,
    "timestamp": "2025-12-10T10:30:00.000Z"
  }
}
```

---

## Security Considerations

### API Key Management
- Perplexity API key stored in `PERPLEXITY_API_KEY` environment variable
- Never log API keys or include in error messages
- API key rotation requires no code changes (environment-driven)

### Input Validation
- Domain names validated against FQDN regex before API calls
- URL protocols stripped before domain extraction
- Domain filter size limited to 20 domains (Perplexity API limit)

### Rate Limiting
- Respect Perplexity API rate limits (50 req/min standard tier)
- Exponential backoff with jitter for retry logic
- No client-side rate limit caching (rely on API 429 responses)

---

## Summary

The Perplexity service contract defines three core functions:
1. **`researchCompany`**: Single-pass company research with optional domain filtering
2. **`researchProspect`**: Single-pass individual prospect research
3. **`performMultiPassResearch`**: Multi-pass orchestration for comprehensive research

All functions use the upgraded `sonar-pro` model, support explicit web browsing instructions, and return detailed metadata for observability. The contract prioritizes reliability (graceful degradation, fallback strategies) and quality (focused prompts, domain filtering) over speed.
