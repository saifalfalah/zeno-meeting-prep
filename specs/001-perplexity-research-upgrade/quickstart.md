# Quickstart: Perplexity Research Quality Enhancement

**Feature**: 001-perplexity-research-upgrade
**Branch**: `001-perplexity-research-upgrade`
**Prerequisites**: Node.js 20+, PostgreSQL, Perplexity API key

## Overview

This guide walks through implementing the Perplexity research quality enhancement feature, which upgrades the research system from the llama-3.1 model to sonar-pro with multi-pass research strategy and website field support.

## Implementation Checklist

### Phase 1: Database Schema (30 minutes)

- [ ] **1.1** Create database migration for website field
  ```bash
  cd /Users/saifalfalah/saifinc/zeno-meeting-prep
  npx drizzle-kit generate:pg
  ```

- [ ] **1.2** Edit generated migration file in `drizzle/migrations/`
  - Add `website VARCHAR(500)` column to `adhoc_research_requests` table
  - Add column comment explaining prioritization logic

- [ ] **1.3** Run migration
  ```bash
  npx drizzle-kit push:pg
  ```

- [ ] **1.4** Verify schema change
  ```bash
  psql $DATABASE_URL -c "\d adhoc_research_requests"
  ```

**Checkpoint**: Database should have `website` column added to `adhoc_research_requests` table

---

### Phase 2: TypeScript Types & Interfaces (45 minutes)

- [ ] **2.1** Update `lib/db/schema.ts`
  - Add `website: varchar("website", { length: 500 })` to `adHocResearchRequests` table definition

- [ ] **2.2** Update TypeScript interfaces in `lib/services/research.ts`
  ```typescript
  interface ProspectInput {
    email: string;
    name?: string;
    companyDomain?: string;
    website?: string;  // NEW
  }
  ```

- [ ] **2.3** Update form data types in `components/adhoc/AdHocForm.tsx`
  ```typescript
  interface AdHocFormData {
    prospectName?: string;
    companyName?: string;
    email?: string;
    website?: string;  // NEW
    campaignId: string;
  }
  ```

- [ ] **2.4** Add Perplexity configuration types in `lib/services/perplexity.ts`
  ```typescript
  interface PerplexityResearchConfig {
    model: 'sonar-pro';
    temperature: number;
    max_tokens: number;
    search_domain_filter?: string[];
    system_message: string;
  }
  ```

**Checkpoint**: All TypeScript types compile without errors (`npm run type-check`)

---

### Phase 3: Perplexity API Upgrade (90 minutes)

- [ ] **3.1** Update model configuration in `lib/services/perplexity.ts`
  - Change model from `"llama-3.1-sonar-large-128k-online"` to `"sonar-pro"`
  - Update temperature range to 0.1-0.3 (default 0.2)
  - Update max_tokens to 4000 for company research, 3000 for prospect research

- [ ] **3.2** Add explicit web browsing system message
  ```typescript
  const SYSTEM_MESSAGE = "You are a research assistant. Always browse the live web and company websites. Use multiple sources and include recent information from the past 6-12 months.";
  ```

- [ ] **3.3** Add `search_domain_filter` parameter support to `researchCompany` function
  ```typescript
  async function researchCompany(
    companyDomain: string,
    options?: { searchDomainFilter?: string[] }
  ): Promise<CompanyResearchData>
  ```

- [ ] **3.4** Implement domain filter fallback logic
  - If initial call with `search_domain_filter` returns insufficient results, retry without filter
  - Log when fallback occurs

- [ ] **3.5** Add comprehensive logging for API calls
  - Log parameters: model, domain filter, temperature, max_tokens
  - Log response metadata: token count, sources cited
  - Log duration and any errors

**Checkpoint**: Perplexity API calls use sonar-pro model and return citations (`npm test -- perplexity.test.ts`)

---

### Phase 4: Multi-Pass Research Strategy (120 minutes)

- [ ] **4.1** Create new function `performMultiPassResearch` in `lib/services/perplexity.ts`

