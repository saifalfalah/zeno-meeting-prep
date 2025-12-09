# Tasks: Pre-Call Intelligence Dashboard

**Input**: Design documents from `/specs/001-meeting-prep/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md, this is a Next.js 15 App Router application with paths at repository root.

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Create project structure, install dependencies, configure tooling

- [X] T001 Initialize Next.js 15 project with TypeScript, App Router, and Tailwind CSS 4
- [X] T002 [P] Configure ESLint and Prettier with project-specific rules
- [X] T003 [P] Configure Vitest for unit testing in vitest.config.mts
- [X] T004 [P] Configure Playwright for E2E testing in playwright.config.ts
- [X] T005 [P] Create environment variables template in .env.example
- [X] T006 Setup PostCSS config for Tailwind 4 in postcss.config.mjs
- [X] T007 Create base project structure with app/, components/, lib/ directories

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**Critical**: No user story work can begin until this phase is complete

### Database & ORM Setup

- [X] T008 Install Drizzle ORM and configure Neon Postgres client in lib/db/client.ts
- [X] T009 Define database schema for all entities in lib/db/schema.ts (users, campaigns, webhookSubscriptions, meetings, prospects, companies, researchBriefs, prospectInfo, researchSources, adHocResearchRequests, meetingProspects)
- [X] T010 Configure Drizzle relations for type-safe queries in lib/db/schema.ts
- [X] T011 Create database migration scripts with drizzle-kit
- [X] T012 [P] Create db query helpers for campaigns in lib/db/queries/campaigns.ts
- [X] T013 [P] Create db query helpers for meetings in lib/db/queries/meetings.ts
- [X] T014 [P] Create db query helpers for briefs in lib/db/queries/briefs.ts
- [X] T015 [P] Create db query helpers for prospects in lib/db/queries/prospects.ts
- [X] T016 [P] Create db query helpers for companies in lib/db/queries/companies.ts
- [X] T017 [P] Create db query helpers for ad-hoc requests in lib/db/queries/adhoc.ts

### Authentication Setup

- [X] T018 Install NextAuth v5 and configure Google OAuth provider in lib/auth/config.ts
- [X] T019 Define NextAuth TypeScript types in types/next-auth.d.ts
- [X] T020 Implement JWT callback with token refresh logic in lib/auth/config.ts
- [X] T021 Create NextAuth API route handlers in app/api/auth/[...nextauth]/route.ts
- [X] T022 Create auth middleware for protected routes in middleware.ts

### Background Jobs Setup

- [X] T023 Install Inngest and create client in lib/inngest/client.ts
- [X] T024 Create Inngest API route in app/api/inngest/route.ts
- [X] T025 Define Inngest event types in lib/inngest/events.ts

### UI Foundation

- [X] T026 [P] Create base UI components (Button, Card, Badge, Input) in components/ui/
- [X] T027 [P] Create layout components (Navbar, Sidebar) in components/layout/
- [X] T028 Configure Tailwind theme with custom colors in app/globals.css using @theme directive
- [X] T029 Create root layout with providers in app/layout.tsx
- [X] T030 Create loading and error boundary components

### Utility Functions

- [X] T031 [P] Create timezone utilities in lib/utils/timezone.ts
- [X] T032 [P] Create email utilities for domain extraction in lib/utils/email.ts
- [X] T033 [P] Create constants file for status values and thresholds in lib/utils/constants.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - View Upcoming Meetings with Research Status (Priority: P1)

**Goal**: Display all upcoming meetings with external attendees in calendar format with research status badges

**Independent Test**: Connect a calendar with sample meetings and verify the dashboard displays them in daily, weekly, and monthly views with accurate status indicators

### Implementation for User Story 1

- [X] T034 [P] [US1] Create MeetingCard component in components/calendar/MeetingCard.tsx
- [X] T035 [P] [US1] Create StatusBadge component for research status in components/ui/StatusBadge.tsx
- [X] T036 [P] [US1] Create ViewToggle component for view switching in components/calendar/ViewToggle.tsx
- [X] T037 [US1] Create DailyView component in components/calendar/DailyView.tsx
- [X] T038 [US1] Create WeeklyView component in components/calendar/WeeklyView.tsx
- [X] T039 [US1] Create MonthlyView component in components/calendar/MonthlyView.tsx
- [X] T040 [US1] Create CalendarNavigation component (prev/next/today) in components/calendar/CalendarNavigation.tsx
- [X] T041 [US1] Create CampaignFilter dropdown component in components/calendar/CampaignFilter.tsx
- [X] T042 [US1] Implement GET /api/meetings endpoint in app/api/meetings/route.ts
- [X] T043 [US1] Create main dashboard page with calendar views in app/(dashboard)/page.tsx
- [X] T044 [US1] Add keyboard shortcuts for view switching (D, W, M keys) in dashboard client component
- [X] T045 [US1] Implement timezone detection and display conversion in dashboard
- [X] T046 [US1] Add relative time indicators ("in X hours") to meeting cards
- [X] T047 [US1] Handle empty state when no meetings are scheduled

**Checkpoint**: User Story 1 complete - dashboard shows meetings with research status

---

## Phase 4: User Story 2 - Access Structured Research Briefs (Priority: P1)

**Goal**: View consistently-formatted research briefs with header, quick facts, deep dive, call strategy, and sources

**Independent Test**: Trigger research for a known company/prospect and verify the brief follows the template structure with all required sections

### Implementation for User Story 2

- [X] T048 [P] [US2] Create BriefHeader component (prospect/company/meeting columns) in components/brief/BriefHeader.tsx
- [X] T049 [P] [US2] Create QuickFacts component (3 boxes) in components/brief/QuickFacts.tsx
- [X] T050 [P] [US2] Create DeepDive component in components/brief/DeepDive.tsx
- [X] T051 [P] [US2] Create CallStrategy component (4 boxes) in components/brief/CallStrategy.tsx
- [X] T052 [P] [US2] Create BriefFooter component (confidence, sources) in components/brief/BriefFooter.tsx
- [X] T053 [US2] Create ResearchBriefPage layout in components/brief/ResearchBriefPage.tsx
- [X] T054 [US2] Implement GET /api/research/briefs/[id] endpoint in app/api/research/briefs/[id]/route.ts
- [X] T055 [US2] Create meeting detail page with brief display in app/(dashboard)/meetings/[id]/page.tsx
- [X] T056 [US2] Handle missing data with "Unknown" placeholders in brief components
- [X] T057 [US2] Display confidence rating with explanation in footer
- [X] T058 [US2] Display sources with clickable URLs in footer
- [X] T059 [US2] Ensure mobile-responsive layout for quick scanning

**Checkpoint**: User Story 2 complete - research briefs display with consistent template structure

---

## Phase 5: User Story 3 - Set Up Campaign with Calendar Integration (Priority: P1)

**Goal**: Guide users through 4-step campaign setup to connect Google Calendar and configure offering

**Independent Test**: Walk through the setup flow and verify webhook subscription is created and campaign appears as active

### Implementation for User Story 3

- [X] T060 [P] [US3] Create SetupWizard container component in components/campaign/SetupWizard.tsx
- [X] T061 [P] [US3] Create CalendarSelector component (Step 1) in components/campaign/CalendarSelector.tsx
- [X] T062 [P] [US3] Create CompanyForm component (Step 2) in components/campaign/CompanyForm.tsx
- [X] T063 [P] [US3] Create OfferingForm component (Step 3) in components/campaign/OfferingForm.tsx
- [X] T064 [P] [US3] Create ReviewActivate component (Step 4) in components/campaign/ReviewActivate.tsx
- [X] T065 [US3] Create Google Calendar service for fetching calendars in lib/services/google-calendar.ts
- [X] T066 [US3] Create Google Calendar webhook subscription logic in lib/services/google-calendar.ts
- [X] T067 [US3] Implement POST /api/campaigns endpoint in app/api/campaigns/route.ts
- [X] T068 [US3] Implement GET /api/campaigns endpoint in app/api/campaigns/route.ts
- [X] T069 [US3] Implement GET /api/campaigns/[id] endpoint in app/api/campaigns/[id]/route.ts
- [X] T070 [US3] Implement PATCH /api/campaigns/[id] endpoint in app/api/campaigns/[id]/route.ts
- [X] T071 [US3] Implement DELETE /api/campaigns/[id] endpoint in app/api/campaigns/[id]/route.ts
- [X] T072 [US3] Create new campaign page with wizard in app/(dashboard)/settings/new/page.tsx
- [X] T073 [US3] Create campaign settings list page in app/(dashboard)/settings/page.tsx
- [X] T074 [US3] Create campaign edit page in app/(dashboard)/settings/[id]/edit/page.tsx
- [X] T075 [US3] Add webhook verification step before marking campaign active
- [X] T076 [US3] Create login page with Google OAuth in app/(auth)/login/page.tsx

**Checkpoint**: User Story 3 complete - users can set up campaigns and connect calendars

---

## Phase 6: User Story 4 - Automatic Research Triggering and PDF Export (Priority: P2)

**Goal**: Automatically trigger research when calendar events with external attendees are created, and enable PDF export

**Independent Test**: Create a calendar event with external email and verify webhook triggers research within 30 seconds, brief completes in 2-5 minutes, and PDF downloads correctly

### Implementation for User Story 4

- [ ] T077 [P] [US4] Create Perplexity API service in lib/services/perplexity.ts
- [ ] T078 [P] [US4] Create Claude API service in lib/services/claude.ts
- [ ] T079 [US4] Create research orchestration service in lib/services/research.ts
- [ ] T080 [US4] Implement process-webhook Inngest function in lib/inngest/functions/process-webhook.ts
- [ ] T081 [US4] Implement generate-research Inngest function in lib/inngest/functions/generate-research.ts
- [ ] T082 [US4] Implement POST /api/webhooks/google-calendar endpoint in app/api/webhooks/google-calendar/route.ts
- [ ] T083 [US4] Implement POST /api/research/trigger endpoint in app/api/research/trigger/route.ts
- [ ] T084 [US4] Create PDF generation service in lib/services/pdf.ts
- [ ] T085 [US4] Implement GET /api/research/briefs/[id]/pdf endpoint in app/api/research/briefs/[id]/pdf/route.ts
- [ ] T086 [US4] Add PDF download button to research brief page
- [ ] T087 [US4] Implement external attendee detection using company domain comparison
- [ ] T088 [US4] Handle meeting reschedule without re-researching
- [ ] T089 [US4] Handle new attendee added to existing meeting (trigger incremental research)
- [ ] T090 [US4] Implement research caching for recurring meetings (7-day cache)

**Checkpoint**: User Story 4 complete - automatic research generation and PDF export working

---

## Phase 7: User Story 5 - Handle Research Errors Transparently (Priority: P2)

**Goal**: Clearly notify users when research fails with specific error messages

**Independent Test**: Simulate various failure scenarios (API timeout, rate limiting, obscure company) and verify clear error messages

### Implementation for User Story 5

- [ ] T091 [P] [US5] Create ErrorDisplay component for failed research in components/brief/ErrorDisplay.tsx
- [ ] T092 [US5] Implement retry logic with exponential backoff in generate-research function
- [ ] T093 [US5] Track which step failed (prospect lookup, company lookup, brief generation) in research service
- [ ] T094 [US5] Store failure reason in Meeting.researchFailureReason
- [ ] T095 [US5] Display error detail page for failed meetings in app/(dashboard)/meetings/[id]/page.tsx
- [ ] T096 [US5] Implement partial brief generation with LOW confidence when data limited
- [ ] T097 [US5] Add manual retry button for failed research
- [ ] T098 [US5] Implement send-research-notification Inngest function (optional email alerts) in lib/inngest/functions/send-notification.ts

**Checkpoint**: User Story 5 complete - research errors displayed transparently with retry option

---

## Phase 8: User Story 6 - Manage Multiple Campaigns (Priority: P3)

**Goal**: Create and manage multiple campaigns with different calendars and offerings

**Independent Test**: Create 2-3 campaigns with different calendars, schedule meetings, verify briefs reflect appropriate campaign context

### Implementation for User Story 6

- [ ] T099 [US6] Update dashboard to support multi-campaign filtering
- [ ] T100 [US6] Add campaign selector to dashboard header
- [ ] T101 [US6] Display campaign badge on meeting cards
- [ ] T102 [US6] Implement campaign pause/resume functionality in PATCH /api/campaigns/[id]
- [ ] T103 [US6] Stop webhook monitoring when campaign paused
- [ ] T104 [US6] Resume webhook monitoring when campaign resumed
- [ ] T105 [US6] Preserve historical research when campaign deleted
- [ ] T106 [US6] Add confirmation dialog for campaign deletion
- [ ] T107 [US6] Implement renew-webhook-subscriptions Inngest cron function in lib/inngest/functions/renew-webhooks.ts

**Checkpoint**: User Story 6 complete - multiple campaigns can be managed independently

---

## Phase 9: User Story 7 - Ad-Hoc Research Without Calendar Events (Priority: P2)

**Goal**: Manually trigger research for any prospect without calendar event

**Independent Test**: Access ad-hoc interface, provide partial information, verify brief generates and PDF downloads

### Implementation for User Story 7

- [ ] T108 [P] [US7] Create AdHocForm component in components/adhoc/AdHocForm.tsx
- [ ] T109 [P] [US7] Create AdHocList component in components/adhoc/AdHocList.tsx
- [ ] T110 [US7] Implement POST /api/adhoc endpoint in app/api/adhoc/route.ts
- [ ] T111 [US7] Implement GET /api/adhoc endpoint in app/api/adhoc/route.ts
- [ ] T112 [US7] Implement GET /api/adhoc/[id] endpoint in app/api/adhoc/[id]/route.ts
- [ ] T113 [US7] Implement DELETE /api/adhoc/[id] endpoint in app/api/adhoc/[id]/route.ts
- [ ] T114 [US7] Create ad-hoc research list page in app/(dashboard)/ad-hoc/page.tsx
- [ ] T115 [US7] Create ad-hoc new research form page in app/(dashboard)/ad-hoc/new/page.tsx
- [ ] T116 [US7] Create ad-hoc brief view page in app/(dashboard)/ad-hoc/[id]/page.tsx
- [ ] T117 [US7] Extend generate-research function to handle ad-hoc requests
- [ ] T118 [US7] Handle partial information (company only, email only, name only)
- [ ] T119 [US7] Infer company from email domain when only email provided
- [ ] T120 [US7] Add delete functionality for ad-hoc briefs (calendar briefs cannot be deleted)

**Checkpoint**: User Story 7 complete - ad-hoc research working with partial inputs

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements affecting multiple user stories

- [ ] T121 [P] Add loading skeletons for all data-fetching components
- [ ] T122 [P] Implement optimistic UI updates for status changes
- [ ] T123 Add accessibility (ARIA labels, keyboard navigation, color contrast)
- [ ] T124 [P] Add analytics tracking for key user actions
- [ ] T125 Performance optimization: Code splitting for route groups
- [ ] T126 Performance optimization: Database query indexing verification
- [ ] T127 Security review: Input validation on all API routes using Zod
- [ ] T128 Security review: CSRF protection for state-changing operations
- [ ] T129 Create database seed script for development in lib/db/seed.ts
- [ ] T130 Run quickstart.md validation - verify all setup steps work

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Stories (Phase 3-9)**: All depend on Foundational phase
  - US1 (View Meetings): Can start after Foundational
  - US2 (Research Briefs): Can start after Foundational (integrates with US1 for navigation)
  - US3 (Campaign Setup): Can start after Foundational
  - US4 (Auto Research): Depends on US3 (needs campaigns) and US2 (needs brief display)
  - US5 (Error Handling): Depends on US4 (needs research generation)
  - US6 (Multi-Campaign): Depends on US3 (needs campaign foundation)
  - US7 (Ad-Hoc): Depends on US2 (needs brief display) and US4 (needs research service)
- **Polish (Phase 10)**: Depends on all user stories

### User Story Parallel Opportunities

After Foundational phase completes:
- **Can run in parallel**: US1, US2, US3
- **Must wait**: US4 (after US2, US3), US5 (after US4), US6 (after US3), US7 (after US2, US4)

### Within Each Phase

Tasks marked [P] can run in parallel within that phase.

---

## Parallel Execution Examples

### Phase 2: Foundational - Parallel Groups

```bash
# Group 1: Database queries (all [P])
Task T012: Create db query helpers for campaigns
Task T013: Create db query helpers for meetings
Task T014: Create db query helpers for briefs
Task T015: Create db query helpers for prospects
Task T016: Create db query helpers for companies
Task T017: Create db query helpers for ad-hoc requests

