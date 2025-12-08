# Implementation Plan: Pre-Call Intelligence Dashboard

**Branch**: `001-meeting-prep` | **Date**: 2025-12-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-meeting-prep/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

A public website that automatically generates detailed research briefs for upcoming sales meetings with external attendees. When a sales professional schedules a meeting on Google Calendar, the system detects it via webhooks, researches the prospect and company using Perplexity API and Claude, and presents a structured one-page brief. The system includes campaign management, calendar integration, automated background jobs for research generation, and PDF export capabilities.

**Technical Approach**: Next.js 15+ full-stack application with Tailwind 4+ for styling, Neon Postgres with Drizzle ORM for data persistence, NextAuth for Google OAuth authentication/calendar access, Perplexity API for research data gathering, Claude API for brief synthesis, Inngest for background job orchestration, deployed on Vercel with webhook handling for real-time calendar event processing.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 15.x (App Router), Node.js 20+
**Primary Dependencies**:
  - Next.js 15+ (full-stack framework with App Router)
  - Tailwind CSS 4+ (styling)
  - Drizzle ORM (database access layer)
  - NextAuth v5 (authentication & Google OAuth)
  - Inngest (background job orchestration)
  - Anthropic SDK (Claude API client)
  - Perplexity API client (research data gathering)
  - React PDF or similar (PDF generation)

**Storage**: Neon Postgres (serverless PostgreSQL compatible with Vercel)
**Testing**: Vitest (unit/integration), Playwright (E2E), contract testing for API endpoints
**Target Platform**: Vercel (serverless Next.js deployment), browser clients (modern evergreen browsers)
**Project Type**: Web application (full-stack Next.js with API routes + React frontend)
**Performance Goals**:
  - API endpoints <200ms p95 response time
  - Dashboard load <3s on 3G networks
  - Webhook processing <30s from event to dashboard update
  - Research completion within 2-5 minutes
  - PDF generation <3s

**Constraints**:
  - Client bundle <300KB gzipped initial load
  - Vercel serverless function timeout (10s for Hobby, 60s for Pro - requires background jobs for research)
  - Google Calendar API rate limits
  - Perplexity API rate limits
  - Claude API rate limits
  - Real-time webhook delivery reliability

**Scale/Scope**:
  - Initial: Single user, ~10-20 meetings per week
  - Target: 100 users, ~2000 meetings per week
  - 5-10 calendar views/components
  - 15-20 database tables
  - 10-15 API routes
  - 3-5 background job types

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Code Quality (NON-NEGOTIABLE)
- ✅ **Self-Documenting Code**: TypeScript provides strong typing; will use descriptive variable/function names
- ✅ **Single Responsibility**: Component-based architecture (React) naturally encourages single responsibility
- ✅ **DRY Principle**: Will extract reusable components (calendar views, status badges, brief sections)
- ✅ **Type Safety**: Full TypeScript with strict mode enabled; Drizzle ORM provides type-safe DB queries
- ✅ **Error Handling**: Will implement error boundaries (React), API error handlers, webhook retry logic
- ✅ **No Magic Values**: API keys in env vars, constants for status values, time thresholds, rate limits

### II. Testing Standards (NON-NEGOTIABLE)
- ✅ **Test-First Development**: Will write tests for critical paths (webhook processing, research orchestration, brief generation)
- ⚠️ **Test Coverage Minimums**: Target 80%+ for business logic; may need to clarify coverage tooling for Next.js 15
- ✅ **Contract Testing**: API routes and Google Calendar webhook contracts will have explicit tests
- ✅ **Test Quality**: Vitest provides fast, isolated unit tests; Playwright for deterministic E2E tests
- ✅ **Test Organization**: Standard Next.js structure: `__tests__/unit/`, `__tests__/integration/`, `e2e/`

### III. User Experience Consistency (NON-NEGOTIABLE)
- ✅ **Design System Adherence**: Tailwind 4+ provides consistent utility classes; will create component library
- ✅ **Accessibility Standards**: Will implement WCAG 2.1 AA (keyboard nav, ARIA labels, color contrast)
- ✅ **Error Messages**: User-facing errors will be actionable (e.g., "Research failed - retry manually")
- ✅ **Loading States**: Webhook processing (30s), research generation (2-5min) require clear loading/progress indicators
- ✅ **Responsive Design**: Mobile-first Tailwind breakpoints (sm/md/lg/xl) for dashboard, briefs, campaign setup
- ✅ **Internationalization Ready**: Initial English-only but will externalize strings for future i18n

### IV. Performance Requirements (NON-NEGOTIABLE)
- ✅ **Response Time Targets**: API routes <200ms; Next.js SSR/ISR for fast page loads; background jobs for long-running tasks
- ✅ **Resource Constraints**: Tailwind + code splitting keeps bundle <300KB; Postgres indexed queries
- ⚠️ **Scalability Baselines**: Inngest handles 10x load; may need to clarify database connection pooling for Neon Postgres
- ✅ **Monitoring & Budgets**: Vercel Analytics for performance monitoring; will add custom metrics for research pipeline

### V. Simplicity & Maintainability
- ✅ **YAGNI Principle**: Building only P1/P2 features from spec; no speculative abstractions
- ✅ **Minimal Dependencies**: Using established Next.js ecosystem; avoiding unnecessary packages
- ✅ **Technology Choices**: All chosen technologies are mature (Next.js, Tailwind, Postgres, Drizzle, NextAuth)
- ✅ **Refactoring Discipline**: Component extraction, service layer for API calls, clear separation of concerns
- ✅ **Configuration**: Sensible defaults (weekly calendar view, 7-day research cache, 3 retries)