- [ ] **4.2** Implement Pass 1: Company Website Focus
  ```typescript
  const pass1 = await researchCompany(companyDomain, {
    searchDomainFilter: [explicitWebsite || emailDomain],
    includeDomainFallback: true,
  });
  ```

- [ ] **4.3** Implement Pass 2: Company News & Context
  ```typescript
  const pass2 = await researchCompany(companyDomain, {
    // No domain filter for broader news search
    prompt: "Find recent news and updates about the company from the past 6-12 months",
  });
  ```

- [ ] **4.4** Implement Pass 3: Prospect Background
  ```typescript
  if (prospectName) {
    const pass3 = await researchProspect({
      name: prospectName,
      email: prospectEmail,
      companyName,
      companyDomain,
    });
  }
  ```

- [ ] **4.5** Add timeout controls
  - 60s timeout per pass
  - 3min total timeout for all passes
  - Use `AbortController` for proper cancellation

- [ ] **4.6** Implement graceful degradation
  - Complete available passes even if one fails
  - Return `isPartialData: true` when passes fail
  - Don't throw on individual pass failures

**Checkpoint**: Multi-pass research completes within 3 minutes and handles partial failures gracefully

---

### Phase 5: Research Orchestration Updates (60 minutes)

- [ ] **5.1** Update `orchestrateResearch` in `lib/services/research.ts`
  - Accept `website` parameter in `ProspectInput`
  - Prioritize `website` over `companyDomain` when both provided

- [ ] **5.2** Integrate `performMultiPassResearch` function
  - Replace single Perplexity call with multi-pass approach
  - Pass `explicitWebsite` to research function

- [ ] **5.3** Update error handling for partial results
  - Handle rate limit errors (complete available research)
  - Mark research brief with `confidenceRating: LOW` when partial
  - Store `confidenceExplanation` describing what failed

- [ ] **5.4** Add comprehensive operation logging
  - Log start/end timestamps for each pass
  - Log fallback occurrences
  - Log partial result conditions

**Checkpoint**: Research orchestration uses multi-pass strategy and handles errors gracefully

---

### Phase 6: Ad-Hoc Form UI (60 minutes)

- [ ] **6.1** Add website field to `components/adhoc/AdHocForm.tsx`
  ```tsx
  <input
    type="text"
    name="website"
    placeholder="Company website (e.g., https://example.com)"
    className="..."
  />
  ```

- [ ] **6.2** Add URL validation
  - Accept formats: `https://example.com`, `http://example.com`, `example.com`
  - Show error for invalid URLs
  - Use Zod schema for validation

- [ ] **6.3** Update form validation logic
  - Change from "at least one of name/company/email" to "at least one of name/company/email/website"
  - Allow website-only submissions

- [ ] **6.4** Add accessibility attributes
  - Proper `<label>` for website input
  - Error message association with `aria-describedby`
  - Keyboard navigation support

- [ ] **6.5** Add helpful UI hints
  - Placeholder text explaining format
  - Helper text: "Prioritized over email domain when both are provided"

**Checkpoint**: Form accepts website input with validation (`npm test -- AdHocForm.test.tsx`)

---

### Phase 7: API Endpoint Updates (45 minutes)

- [ ] **7.1** Update Zod schema in `app/api/adhoc/route.ts`
  ```typescript
  const createAdHocSchema = z.object({
    prospectName: z.string().trim().optional(),
    companyName: z.string().trim().optional(),
    email: z.string().email().trim().optional(),
    website: z.string().url().trim().optional(),  // NEW
    campaignId: z.string().min(1),
  }).refine(
    (data) => data.prospectName || data.companyName || data.email || data.website,
    { message: 'At least one identifying field is required' }
  );
  ```

- [ ] **7.2** Update request handler to pass website to Inngest
  ```typescript
  await inngest.send({
    name: "research/generate.adhoc",
    data: {
      ...validatedData,
      website: validatedData.website,  // Explicitly pass
    },
  });
  ```

- [ ] **7.3** Test API endpoint
  - Test with website only
  - Test with website + email (verify prioritization)
  - Test with invalid website URL (verify 400 error)

**Checkpoint**: API endpoint accepts and validates website field (`npm test -- api/adhoc.test.ts`)

---

