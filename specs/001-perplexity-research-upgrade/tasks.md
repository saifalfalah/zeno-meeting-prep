# Tasks: Perplexity Research Quality Enhancement

**Feature**: 001-perplexity-research-upgrade
**Branch**: `001-perplexity-research-upgrade`
**Input**: Design documents from `/specs/001-perplexity-research-upgrade/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Included per quickstart.md Phase 9 requirements (unit, integration, contract, E2E tests)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Project structure follows Next.js 15 App Router conventions:
- `app/` - Next.js pages and API routes
- `components/` - React components
- `lib/` - Business logic, services, database
- `__tests__/` - Test files mirroring source structure
- `drizzle/` - Database migrations

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database schema changes and type definitions

- [X] T001 Create database migration file in drizzle/migrations/0XXX_add_website_to_adhoc.sql to add website VARCHAR(500) column to adhoc_research_requests table
- [X] T002 Run database migration using npx drizzle-kit push:pg to apply schema changes
- [X] T003 Update lib/db/schema.ts to add website: varchar("website", { length: 500 }) to adHocResearchRequests table definition
- [X] T004 [P] Install tldts library for domain extraction using npm install tldts
- [X] T005 [P] Verify schema change by running psql command to check adhoc_research_requests table structure

**Checkpoint**: Database schema updated, all dependencies installed

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure and configuration that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 [P] Create TypeScript interfaces in lib/services/perplexity.ts for PerplexityResearchConfig, ResearchPass, ResearchOperationLog, ResearchSource, ResearchMetadata
- [X] T007 [P] Add PERPLEXITY_CONFIG constants in lib/services/perplexity.ts with model name (sonar-pro), temperature defaults, max_tokens, timeouts, system message
- [X] T008 [P] Create error classes in lib/services/perplexity.ts: RateLimitError, TimeoutError, InsufficientDataError
- [X] T009 [P] Implement URL validation function isValidUrl in lib/utils/url.ts using native URL API
- [X] T010 [P] Implement URL normalization function normalizeUrl in lib/utils/url.ts to ensure https:// protocol
- [X] T011 [P] Implement domain extraction function extractDomain in lib/utils/url.ts using tldts library
- [X] T012 [P] Implement exponential backoff retry function withRetry in lib/utils/retry.ts with jitter support
- [X] T013 [P] Implement timeout wrapper function withTimeout in lib/utils/timeout.ts using AbortController
- [X] T014 Update ProspectInput interface in lib/services/research.ts to add website?: string field
- [X] T015 Update AdHocFormData interface in components/adhoc/AdHocForm.tsx to add website?: string field

**Checkpoint**: Foundation ready - all core utilities and types available for user story implementation

---

## Phase 3: User Story 1 - Improved Company Research Quality (Priority: P1) 🎯 MVP

**Goal**: Upgrade Perplexity API integration to use sonar-pro model with explicit web browsing instructions and search_domain_filter for high-quality, web-sourced company research

**Independent Test**: Submit ad-hoc research request with company website URL only, verify research brief contains information sourced from actual company website with verifiable citations

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T016 [P] [US1] Create contract test file __tests__/contract/perplexity.contract.test.ts to test CompanyResearchData structure includes sources and metadata fields
- [ ] T017 [P] [US1] Add test in __tests__/unit/services/perplexity.test.ts to verify sonar-pro model is used in API calls
- [ ] T018 [P] [US1] Add test in __tests__/unit/services/perplexity.test.ts to verify search_domain_filter parameter is passed correctly
- [ ] T019 [P] [US1] Add test in __tests__/unit/services/perplexity.test.ts to verify domain filter fallback occurs when results are insufficient

### Implementation for User Story 1

- [ ] T020 [US1] Update researchCompany function in lib/services/perplexity.ts to change model from llama-3.1-sonar-large-128k-online to sonar-pro
- [ ] T021 [US1] Add explicit web browsing system message to researchCompany function in lib/services/perplexity.ts
- [ ] T022 [US1] Update researchCompany function signature in lib/services/perplexity.ts to accept ResearchCompanyOptions including searchDomainFilter, includeDomainFallback, temperature, maxTokens, timeout
- [ ] T023 [US1] Implement search_domain_filter parameter support in researchCompany function in lib/services/perplexity.ts
- [ ] T024 [US1] Implement domain filter fallback logic in researchCompany function in lib/services/perplexity.ts to retry without filter if initial results insufficient
- [ ] T025 [US1] Add comprehensive logging in researchCompany function in lib/services/perplexity.ts for API call parameters, response metadata, duration, errors
- [ ] T026 [US1] Update researchCompany return type in lib/services/perplexity.ts to include sources: ResearchSource[] and metadata: ResearchMetadata fields
- [ ] T027 [US1] Update temperature range to 0.1-0.3 (default 0.2) in researchCompany function in lib/services/perplexity.ts
- [ ] T028 [US1] Update max_tokens to 4000 for company research in researchCompany function in lib/services/perplexity.ts
- [ ] T029 [US1] Implement rate limit error handling with exponential backoff in researchCompany function in lib/services/perplexity.ts using withRetry utility
- [ ] T030 [US1] Add 60-second timeout control using withTimeout utility in researchCompany function in lib/services/perplexity.ts

**Checkpoint**: User Story 1 complete - company research uses sonar-pro with domain filtering and returns web-sourced results with citations

---

## Phase 4: User Story 2 - Enhanced Prospect Research with Website Priority (Priority: P1) 🎯 MVP

**Goal**: Add optional website field to ad-hoc form with URL validation, prioritize explicit website URLs over email domains for research

**Independent Test**: Submit ad-hoc form with only prospect name and company website URL (no email), verify detailed company research is generated using provided website as primary source

### Tests for User Story 2 ⚠️

- [ ] T031 [P] [US2] Create test file __tests__/unit/components/adhoc/AdHocForm.test.tsx to test website field validation
- [ ] T032 [P] [US2] Add test in __tests__/unit/components/adhoc/AdHocForm.test.tsx for form submission with website only
- [ ] T033 [P] [US2] Add test in __tests__/unit/components/adhoc/AdHocForm.test.tsx for URL format normalization (http/https/bare domain)
- [ ] T034 [P] [US2] Add test in __tests__/integration/api/adhoc.test.ts to test POST /api/adhoc with website field
- [ ] T035 [P] [US2] Add test in __tests__/integration/api/adhoc.test.ts for website-only submission success
- [ ] T036 [P] [US2] Add test in __tests__/integration/api/adhoc.test.ts for invalid website URL rejection

### Implementation for User Story 2

- [ ] T037 [P] [US2] Add website input field to AdHocForm component in components/adhoc/AdHocForm.tsx with proper label, placeholder, and accessibility attributes
- [ ] T038 [US2] Add URL validation logic in AdHocForm component in components/adhoc/AdHocForm.tsx using Zod schema
- [ ] T039 [US2] Update form validation in AdHocForm component in components/adhoc/AdHocForm.tsx to accept submissions with only website field populated
- [ ] T040 [US2] Add helper text to website field in components/adhoc/AdHocForm.tsx explaining "Prioritized over email domain when both are provided"
- [ ] T041 [US2] Update Zod schema in app/api/adhoc/route.ts to add website: z.string().url().trim().optional()
- [ ] T042 [US2] Update cross-field validation in app/api/adhoc/route.ts to require at least one of prospectName, companyName, email, or website
- [ ] T043 [US2] Update request handler in app/api/adhoc/route.ts to pass website field to Inngest event
- [ ] T044 [US2] Update generate-adhoc-research.ts in lib/inngest/functions/ to extract website from event data and pass to ProspectInput
- [ ] T045 [US2] Update orchestrateResearch function in lib/services/research.ts to accept website parameter in ProspectInput and prioritize over companyDomain
- [ ] T046 [US2] Add test in __tests__/unit/services/research.test.ts to verify website prioritization over email domain

**Checkpoint**: User Story 2 complete - ad-hoc form accepts website field with validation, research prioritizes explicit websites

---

## Phase 5: User Story 3 - Deep Multi-Source Prospect Research (Priority: P2)

**Goal**: Implement multi-pass research strategy with 3 focused passes: company website focus, company news/context, prospect background

**Independent Test**: Submit ad-hoc request with prospect name and company website, verify research brief contains prospect-specific information from at least 2-3 different web sources

### Tests for User Story 3 ⚠️

- [ ] T047 [P] [US3] Add contract test in __tests__/contract/perplexity.contract.test.ts to test MultiPassResearchResult structure
- [ ] T048 [P] [US3] Add contract test in __tests__/contract/perplexity.contract.test.ts to test ProspectResearchData structure includes sources and metadata
- [ ] T049 [P] [US3] Add test in __tests__/unit/services/perplexity.test.ts to verify performMultiPassResearch executes 3 passes sequentially
- [ ] T050 [P] [US3] Add test in __tests__/unit/services/research.test.ts to test multi-pass research orchestration
- [ ] T051 [P] [US3] Add test in __tests__/unit/services/research.test.ts to test partial result handling when passes fail

### Implementation for User Story 3

- [ ] T052 [US3] Update researchProspect function in lib/services/perplexity.ts to use sonar-pro model, add system message, update return type to include sources and metadata
- [ ] T053 [US3] Update researchProspect function in lib/services/perplexity.ts to accept ResearchProspectOptions with temperature, maxTokens, timeout
- [ ] T054 [US3] Create performMultiPassResearch function in lib/services/perplexity.ts with signature accepting MultiPassResearchInput and MultiPassResearchOptions
- [ ] T055 [US3] Implement Pass 1 (Company Website Focus) in performMultiPassResearch in lib/services/perplexity.ts with search_domain_filter using explicit website or email domain
- [ ] T056 [US3] Implement Pass 2 (Company News & Context) in performMultiPassResearch in lib/services/perplexity.ts without domain filter for broader news search
- [ ] T057 [US3] Implement Pass 3 (Prospect Background) in performMultiPassResearch in lib/services/perplexity.ts searching LinkedIn, company pages, and professional sources
- [ ] T058 [US3] Add 60-second timeout per pass in performMultiPassResearch in lib/services/perplexity.ts using withTimeout utility
- [ ] T059 [US3] Add 180-second total timeout in performMultiPassResearch in lib/services/perplexity.ts using withTimeout utility
- [ ] T060 [US3] Implement graceful degradation in performMultiPassResearch in lib/services/perplexity.ts to complete available passes even if one fails
- [ ] T061 [US3] Return isPartialData flag in performMultiPassResearch in lib/services/perplexity.ts when any pass fails
- [ ] T062 [US3] Update orchestrateResearch function in lib/services/research.ts to integrate performMultiPassResearch and replace single Perplexity call
- [ ] T063 [US3] Update error handling in orchestrateResearch in lib/services/research.ts to handle partial results and mark research brief with confidenceRating: LOW
- [ ] T064 [US3] Add comprehensive operation logging in orchestrateResearch in lib/services/research.ts for start/end timestamps, fallback occurrences, partial result conditions

**Checkpoint**: User Story 3 complete - multi-pass research strategy implemented with graceful degradation and comprehensive logging

---

## Phase 6: User Story 4 - Webhook Integration Research Quality (Priority: P2)

**Goal**: Apply same high-quality Perplexity configuration (sonar-pro, multi-pass, domain filtering) to webhook-triggered research for consistency

**Independent Test**: Create calendar event with attendee email addresses, wait for webhook trigger, verify research brief contains web-sourced information of same quality as ad-hoc research

### Tests for User Story 4 ⚠️

- [ ] T065 [P] [US4] Add test in __tests__/unit/services/research.test.ts to verify webhook-triggered research uses same configuration as ad-hoc
- [ ] T066 [P] [US4] Add test in __tests__/unit/services/research.test.ts to verify domain extraction from email works correctly in webhook flow

### Implementation for User Story 4

- [ ] T067 [P] [US4] Update generate-research.ts in lib/inngest/functions/ to apply new Perplexity configuration (sonar-pro, multi-pass)
- [ ] T068 [P] [US4] Update generate-research.ts in lib/inngest/functions/ to handle multi-pass research results and log operation details
- [ ] T069 [US4] Add rate limit error handling in generate-research.ts in lib/inngest/functions/ to complete available passes and mark brief as partial
- [ ] T070 [US4] Add 5-minute hard timeout in generate-research.ts in lib/inngest/functions/ using Inngest step timeout configuration
- [ ] T071 [US4] Verify webhook path uses same domain extraction logic as ad-hoc path in lib/services/research.ts

**Checkpoint**: User Story 4 complete - webhook-triggered research produces same quality results as ad-hoc research

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Testing, documentation, validation, and deployment preparation

- [ ] T072 [P] Add timeout error handling test in __tests__/unit/services/perplexity.test.ts
- [ ] T073 [P] Create end-to-end test in e2e/ to submit ad-hoc request with website and verify research brief generation
- [ ] T074 [P] Update E2E tests in e2e/ to test ad-hoc form submission with website field
- [ ] T075 [P] Verify all unit tests pass using npm test
- [ ] T076 [P] Verify all E2E tests pass using npm run test:e2e
- [ ] T077 [P] Run type checking using npm run type-check
- [ ] T078 [P] Run linting using npm run lint
- [ ] T079 Build project using npm run build to verify production build succeeds
- [ ] T080 [P] Verify environment variable PERPLEXITY_API_KEY is set correctly
- [ ] T081 [P] Update API documentation to document website field in API reference
- [ ] T082 [P] Update user-facing documentation to add website field to user guide and explain prioritization logic
- [ ] T083 Validate success criteria from spec.md: spot-check 10 briefs for website content (SC-001)
- [ ] T084 Validate success criteria from spec.md: compare 5 briefs before/after upgrade (SC-002)
- [ ] T085 Validate success criteria from spec.md: test website-only submissions (SC-003)
- [ ] T086 Validate success criteria from spec.md: verify 90% success rate (SC-004)
- [ ] T087 Validate success criteria from spec.md: verify 2-3+ sources per brief (SC-005)
- [ ] T088 Validate success criteria from spec.md: compare webhook vs ad-hoc quality (SC-006)
- [ ] T089 Validate success criteria from spec.md: test invalid website handling (SC-007)
- [ ] T090 Validate success criteria from spec.md: verify research execution time under 3-5min max (SC-008)
- [ ] T091 Run quickstart.md validation for all phases
- [ ] T092 Create pull request with reference to feature spec and plan, include testing evidence

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P2)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Integrates with US1 but independently testable (requires US1's upgraded researchCompany function)
- **User Story 3 (P2)**: Can start after US1 and US2 complete - Depends on upgraded researchCompany and researchProspect functions
- **User Story 4 (P2)**: Can start after US1, US2, US3 complete - Applies all previous enhancements to webhook pathway

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Utility functions (URL validation, retry logic, timeouts) before service functions
- Service function upgrades before orchestration changes
- API/form changes before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T004, T005)
- All Foundational tasks marked [P] can run in parallel (T006-T013)
- Once Foundational phase completes:
  - US1 and US2 can start in parallel (different files, US2 will need US1's researchCompany changes but can have tests written first)
- All tests for a user story marked [P] can run in parallel
- All implementation tasks within a story marked [P] can run in parallel
- Polish phase tasks marked [P] can run in parallel (T072-T082)

---

## Parallel Example: User Story 1

```bash
# Write all tests for User Story 1 together (ensure they FAIL):
Task T016: Contract test for CompanyResearchData structure
Task T017: Test sonar-pro model usage
Task T018: Test search_domain_filter parameter
Task T019: Test domain filter fallback