**Pre-Research Assessment**: ✅ PASS (2 warnings requiring clarification in Phase 0 research)

**Warnings to Resolve**:
1. Test coverage tooling for Next.js 15 App Router (need to research Vitest configuration)
2. Database connection pooling strategy for Neon Postgres on Vercel serverless (need to research best practices)

---

**Post-Design Re-Evaluation**: ✅ PASS (all warnings resolved)

**Warning Resolutions**:
1. ✅ **Test Coverage Tooling**: Vitest configured with 80%+ coverage thresholds; Playwright used for E2E tests including Server Components that Vitest cannot test. Full configuration documented in research.md.
2. ✅ **Database Connection Pooling**: Use Neon's `-pooler` connection strings with TCP pooling (node-postgres) for Vercel Node.js runtime. For Edge Functions, use `@neondatabase/serverless` HTTP driver. Connection pooling strategy fully documented in research.md.

**Design Validation**:
- ✅ Data model follows normalization principles with proper foreign keys and indexes
- ✅ API contracts define clear request/response schemas with validation
- ✅ Inngest functions use step-based pattern for reliability and retry isolation
- ✅ Component structure separates concerns (UI primitives, domain components, layout)
- ✅ Service layer abstracts external API calls for testability
- ✅ Database queries use Drizzle ORM for type safety
- ✅ Authentication handled by NextAuth v5 with Google OAuth
- ✅ All long-running operations (>10s) delegated to Inngest background jobs
- ✅ Error handling patterns defined for API routes and background jobs
- ✅ Rate limiting strategies documented for Perplexity, Claude, and Google APIs
- ✅ Webhook subscription renewal handled via cron job
- ✅ Research caching (7 days for meetings, 24 hours for companies) reduces API costs

**Final Assessment**: The design meets all constitutional requirements with no violations. All technical unknowns have been researched and resolved. Implementation can proceed to Phase 2 (task generation).

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
# Next.js 15 App Router full-stack application
app/
├── (auth)/                    # Auth route group
│   ├── login/                 # Login page
│   └── callback/              # OAuth callback
├── (dashboard)/               # Protected route group
│   ├── page.tsx               # Main dashboard (calendar views)
│   ├── meetings/
│   │   └── [id]/
│   │       └── page.tsx       # Meeting brief detail view
│   ├── ad-hoc/
│   │   ├── page.tsx           # Ad-hoc research list
│   │   ├── new/               # Ad-hoc research form
│   │   └── [id]/page.tsx      # Ad-hoc brief view
│   └── settings/
│       ├── page.tsx           # Campaign list
│       ├── new/               # Campaign setup flow
│       └── [id]/edit/         # Edit campaign
├── api/
│   ├── auth/[...nextauth]/    # NextAuth routes
│   ├── webhooks/
│   │   └── google-calendar/   # Google Calendar webhook endpoint
│   ├── campaigns/             # Campaign CRUD
│   ├── meetings/              # Meeting endpoints
│   ├── research/              # Research endpoints (trigger, status, PDF)
│   └── inngest/               # Inngest background job endpoint
└── layout.tsx                 # Root layout

components/
├── ui/                        # Base UI components (buttons, cards, badges)
├── calendar/                  # Calendar view components
│   ├── DailyView.tsx
│   ├── WeeklyView.tsx
│   ├── MonthlyView.tsx
│   ├── MeetingCard.tsx
│   └── ViewToggle.tsx
├── brief/                     # Research brief components
│   ├── BriefHeader.tsx
│   ├── QuickFacts.tsx
│   ├── DeepDive.tsx
│   ├── CallStrategy.tsx
│   └── BriefFooter.tsx
├── campaign/                  # Campaign setup components
│   ├── SetupWizard.tsx
│   ├── CalendarSelector.tsx
│   ├── CompanyForm.tsx
│   └── OfferingForm.tsx
└── layout/                    # Layout components (navbar, sidebar)

lib/
├── db/                        # Database layer
│   ├── schema.ts              # Drizzle schema definitions
│   ├── client.ts              # Neon Postgres client
│   └── queries/               # Typed query functions
│       ├── campaigns.ts
│       ├── meetings.ts
│       └── briefs.ts
├── services/                  # Business logic services
│   ├── google-calendar.ts     # Google Calendar API client
│   ├── perplexity.ts          # Perplexity API client
│   ├── claude.ts              # Claude API client
│   ├── research.ts            # Research orchestration
│   └── pdf.ts                 # PDF generation
├── inngest/                   # Inngest functions
│   ├── client.ts              # Inngest client
│   └── functions/
│       ├── process-webhook.ts
│       ├── generate-research.ts
│       └── send-notifications.ts
├── auth/                      # NextAuth configuration
│   └── config.ts
└── utils/                     # Shared utilities
    ├── timezone.ts
    ├── email.ts
    └── constants.ts

__tests__/
├── unit/
│   ├── services/              # Service layer tests
│   ├── utils/                 # Utility function tests
│   └── components/            # Component tests
├── integration/
│   ├── api/                   # API route tests
│   └── db/                    # Database query tests
└── contract/
    ├── google-calendar.test.ts
    └── api-routes.test.ts

e2e/
├── auth.spec.ts
├── campaign-setup.spec.ts
├── dashboard.spec.ts
└── research-flow.spec.ts

public/
└── static assets

drizzle/
└── migrations/                # Database migrations
```

**Structure Decision**: Using Next.js 15 App Router monolithic structure (Option 2: Web application) with API routes and React frontend colocated. This approach leverages Next.js full-stack capabilities, eliminates the need for separate backend/frontend deployments, and simplifies development with shared TypeScript types. The App Router provides server components, API routes, and middleware in a single codebase optimized for Vercel deployment.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
