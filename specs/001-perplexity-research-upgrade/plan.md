# Implementation Plan: Perplexity Research Quality Enhancement

**Branch**: `001-perplexity-research-upgrade` | **Date**: 2025-12-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-perplexity-research-upgrade/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Upgrade Perplexity API integration from llama-3.1-sonar-large-128k-online to sonar-pro model with explicit web browsing instructions, search_domain_filter for company-focused research, and multi-pass research strategy (3 passes: company website, company news, prospect background). Add optional website field to ad-hoc research form with URL validation, prioritizing explicit websites over email domains. Apply consistent configuration across both ad-hoc and webhook-triggered research pathways. Implement comprehensive logging, rate limit handling, timeout controls, and automatic fallback when domain filters are too restrictive.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 15.x (App Router), Node.js 20+
**Primary Dependencies**: Next.js 15, React 18, Drizzle ORM, PostgreSQL, Inngest (background jobs), Perplexity API, Zod (validation), Vitest (testing), Playwright (E2E)
**Storage**: PostgreSQL (Drizzle ORM) - Tables: adHocResearchRequests, companies, researchBriefs, researchSources, prospects
**Testing**: Vitest (unit/integration), Playwright (E2E), contract tests in __tests__/contract/
**Target Platform**: Node.js 20+ server, modern web browsers (Chrome/Safari/Firefox latest)
**Project Type**: Web application (Next.js App Router with API routes)
**Performance Goals**:
  - API endpoints: <200ms p95 response time
  - Research execution: 45s target, 5min hard maximum timeout
  - UI interactions: <100ms feedback
  - Multi-pass research: 3 Perplexity API calls per prospect (company website, news, prospect)
**Constraints**:
  - Perplexity API rate limits (retries with exponential backoff)
  - Research must complete within 5 minutes hard timeout
  - Client bundle: <300KB gzipped
  - WCAG 2.1 Level AA compliance for form accessibility
**Scale/Scope**:
  - Current codebase: ~50 files across app/, components/, lib/
  - Key affected files: 9 core files (perplexity service, form component, API route, schema, orchestration)
  - Testing scope: ~20 test files (unit, integration, contract, E2E)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Code Quality ✅ PASS

- **Self-Documenting Code**: New configuration parameters (search_domain_filter, sonar-pro model) will use descriptive names. URL validation functions will clearly express intent.
- **Single Responsibility**: Each function maintains clear purpose (researchCompany, researchProspect, orchestrateResearch remain focused)
- **DRY Principle**: Multi-pass research logic will be abstracted into reusable functions, avoiding duplication across ad-hoc and webhook pathways
- **Type Safety**: All new parameters (website field, research configuration) will use TypeScript interfaces with strict typing
- **Error Handling**: Rate limit handling, timeout handling, and fallback logic will provide actionable error context
- **No Magic Values**: Model name "sonar-pro", temperature ranges (0.1-0.3), timeout values (5min) will be extracted as named constants

### II. Testing Standards ✅ PASS

- **Test-First Development**: Will write tests for new website validation, multi-pass research, and domain filtering BEFORE implementation
- **Test Coverage Minimums**:
  - Unit tests: perplexity service, research orchestration, URL validation (target >80% coverage)
  - Integration tests: API endpoint with website field, end-to-end research flow
  - Contract tests: Perplexity API contract (sonar-pro model parameters)
- **Contract Testing**: Will add contract tests for Perplexity API with new sonar-pro parameters and search_domain_filter
- **Test Quality**: All tests will be deterministic (mock Perplexity API responses), isolated, and fast
- **Test Organization**: Tests mirror source structure (__tests__/unit/services/, __tests__/integration/api/)

### III. User Experience Consistency ✅ PASS

- **Design System Adherence**: Website field will follow existing form field styling in AdHocForm component
- **Accessibility Standards**: Website input will have proper labels, error messages, and keyboard navigation (WCAG 2.1 Level AA)
- **Error Messages**: User-facing errors will be actionable ("Website URL is invalid. Please use format: https://company.com")
- **Loading States**: Research execution already has loading indicators; will maintain consistency
- **Responsive Design**: Website field will be responsive across mobile/tablet/desktop (already handled by existing form)
- **Internationalization Ready**: Error messages will be externalized (if i18n framework exists; otherwise text will be clear English)

### IV. Performance Requirements ✅ PASS

- **Response Time Targets**:
  - API endpoint: <200ms (just validation/DB insert, no change to existing performance)
  - UI interactions: Website field validation <100ms (synchronous validation)
  - Research execution: 45s target with 5min hard timeout (as specified in FR-019 and SC-008)
- **Resource Constraints**:
  - Client bundle: Website field adds minimal JS (<5KB), well under 300KB budget
  - No memory leaks: Research functions will properly clean up after timeout
  - Database queries: Uses indexed fields (id, userId, campaignId) - no full table scans
- **Scalability Baselines**:
  - Multi-pass research (3 API calls) handled with Promise.all for parallelization where possible
  - Perplexity API rate limiting already handled with exponential backoff
  - Research orchestration supports horizontal scaling (stateless functions)
- **Monitoring & Budgets**: Will add comprehensive logging per FR-017 for performance monitoring

### V. Simplicity & Maintainability ✅ PASS