# Then implement US1 (some tasks can run in parallel):
Task T020-T021: Update researchCompany function model and system message
Task T022-T024: Add search_domain_filter support
# Sequential from here due to dependencies
```

---

## Parallel Example: User Story 2

```bash
# Write all tests for User Story 2 together:
Task T031: Website field validation test
Task T032: Website-only submission test
Task T033: URL format normalization test
Task T034: API endpoint with website test
Task T035: Website-only API success test
Task T036: Invalid URL rejection test

# Then implement US2 (many tasks can run in parallel):
Task T037: Add website input field to form
Task T038: Add URL validation logic
Task T039: Update form validation
Task T040: Add helper text
Task T041: Update Zod schema in API
# Sequential from here as tasks depend on each other
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup (database schema)
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (sonar-pro upgrade)
4. Complete Phase 4: User Story 2 (website field)
5. **STOP and VALIDATE**: Test US1 and US2 independently
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → High-quality company research available
3. Add User Story 2 → Test independently → Website field added, research prioritization improved
4. **Deploy MVP** (US1 + US2)
5. Add User Story 3 → Test independently → Multi-pass research with deep insights
6. Add User Story 4 → Test independently → Webhook consistency achieved
7. Polish & Deploy final version

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (T016-T030)
   - Developer B: User Story 2 tests first (T031-T036), then implementation after US1 completes (T037-T046)
