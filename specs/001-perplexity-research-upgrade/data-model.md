# Data Model: Perplexity Research Quality Enhancement

**Feature**: 001-perplexity-research-upgrade
**Generated**: 2025-12-10

## Overview

This document describes the data model changes and entities affected by the Perplexity research quality enhancement feature. The primary change is adding a `website` field to the `adHocResearchRequests` table to support explicit website URL input.

## Entity Changes

### Modified Entities

#### 1. Ad-Hoc Research Request (adHocResearchRequests)

**Purpose**: Represents a user-initiated research request through the ad-hoc form

**Schema Changes**:
```typescript
export const adHocResearchRequests = pgTable("adhoc_research_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  campaignId: uuid("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  prospectName: varchar("prospect_name", { length: 255 }),
  companyName: varchar("company_name", { length: 255 }),
  email: varchar("email", { length: 255 }),
  website: varchar("website", { length: 500 }),  // ← NEW FIELD
  status: adHocStatusEnum("status").default("pending").notNull(),
  researchBriefId: uuid("research_brief_id"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

**New Field Details**:
- **Name**: `website`
- **Type**: `varchar(500)`
- **Nullable**: Yes (optional)
- **Purpose**: Store user-provided company website URL for research prioritization
- **Validation**: Must be valid URL format (http://, https://, or bare domain)
- **Business Rules**:
  - When provided alongside email, website is prioritized for research
  - Email domain used as fallback if website research yields insufficient results
  - Can be sole field populated (no email/name/company required)

**Validation Rules**:
- **Before**: At least one of `prospectName`, `companyName`, or `email` required
- **After**: At least one of `prospectName`, `companyName`, `email`, or `website` required

**State Transitions**: No changes (status enum remains same: pending → generating → ready/failed)

### Unchanged Core Entities

The following entities remain unchanged but are used in the feature implementation:

#### 2. Company (companies)

**No schema changes**. Already has `website` field and `domain` field used for research.

**Usage in Feature**:
- `domain` field extracted from email or website URL
- Used for `search_domain_filter` parameter in Perplexity API calls
- Stores research results after successful company research

**Relevant Fields**:
```typescript
{
  domain: varchar("domain", { length: 255 }).notNull().unique(),  // Used for search_domain_filter
  name: varchar("name", { length: 255 }),
  industry: varchar("industry", { length: 255 }),
  website: varchar("website", { length: 500 }),                    // Stores company website
  lastResearchedAt: timestamp("last_researched_at"),              // Updated after research
  // ... other fields
}
```

#### 3. Research Brief (researchBriefs)

**No schema changes**. Stores generated research content from Claude synthesis.

**Usage in Feature**:
- Receives consolidated output from multi-pass research (3 Perplexity calls)
- Links to ad-hoc request via `adHocRequestId`
- `confidenceRating` reflects quality/completeness of research results

**Relevant Fields**:
```typescript
{
  type: briefTypeEnum("type").notNull(),                           // 'adhoc' for ad-hoc requests
  confidenceRating: confidenceRatingEnum("confidence_rating"),     // HIGH/MEDIUM/LOW
  confidenceExplanation: text("confidence_explanation"),           // Explains rating
  companyOverview: text("company_overview"),                       // From company research passes
  // ... other fields
}
```

#### 4. Research Sources (researchSources)

**No schema changes**. Records where research information originated.

**Usage in Feature**:
- Logs sources from Perplexity API responses (citations)
- `sourceType` enum already includes: company_website, linkedin, crunchbase, news, twitter, other
- Multiple sources per research brief (1-to-many relationship)

**Relevant Fields**:
```typescript
{
  researchBriefId: uuid("research_brief_id").notNull(),
  sourceType: sourceTypeEnum("source_type").notNull(),
  sourceUrl: varchar("source_url", { length: 500 }),
  sourceName: varchar("source_name", { length: 255 }),
  // ... other fields
}
```

#### 5. Prospect (prospects)

**No schema changes**. Stores prospect information discovered during research.

**Usage in Feature**:
- Updated/created after prospect research pass completes
- `companyId` links prospect to researched company
- `email` remains unique identifier for prospects

## TypeScript Interfaces

### Modified Interfaces

#### AdHocFormData
```typescript
interface AdHocFormData {
  prospectName?: string;
  companyName?: string;
  email?: string;
  website?: string;           // ← NEW FIELD
  campaignId: string;
}
```

**Validation**:
```typescript
// Zod schema for API endpoint
const createAdHocSchema = z.object({
  prospectName: z.string().trim().optional(),
  companyName: z.string().trim().optional(),
  email: z.string().email().trim().optional(),
  website: z.string().url().trim().optional(),  // ← NEW FIELD
  campaignId: z.string().min(1),
}).refine(
  (data) => data.prospectName || data.companyName || data.email || data.website,
  { message: 'At least one of prospectName, companyName, email, or website is required' }
);
```

### New Configuration Interfaces

#### PerplexityResearchConfig
```typescript
interface PerplexityResearchConfig {
  model: 'sonar-pro';                           // Upgraded from llama-3.1-sonar-large-128k-online
  temperature: number;                          // 0.1-0.3 range (0.2 default)
  max_tokens: number;                           // 2000-4000 range (4000 default)
  search_domain_filter?: string[];              // Optional domain allowlist (max 20 domains)
  system_message: string;                       // Explicit web browsing instruction
}
```

#### ResearchPass
```typescript
interface ResearchPass {
  intent: 'company_website' | 'company_news' | 'prospect_background';
  prompt: string;
  config: PerplexityResearchConfig;
  timeout: number;                              // 60s per pass
}
```

#### ResearchOperationLog
```typescript
interface ResearchOperationLog {
  pass: ResearchPass['intent'];
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
  fallbackOccurred: boolean;                    // True if domain filter was removed due to insufficient results
}
```

### Updated Service Interfaces

#### ProspectInput (research orchestration)
```typescript
interface ProspectInput {
  email: string;
  name?: string;
  companyDomain?: string;
  website?: string;                             // ← NEW FIELD (prioritized over companyDomain)
}
```

## Database Migration

**Migration File**: `drizzle/migrations/0XXX_add_website_to_adhoc.sql`

```sql
-- Add website column to adhoc_research_requests table
ALTER TABLE adhoc_research_requests
ADD COLUMN website VARCHAR(500);