- **YAGNI Principle**: Only implementing specified requirements; no hypothetical features
- **Minimal Dependencies**: No new dependencies required (using existing Perplexity SDK, Zod validation, Drizzle ORM)
- **Technology Choices**: Continuing with established stack (Next.js, TypeScript, Perplexity API)
- **Refactoring Discipline**: Multi-pass research logic will be refactored into clean, testable functions before merging
- **Configuration**: Using environment variables for API keys (already established pattern); sensible defaults for temperature (0.2) and max_tokens (2000-3000)

### Quality Gates Status: ✅ ALL PASS

- No constitution violations
- Ready to proceed to Phase 0 research
- Will re-evaluate after Phase 1 design

---

## Post-Design Constitution Re-Evaluation

*Completed after Phase 1 (research, data model, contracts, quickstart)*

### Re-Evaluation Summary: ✅ ALL PASS (Confirmed)

After completing design artifacts (research.md, data-model.md, contracts/, quickstart.md), the implementation plan continues to adhere to all constitution principles:

#### I. Code Quality ✅ CONFIRMED
- **Design Artifacts Validate**:
  - Research identified clean abstractions (tldts for domain extraction, AbortController for timeouts)
  - Data model uses TypeScript interfaces with strict typing
  - Service contracts define clear single-responsibility functions
  - Magic values extracted to PERPLEXITY_CONFIG constants

#### II. Testing Standards ✅ CONFIRMED
- **Design Artifacts Validate**:
  - Quickstart includes comprehensive test plan (unit, integration, contract, E2E)
  - Contract tests documented in `perplexity-service.md`
  - Test-first approach mandated in quickstart Phase 9
  - 80%+ coverage target explicitly stated

#### III. User Experience Consistency ✅ CONFIRMED
- **Design Artifacts Validate**:
  - API contract specifies accessible error messages
  - Quickstart mandates WCAG 2.1 Level AA compliance for website field
  - Loading states preserved (no changes to existing UX)
  - Responsive design handled by existing form infrastructure

#### IV. Performance Requirements ✅ CONFIRMED
- **Design Artifacts Validate**:
  - Research specifies timeout controls (60s per pass, 180s total, 5min hard max)
  - Performance benchmarks documented in quickstart (30-45s per pass target)
  - API endpoint remains <200ms (no change to existing performance)
  - Client bundle impact minimal (<5KB for website field)

#### V. Simplicity & Maintainability ✅ CONFIRMED
- **Design Artifacts Validate**:
  - No new dependencies required (using existing Perplexity SDK, Zod, Drizzle ORM)
  - Multi-pass research abstracted into reusable function
  - Data model changes minimal (single nullable column)
  - Backward compatibility maintained (no breaking changes)

### Final Assessment

**Verdict**: ✅ **READY FOR IMPLEMENTATION**

All constitution principles validated through design artifacts. No complexity violations identified. Feature follows established patterns, maintains backward compatibility, and introduces minimal changes while delivering significant value (improved research quality).

**Key Strengths**:
1. Minimal schema changes (1 nullable column)
2. No new dependencies
3. Comprehensive testing strategy
4. Clear performance budgets
5. Graceful degradation (partial results on failure)

**Proceed to**: `/speckit.tasks` command to generate implementation tasks

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
app/
├── (dashboard)/
│   └── ad-hoc/
│       ├── new/page.tsx           # Ad-hoc research form page
│       ├── [id]/page.tsx          # Research detail view
│       └── page.tsx               # Ad-hoc list view
└── api/
    ├── adhoc/route.ts             # POST /api/adhoc - Create ad-hoc research request
    └── webhooks/
        └── google-calendar/route.ts # Calendar webhook handler

components/
└── adhoc/
    └── AdHocForm.tsx              # Form component (add website field here)

lib/
├── db/
│   ├── schema.ts                  # Database schema (add website field to adHocResearchRequests)
│   └── queries/
│       └── adhoc.ts               # Database query helpers
├── services/
│   ├── perplexity.ts              # Perplexity API integration (upgrade to sonar-pro)
│   ├── research.ts                # Research orchestration (multi-pass logic)
│   └── claude.ts                  # Claude brief generation
└── inngest/
    └── functions/
        ├── generate-research.ts        # Main research job
        └── generate-adhoc-research.ts  # Ad-hoc research preprocessing

__tests__/
├── unit/
│   ├── services/
│   │   ├── perplexity.test.ts     # Test sonar-pro, search_domain_filter
│   │   └── research.test.ts       # Test multi-pass, website handling
│   └── components/
│       └── adhoc/
│           └── AdHocForm.test.tsx # Test website field validation
├── integration/
│   └── api/
│       └── adhoc.test.ts          # Test API endpoint with website field
└── contract/
    └── perplexity.contract.test.ts # Test Perplexity API contract

drizzle/
└── migrations/
    └── 0XXX_add_website_to_adhoc.sql # Database migration
```

**Structure Decision**: Next.js 15 App Router monolith structure. All source code is at repository root organized by concern (app/ for routes, components/ for UI, lib/ for business logic). Tests mirror source structure in __tests__/ directory. This is a web application with integrated frontend and API routes, following Next.js conventions.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations identified. This feature adheres to all code quality, testing, UX, performance, and simplicity principles outlined in the constitution.