### Phase 8: Inngest Functions Updates (45 minutes)

- [ ] **8.1** Update `lib/inngest/functions/generate-adhoc-research.ts`
  - Extract `website` from event data
  - Pass to `ProspectInput` for research orchestration

- [ ] **8.2** Update `lib/inngest/functions/generate-research.ts`
  - Apply new Perplexity configuration
  - Handle multi-pass research results
  - Log operation details per FR-017

- [ ] **8.3** Add rate limit handling
  - Catch `RateLimitError` from Perplexity service
  - Complete available research passes
  - Mark brief as "partial results due to rate limiting"

- [ ] **8.4** Add 5-minute hard timeout
  - Use step timeout configuration in Inngest
  - Return partial results on timeout

**Checkpoint**: Inngest functions handle website field and execute multi-pass research

---

### Phase 9: Testing (180 minutes)

#### Unit Tests (60 min)

- [ ] **9.1** Update `__tests__/unit/services/perplexity.test.ts`
  - Test sonar-pro model usage
  - Test `search_domain_filter` parameter
  - Test domain filter fallback
  - Test rate limit error handling

- [ ] **9.2** Update `__tests__/unit/services/research.test.ts`
  - Test website prioritization over email domain
  - Test multi-pass research orchestration
  - Test partial result handling
  - Test timeout handling

- [ ] **9.3** Create `__tests__/unit/components/adhoc/AdHocForm.test.tsx`
  - Test website field validation
  - Test form submission with website only
  - Test URL format normalization

#### Integration Tests (60 min)

- [ ] **9.4** Update `__tests__/integration/api/adhoc.test.ts`
  - Test POST /api/adhoc with website field
  - Test website-only submission
  - Test invalid website URL rejection

- [ ] **9.5** Create end-to-end research flow test
  - Submit ad-hoc request with website
  - Verify research uses domain filter
  - Verify research brief generation completes

#### Contract Tests (30 min)

- [ ] **9.6** Create `__tests__/contract/perplexity.contract.test.ts`
  - Test `CompanyResearchData` structure includes sources and metadata
  - Test `ProspectResearchData` structure includes sources and metadata
  - Test `MultiPassResearchResult` structure

#### E2E Tests (30 min)

- [ ] **9.7** Update E2E tests in `e2e/`
  - Test ad-hoc form submission with website field
  - Verify research brief appears in UI

**Checkpoint**: All tests pass (`npm test && npm run test:e2e`)

---

### Phase 10: Documentation & Deployment (60 minutes)

- [ ] **10.1** Update API documentation
  - Document website field in API reference
  - Update example requests

- [ ] **10.2** Update user-facing documentation
  - Add website field to user guide
  - Explain prioritization logic

- [ ] **10.3** Verify environment variables
  ```bash
  echo $PERPLEXITY_API_KEY  # Should be set
  ```

- [ ] **10.4** Run final checks
  ```bash
  npm run lint
  npm run type-check
  npm test
  npm run build
  ```

- [ ] **10.5** Create pull request
  - Reference feature spec and plan
  - Include testing evidence
  - Request review

**Checkpoint**: Feature ready for code review

---

## Quick Commands Reference

```bash
# Setup
cd /Users/saifalfalah/saifinc/zeno-meeting-prep
git checkout 001-perplexity-research-upgrade

# Database
npx drizzle-kit generate:pg
npx drizzle-kit push:pg

# Testing
npm test                              # All tests
npm test -- perplexity.test.ts        # Specific test file
npm run test:e2e                      # E2E tests

# Type checking & linting
npm run type-check
npm run lint

# Build & run
npm run build
npm run dev
```

## Environment Variables Required

```bash
# .env.local
PERPLEXITY_API_KEY=pplx-xxxxx        # Required for API calls
DATABASE_URL=postgresql://...         # Required for database
```

## File Modifications Summary