3. After US1 & US2:
   - Developer A: User Story 3 (T047-T064)
   - Developer B: User Story 4 (T065-T071)
4. Team: Polish phase together (T072-T092)

---

## Task Count Summary

- **Total Tasks**: 92
- **Phase 1 (Setup)**: 5 tasks
- **Phase 2 (Foundational)**: 10 tasks
- **Phase 3 (User Story 1 - P1)**: 15 tasks (4 tests + 11 implementation)
- **Phase 4 (User Story 2 - P1)**: 16 tasks (6 tests + 10 implementation)
- **Phase 5 (User Story 3 - P2)**: 18 tasks (5 tests + 13 implementation)
- **Phase 6 (User Story 4 - P2)**: 7 tasks (2 tests + 5 implementation)
- **Phase 7 (Polish)**: 21 tasks

### Parallel Opportunities Identified

- Phase 1: 2 parallel tasks (T004, T005)
- Phase 2: 8 parallel tasks (T006-T013)
- Phase 3 (US1): 4 parallel tests (T016-T019)
- Phase 4 (US2): 6 parallel tests (T031-T036), 2 parallel implementation tasks (T037, T041)
- Phase 5 (US3): 5 parallel tests (T047-T051)
- Phase 6 (US4): 3 parallel tasks (T065-T067)
- Phase 7: 11 parallel tasks (T072-T082)

**Total parallel opportunities**: ~41 tasks can run concurrently with proper coordination

---

## Suggested MVP Scope

**Minimum Viable Product**: User Stories 1 & 2 (Phases 1-4)

This delivers:
- ✅ Upgraded sonar-pro model with web browsing
- ✅ Domain filtering for focused company research
- ✅ Website field in ad-hoc form
- ✅ Website prioritization over email domains
- ✅ Comprehensive logging and error handling
- ✅ All core functional requirements

**Value**: Sales reps can provide website URLs for significantly improved research quality compared to current implementation.

**Later Additions**:
- User Story 3: Multi-pass research for even deeper insights
- User Story 4: Webhook consistency (applies MVP improvements to automated path)

---

## Notes

- [P] tasks = different files, no dependencies within phase
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD approach per quickstart.md)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All file paths are absolute from repository root
- Tests mirror source structure in __tests__/ directory