# Group 2: UI components (all [P])
Task T026: Create base UI components
Task T027: Create layout components

# Group 3: Utilities (all [P])
Task T031: Create timezone utilities
Task T032: Create email utilities
Task T033: Create constants file
```

### Phase 3: User Story 1 - Parallel Groups

```bash
# Group 1: Independent components (all [P])
Task T034: Create MeetingCard component
Task T035: Create StatusBadge component
Task T036: Create ViewToggle component
```

---

## Implementation Strategy

### MVP First (User Stories 1-3 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1 (View Meetings)
4. Complete Phase 4: User Story 2 (Research Briefs)
5. Complete Phase 5: User Story 3 (Campaign Setup)
6. **STOP and VALIDATE**: Test US1-3 independently, deploy MVP

### Incremental Delivery After MVP

1. Add User Story 4 (Auto Research + PDF) - Core automation
2. Add User Story 5 (Error Handling) - Reliability
3. Add User Story 7 (Ad-Hoc Research) - Flexibility
4. Add User Story 6 (Multi-Campaign) - Power users
5. Complete Phase 10: Polish

---

## Summary

| Phase | Task Count | Parallel Tasks |
|-------|------------|----------------|
| Phase 1: Setup | 7 | 4 |
| Phase 2: Foundational | 26 | 12 |
| Phase 3: US1 - View Meetings | 14 | 3 |
| Phase 4: US2 - Research Briefs | 12 | 5 |
| Phase 5: US3 - Campaign Setup | 17 | 5 |
| Phase 6: US4 - Auto Research | 14 | 2 |
| Phase 7: US5 - Error Handling | 8 | 1 |
| Phase 8: US6 - Multi-Campaign | 9 | 0 |
| Phase 9: US7 - Ad-Hoc Research | 13 | 2 |
| Phase 10: Polish | 10 | 4 |
| **TOTAL** | **130** | **38** |

### Tasks Per User Story

- US1 (View Meetings): 14 tasks
- US2 (Research Briefs): 12 tasks
- US3 (Campaign Setup): 17 tasks
- US4 (Auto Research): 14 tasks
- US5 (Error Handling): 8 tasks
- US6 (Multi-Campaign): 9 tasks
- US7 (Ad-Hoc Research): 13 tasks

### Suggested MVP Scope

**MVP = Setup + Foundational + US1 + US2 + US3** = 76 tasks

This delivers:
- Calendar view with meetings
- Research brief display
- Campaign setup and calendar connection
- Manual research triggering (basic)

---

## Notes

- [P] tasks = different files, no dependencies within that phase
- [Story] label maps task to specific user story
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