| File | Type | Description |
|------|------|-------------|
| `lib/db/schema.ts` | MODIFY | Add website field to adHocResearchRequests |
| `drizzle/migrations/0XXX_add_website.sql` | CREATE | Database migration |
| `lib/services/perplexity.ts` | MODIFY | Upgrade to sonar-pro, add multi-pass function |
| `lib/services/research.ts` | MODIFY | Update orchestration for multi-pass |
| `components/adhoc/AdHocForm.tsx` | MODIFY | Add website field and validation |
| `app/api/adhoc/route.ts` | MODIFY | Update Zod schema for website |
| `lib/inngest/functions/generate-adhoc-research.ts` | MODIFY | Pass website to research |
| `lib/inngest/functions/generate-research.ts` | MODIFY | Apply new Perplexity config |
| `__tests__/unit/services/perplexity.test.ts` | MODIFY | Add sonar-pro tests |
| `__tests__/unit/services/research.test.ts` | MODIFY | Add multi-pass tests |
| `__tests__/unit/components/adhoc/AdHocForm.test.tsx` | CREATE | Website field tests |
| `__tests__/integration/api/adhoc.test.ts` | MODIFY | Website endpoint tests |
| `__tests__/contract/perplexity.contract.test.ts` | CREATE | Perplexity contract tests |

## Common Issues & Troubleshooting

### Issue: Perplexity API returns 401 Unauthorized
**Solution**: Verify `PERPLEXITY_API_KEY` environment variable is set correctly

### Issue: Database migration fails
**Solution**: Ensure PostgreSQL is running and `DATABASE_URL` is correct

### Issue: Rate limit errors during testing
**Solution**: Mock Perplexity API responses in tests using `vi.mock()`

### Issue: Timeout errors in research
**Solution**: Check Perplexity API latency, adjust timeout values if needed

### Issue: Form validation rejects valid URLs
**Solution**: Check Zod URL schema accepts http/https/bare domain formats

## Testing Strategy

### Local Testing
1. Run unit tests: `npm test`
2. Run E2E tests: `npm run test:e2e`
3. Manual testing: Submit ad-hoc request with website field in dev environment

### Production Validation (Post-Deploy)
1. Monitor research execution times (should remain <3min)
2. Monitor Perplexity API rate limit errors
3. Verify research quality improvement (spot-check briefs for web-sourced content)
4. Check error logs for fallback occurrences

## Performance Benchmarks

| Metric | Target | Measurement |
|--------|--------|-------------|
| Single research pass | 30-45s | Time from API call to response |
| Multi-pass research | 90-120s | Total time for 3 passes |
| Hard timeout | 3-5min | Max execution time before abort |
| API endpoint response | <200ms | POST /api/adhoc validation + DB insert |
| Form field validation | <100ms | URL validation on blur |

## Success Criteria Validation

After implementation, verify these success criteria from the spec:

- [ ] **SC-001**: Research briefs contain verifiable company website content (spot-check 10 briefs)
- [ ] **SC-002**: Research quality improves vs. pre-upgrade (compare 5 briefs before/after)
- [ ] **SC-003**: Website-only submissions work without errors
- [ ] **SC-004**: 90%+ success rate for ad-hoc requests with valid websites
- [ ] **SC-005**: Research briefs cite 2-3+ sources
- [ ] **SC-006**: Webhook research quality matches ad-hoc quality
- [ ] **SC-007**: Invalid websites handled gracefully with fallback
- [ ] **SC-008**: Research execution under 45s target (3-5min hard max)

## Next Steps

After completing this quickstart:

1. **Code Review**: Create PR and request review from team
2. **Staging Deploy**: Deploy to staging environment for validation
3. **Production Deploy**: Deploy to production with monitoring
4. **Post-Deploy Monitoring**: Watch for rate limit errors, timeouts, quality improvements
5. **User Feedback**: Gather feedback on research quality improvements

## Support & Resources

- **Feature Spec**: `/specs/001-perplexity-research-upgrade/spec.md`
- **Research Findings**: `/specs/001-perplexity-research-upgrade/research.md`
- **Data Model**: `/specs/001-perplexity-research-upgrade/data-model.md`
- **API Contracts**: `/specs/001-perplexity-research-upgrade/contracts/`
- **Perplexity API Docs**: https://docs.perplexity.ai/
- **Drizzle ORM Docs**: https://orm.drizzle.team/