-- Add comment explaining the field
COMMENT ON COLUMN adhoc_research_requests.website IS
'User-provided company website URL. Prioritized over email domain for research when both are present.';
```

**Rollback**:
```sql
ALTER TABLE adhoc_research_requests DROP COLUMN website;
```

## Relationships

### Entity Relationship Diagram

```
┌─────────────────────────────┐
│ adHocResearchRequests       │
├─────────────────────────────┤
│ id (PK)                     │
│ userId (FK → users)         │
│ campaignId (FK → campaigns) │
│ prospectName                │
│ companyName                 │
│ email                       │
│ website ← NEW               │
│ status                      │
│ researchBriefId (FK)        │
└──────────┬──────────────────┘
           │
           │ 1:1
           ↓
┌─────────────────────────────┐
│ researchBriefs              │
├─────────────────────────────┤
│ id (PK)                     │
│ type: 'adhoc'               │
│ campaignId (FK)             │
│ adHocRequestId (FK)         │
│ confidenceRating            │
│ companyOverview             │
│ ... (research content)      │
└──────────┬──────────────────┘
           │
           │ 1:N
           ↓
┌─────────────────────────────┐
│ researchSources             │
├─────────────────────────────┤
│ id (PK)                     │
│ researchBriefId (FK)        │
│ sourceType                  │
│ sourceUrl                   │
│ sourceName                  │
└─────────────────────────────┘
```

## Data Flow

### Ad-Hoc Research Request Lifecycle

```
1. User submits form with website
   ↓
2. POST /api/adhoc validates & creates adHocResearchRequest
   ↓
3. Inngest event: research/generate.adhoc
   ↓
4. Extract/normalize website → domain for search_domain_filter
   ↓
5. Trigger research/generate.requested
   ↓
6. Orchestrate 3-pass research:
   - Pass 1: Company website (with search_domain_filter)
   - Pass 2: Company news (no domain filter)
   - Pass 3: Prospect background (no domain filter)
   ↓
7. Consolidate results → Claude brief generation
   ↓
8. Store company, prospects, research brief, sources
   ↓
9. Update adHocResearchRequest.status = 'ready'
```

### Website Field Priority Logic

```
IF website provided AND email provided:
  PRIMARY: Use website domain for search_domain_filter in Pass 1
  FALLBACK: If Pass 1 yields insufficient results, retry without filter
            Email domain can be used as secondary source
ELSE IF website provided ONLY:
  Use website domain for search_domain_filter
ELSE IF email provided ONLY:
  Extract domain from email for search_domain_filter
ELSE:
  Use company name for broader search (no domain filter)
```

## Validation Summary

### Field-Level Validation

| Field | Required | Format | Max Length | Notes |
|-------|----------|--------|------------|-------|
| prospectName | No | String | 255 | Optional |
| companyName | No | String | 255 | Optional |
| email | No | Email | 255 | Optional, must be valid email format |
| website | No | URL | 500 | Optional, accepts http://, https://, bare domain |
| campaignId | Yes | UUID | - | Must reference existing campaign |

### Cross-Field Validation

- **At least one required**: `prospectName OR companyName OR email OR website`
- **Website format**: If provided, must be valid URL or bare domain (e.g., "company.com", "https://company.com")
- **Email format**: If provided, must match email regex pattern

## Performance Considerations

### Database Indexes

**Existing indexes** (no changes needed):
- `adHocResearchRequests.id` (PK, indexed)
- `adHocResearchRequests.userId` (FK, indexed)
- `adHocResearchRequests.campaignId` (FK, indexed)
- `companies.domain` (unique, indexed)

**No new indexes required**: `website` field is not queried for filtering/sorting

### Query Performance

- **INSERT**: No performance impact (one additional varchar field)
- **SELECT**: Minimal impact (500-byte varchar, typically <100 bytes actual data)
- **UPDATE**: No additional overhead

## Security & Privacy

### Data Sensitivity

- **website field**: Low sensitivity (public company website URLs)
- **PII considerations**: None (URLs are public information)
- **SQL injection**: Mitigated by Drizzle ORM parameterized queries

### Input Validation

- **URL validation**: Zod schema ensures valid URL format before DB insert
- **Length limits**: 500 characters prevents abuse
- **XSS prevention**: URLs sanitized before display in UI

## Testing Data

### Test Cases for Website Field

```typescript
// Valid inputs
{ website: "https://example.com" }
{ website: "http://example.com" }
{ website: "example.com" }
{ website: "www.example.com" }

// Invalid inputs (should fail validation)
{ website: "not-a-url" }
{ website: "javascript:alert(1)" }
{ website: "ftp://example.com" }

// Edge cases
{ website: "https://example.com/very/long/path?with=params" }  // Valid
{ website: "" }                                                // Treated as undefined
{ website: null }                                              // Treated as undefined
```

### Mock Research Data

```typescript
const mockAdHocRequest = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  userId: "550e8400-e29b-41d4-a716-446655440001",
  campaignId: "550e8400-e29b-41d4-a716-446655440002",
  prospectName: "Jane Doe",
  companyName: "Acme Corp",
  email: "jane@acme.com",
  website: "https://acme.com",
  status: "pending",
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

## Backward Compatibility

### Existing Data

- **No migration required for existing records**: `website` column is nullable
- **Existing ad-hoc requests**: Will have `website = null`, continue to work normally
- **Existing code**: All queries continue to work (nullable column doesn't break SELECT *)

### API Compatibility

- **Backward compatible**: `website` is optional in request body
- **Forward compatible**: Old clients can omit `website` field without errors

## Summary

The data model changes for this feature are minimal and focused:

1. **Single schema change**: Add optional `website` column to `adHocResearchRequests` table
2. **No breaking changes**: All existing functionality continues to work
3. **Backward compatible**: Nullable column, optional in API
4. **Clean separation**: Research configuration and logging use runtime interfaces, not stored in DB
5. **Leverage existing entities**: Companies, prospects, research briefs, and sources tables remain unchanged

The feature primarily enhances **behavior** (Perplexity API configuration, multi-pass research) rather than **data structure**, making it a low-risk implementation with clear rollback path.
