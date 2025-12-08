# Data Model: Pre-Call Intelligence Dashboard

**Feature**: 001-meeting-prep | **Date**: 2025-12-07

## Overview

This document defines the database schema and entity relationships for the Pre-Call Intelligence Dashboard. The data model supports multi-campaign management, Google Calendar integration, automated research generation, and research brief storage.

## Technology

- **Database**: Neon Postgres (serverless PostgreSQL)
- **ORM**: Drizzle ORM with TypeScript type safety
- **Migration Strategy**: Drizzle Kit for schema migrations
- **Connection**: TCP pooling with node-postgres for Node.js runtime

## Entity Relationship Diagram

```text
User (1) ─────< (N) Campaign
                     │
                     │ (1)
                     │
                     ├─< (N) Meeting ───< (1) ResearchBrief
                     │
                     ├─< (N) AdHocResearchRequest ───< (1) ResearchBrief
                     │
                     └─< (1) WebhookSubscription

ResearchBrief (1) ─────< (N) ResearchSource
ResearchBrief (1) ─────< (N) ProspectInfo

Meeting (N) ─────< (N) Prospect (junction: MeetingProspect)
Prospect (N) ─────> (1) Company
```

## Core Entities

### 1. User

Represents an authenticated user (sales professional) using the system.

**Fields**:
- `id` (UUID, PK): Unique user identifier
- `email` (VARCHAR(255), UNIQUE, NOT NULL): User's email from Google OAuth
- `name` (VARCHAR(255), NULL): User's display name from Google
- `googleId` (VARCHAR(255), UNIQUE, NOT NULL): Google account identifier
- `googleAccessToken` (TEXT, NULL): Encrypted Google OAuth access token
- `googleRefreshToken` (TEXT, NULL): Encrypted Google OAuth refresh token
- `googleTokenExpiry` (TIMESTAMP, NULL): When the access token expires
- `createdAt` (TIMESTAMP, NOT NULL): Account creation timestamp
- `updatedAt` (TIMESTAMP, NOT NULL): Last update timestamp

**Validation Rules**:
- Email must be valid format
- Google tokens are encrypted at rest using application-level encryption

**Indexes**:
- Primary key on `id`
- Unique index on `email`
- Unique index on `googleId`

**State Transitions**: N/A (users are created via OAuth and remain active)

---

### 2. Campaign

Represents a sales campaign with specific offering and calendar connection.

**Fields**:
- `id` (UUID, PK): Unique campaign identifier
- `userId` (UUID, FK → User.id, NOT NULL): Owner of the campaign
- `name` (VARCHAR(255), NOT NULL): Campaign display name
- `status` (ENUM['active', 'paused'], NOT NULL, DEFAULT 'active'): Campaign state
- `companyName` (VARCHAR(255), NOT NULL): User's company name
- `companyDomain` (VARCHAR(255), NOT NULL): Company domain for identifying internal emails
- `companyDescription` (TEXT, NULL): 2-3 sentence company description
- `offeringTitle` (VARCHAR(255), NOT NULL): What we're selling (short title)
- `offeringDescription` (TEXT, NOT NULL): Detailed offering description
- `targetCustomer` (TEXT, NULL): Target customer profile
- `keyPainPoints` (TEXT, NULL): Pain points we solve (stored as JSON array)
- `googleCalendarId` (VARCHAR(255), NOT NULL): Google Calendar ID being monitored
- `googleCalendarName` (VARCHAR(255), NULL): Human-readable calendar name
- `createdAt` (TIMESTAMP, NOT NULL): Campaign creation timestamp
- `updatedAt` (TIMESTAMP, NOT NULL): Last update timestamp

**Validation Rules**:
- `companyDomain` must be valid domain format (e.g., "example.com")
- `status` can only be 'active' or 'paused'
- `keyPainPoints` stored as JSON array of strings
- Campaign name must be unique per user

**Indexes**:
- Primary key on `id`
- Index on `userId` for user campaign lookups
- Index on `status` for filtering active campaigns
- Composite index on (`userId`, `googleCalendarId`) to prevent duplicate calendar connections

**State Transitions**:
- `active` → `paused`: User pauses campaign (stops webhook processing)
- `paused` → `active`: User resumes campaign (reactivates webhook)

---

### 3. WebhookSubscription

Represents a Google Calendar webhook subscription for real-time event notifications.

**Fields**:
- `id` (UUID, PK): Unique subscription identifier
- `campaignId` (UUID, FK → Campaign.id, NOT NULL, UNIQUE): Associated campaign
- `googleResourceId` (VARCHAR(255), UNIQUE, NOT NULL): Google's resource identifier
- `googleChannelId` (VARCHAR(255), UNIQUE, NOT NULL): Google's channel identifier
- `expiresAt` (TIMESTAMP, NOT NULL): When subscription expires (max 7 days)
- `status` (ENUM['active', 'expired', 'cancelled'], NOT NULL): Subscription state
- `lastNotificationAt` (TIMESTAMP, NULL): Last webhook notification received
- `createdAt` (TIMESTAMP, NOT NULL): Subscription creation timestamp
- `updatedAt` (TIMESTAMP, NOT NULL): Last update timestamp

**Validation Rules**:
- One active subscription per campaign
- Expires within 7 days (Google Calendar API limitation)
- Must be renewed before expiration

**Indexes**:
- Primary key on `id`
- Unique index on `campaignId`
- Unique index on `googleResourceId`
- Index on `expiresAt` for renewal job queries

**State Transitions**:
- `active` → `expired`: Automatic when `expiresAt` passes
- `active` → `cancelled`: User pauses/deletes campaign
- `expired` → `active`: Renewal job creates new subscription

---

### 4. Meeting

Represents a calendar event with external attendees.

**Fields**:
- `id` (UUID, PK): Unique meeting identifier
- `campaignId` (UUID, FK → Campaign.id, NOT NULL): Associated campaign
- `googleEventId` (VARCHAR(255), NOT NULL): Google Calendar event ID
- `title` (VARCHAR(500), NOT NULL): Meeting title from calendar
- `description` (TEXT, NULL): Meeting description/notes from calendar
- `startTime` (TIMESTAMP, NOT NULL): Meeting start time (UTC)
- `endTime` (TIMESTAMP, NOT NULL): Meeting end time (UTC)
- `timezone` (VARCHAR(100), NOT NULL): IANA timezone (e.g., "America/Los_Angeles")
- `location` (VARCHAR(500), NULL): Meeting location
- `meetLink` (VARCHAR(500), NULL): Video conference link if present
- `status` (ENUM['scheduled', 'cancelled', 'completed'], NOT NULL, DEFAULT 'scheduled'): Meeting state
- `researchStatus` (ENUM['none', 'pending', 'generating', 'ready', 'failed'], NOT NULL, DEFAULT 'none'): Research generation state
- `researchBriefId` (UUID, FK → ResearchBrief.id, NULL): Associated research brief
- `researchFailureReason` (TEXT, NULL): Error message if research failed
- `hasExternalAttendees` (BOOLEAN, NOT NULL, DEFAULT false): Whether meeting has external participants
- `createdAt` (TIMESTAMP, NOT NULL): Record creation timestamp
- `updatedAt` (TIMESTAMP, NOT NULL): Last update timestamp

**Validation Rules**:
- `googleEventId` must be unique per campaign
- `startTime` must be before `endTime`
- `researchStatus` = 'ready' requires `researchBriefId` NOT NULL
- `researchStatus` = 'failed' requires `researchFailureReason` NOT NULL

**Indexes**:
- Primary key on `id`
- Composite index on (`campaignId`, `googleEventId`) for webhook lookups
- Index on `startTime` for calendar view queries
- Index on `researchStatus` for filtering meetings needing research

**State Transitions**:
- `scheduled` → `cancelled`: User cancels meeting in Google Calendar
- `cancelled` → `scheduled`: User restores cancelled meeting
- `scheduled` → `completed`: Meeting end time passes
- Research status flow: `none` → `pending` → `generating` → `ready`/`failed`

---

### 5. Prospect

Represents an external meeting attendee or ad-hoc research subject.

**Fields**:
- `id` (UUID, PK): Unique prospect identifier
- `email` (VARCHAR(255), UNIQUE, NOT NULL): Prospect's email address
- `name` (VARCHAR(255), NULL): Prospect's name (from calendar or research)
- `title` (VARCHAR(255), NULL): Job title
- `companyId` (UUID, FK → Company.id, NULL): Associated company
- `location` (VARCHAR(255), NULL): Geographic location
- `linkedinUrl` (VARCHAR(500), NULL): LinkedIn profile URL
- `lastResearchedAt` (TIMESTAMP, NULL): When prospect was last researched
- `createdAt` (TIMESTAMP, NOT NULL): Record creation timestamp
- `updatedAt` (TIMESTAMP, NOT NULL): Last update timestamp

**Validation Rules**:
- Email must be valid format and unique
- Email domain should not match internal company domains (validation at application layer)

**Indexes**:
- Primary key on `id`
- Unique index on `email`
- Index on `companyId` for company-based lookups
- Index on `lastResearchedAt` for cache invalidation

**State Transitions**: N/A (prospects are created when detected and updated when researched)

---

### 6. Company

Represents an external organization being researched.

**Fields**:
- `id` (UUID, PK): Unique company identifier
- `domain` (VARCHAR(255), UNIQUE, NOT NULL): Company domain (e.g., "acmecorp.com")
- `name` (VARCHAR(255), NULL): Company name
- `industry` (VARCHAR(255), NULL): Industry classification
- `employeeCount` (VARCHAR(100), NULL): Employee count range (e.g., "50-200")
- `revenue` (VARCHAR(100), NULL): Revenue range if available
- `fundingStage` (VARCHAR(100), NULL): Funding stage (e.g., "Series B")
- `headquarters` (VARCHAR(255), NULL): HQ location
- `website` (VARCHAR(500), NULL): Company website URL
- `crunchbaseUrl` (VARCHAR(500), NULL): Crunchbase profile URL
- `lastResearchedAt` (TIMESTAMP, NULL): When company was last researched
- `createdAt` (TIMESTAMP, NOT NULL): Record creation timestamp
- `updatedAt` (TIMESTAMP, NOT NULL): Last update timestamp

**Validation Rules**:
- Domain must be unique and valid format
- Domain should not match internal company domains

**Indexes**:
- Primary key on `id`
- Unique index on `domain`
- Index on `lastResearchedAt` for cache invalidation

**State Transitions**: N/A (companies are created when detected and updated when researched)

---

### 7. ResearchBrief

Represents a generated intelligence brief for a meeting or ad-hoc request.

**Fields**:
- `id` (UUID, PK): Unique brief identifier
- `type` (ENUM['calendar', 'adhoc'], NOT NULL): Brief origin type
- `campaignId` (UUID, FK → Campaign.id, NOT NULL): Campaign context used
- `meetingId` (UUID, FK → Meeting.id, NULL): Associated meeting (if type='calendar')
- `adHocRequestId` (UUID, FK → AdHocResearchRequest.id, NULL): Associated ad-hoc request (if type='adhoc')
- `confidenceRating` (ENUM['HIGH', 'MEDIUM', 'LOW'], NOT NULL): Data quality confidence
- `confidenceExplanation` (TEXT, NULL): Why this confidence rating
- `companyOverview` (TEXT, NULL): "What They Do" section content
- `painPoints` (TEXT, NULL): "Likely Pain Points" section content
- `howWeFit` (TEXT, NULL): "How We Fit" section content
- `openingLine` (TEXT, NULL): Personalized conversation starter
- `discoveryQuestions` (TEXT, NULL): JSON array of questions to ask
- `successOutcome` (TEXT, NULL): What a successful call looks like
- `watchOuts` (TEXT, NULL): Potential objections or red flags
- `recentSignals` (TEXT, NULL): JSON array of recent company developments
- `pdfUrl` (VARCHAR(500), NULL): URL to generated PDF export
- `generatedAt` (TIMESTAMP, NOT NULL): When brief was generated
- `createdAt` (TIMESTAMP, NOT NULL): Record creation timestamp
- `updatedAt` (TIMESTAMP, NOT NULL): Last update timestamp

**Validation Rules**:
- If `type='calendar'`, `meetingId` must NOT be NULL
- If `type='adhoc'`, `adHocRequestId` must NOT be NULL
- `discoveryQuestions` and `recentSignals` stored as JSON arrays
- At least one of (`meetingId`, `adHocRequestId`) must be present

**Indexes**:
- Primary key on `id`
- Index on `meetingId` for meeting brief lookups
- Index on `adHocRequestId` for ad-hoc brief lookups
- Index on `campaignId` for campaign-based filtering
- Index on `generatedAt` for sorting recent briefs

**State Transitions**: N/A (briefs are immutable once generated; updates create new versions)

---

### 8. ProspectInfo

Represents researched information about a specific prospect within a research brief.

**Fields**:
- `id` (UUID, PK): Unique prospect info identifier
- `researchBriefId` (UUID, FK → ResearchBrief.id, NOT NULL): Associated brief
- `prospectId` (UUID, FK → Prospect.id, NOT NULL): Associated prospect
- `title` (VARCHAR(255), NULL): Job title at time of research
- `location` (VARCHAR(255), NULL): Geographic location
- `background` (TEXT, NULL): Professional background summary
- `reportsTo` (VARCHAR(255), NULL): Manager/reports-to information
- `teamSize` (VARCHAR(100), NULL): Team size if known
- `recentActivity` (TEXT, NULL): Recent LinkedIn/Twitter activity
- `createdAt` (TIMESTAMP, NOT NULL): Record creation timestamp

**Validation Rules**:
- One ProspectInfo entry per prospect per brief (composite unique constraint)

**Indexes**:
- Primary key on `id`
- Index on `researchBriefId` for fetching all prospects in a brief
- Composite unique index on (`researchBriefId`, `prospectId`)

**State Transitions**: N/A (prospect info is immutable per brief snapshot)

---

### 9. ResearchSource

Represents a source used during research generation.

**Fields**:
- `id` (UUID, PK): Unique source identifier
- `researchBriefId` (UUID, FK → ResearchBrief.id, NOT NULL): Associated brief
- `sourceType` (ENUM['company_website', 'linkedin', 'crunchbase', 'news', 'twitter', 'other'], NOT NULL): Source category
- `url` (VARCHAR(1000), NOT NULL): Source URL
- `title` (VARCHAR(500), NULL): Source title/description
- `accessedAt` (TIMESTAMP, NOT NULL): When source was accessed
- `createdAt` (TIMESTAMP, NOT NULL): Record creation timestamp

**Validation Rules**:
- URL must be valid format
- Multiple sources of same type allowed per brief

**Indexes**:
- Primary key on `id`
- Index on `researchBriefId` for fetching all sources for a brief

**State Transitions**: N/A (sources are immutable once created)

---

### 10. AdHocResearchRequest

Represents a manually triggered research request (not from calendar).

**Fields**:
- `id` (UUID, PK): Unique request identifier
- `userId` (UUID, FK → User.id, NOT NULL): User who created the request
- `campaignId` (UUID, FK → Campaign.id, NOT NULL): Campaign context for research
- `prospectName` (VARCHAR(255), NULL): Prospect name (optional input)
- `companyName` (VARCHAR(255), NULL): Company name (optional input)
- `email` (VARCHAR(255), NULL): Email address (optional input)
- `status` (ENUM['pending', 'generating', 'ready', 'failed'], NOT NULL, DEFAULT 'pending'): Research state
- `researchBriefId` (UUID, FK → ResearchBrief.id, NULL): Associated brief when ready
- `failureReason` (TEXT, NULL): Error message if research failed
- `createdAt` (TIMESTAMP, NOT NULL): Request creation timestamp
- `updatedAt` (TIMESTAMP, NOT NULL): Last update timestamp

**Validation Rules**:
- At least one of (`prospectName`, `companyName`, `email`) must be provided
- `status='ready'` requires `researchBriefId` NOT NULL
- `status='failed'` requires `failureReason` NOT NULL
- Email must be valid format if provided

**Indexes**:
- Primary key on `id`
- Index on `userId` for user's ad-hoc research list
- Index on `campaignId` for campaign filtering
- Index on `status` for filtering pending/failed requests
- Index on `createdAt` for sorting by recency

**State Transitions**:
- `pending` → `generating`: Background job starts research
- `generating` → `ready`: Research completes successfully
- `generating` → `failed`: Research encounters unrecoverable error

---

### 11. MeetingProspect (Junction Table)

Links meetings to prospects (many-to-many relationship).

**Fields**:
- `id` (UUID, PK): Unique junction identifier
- `meetingId` (UUID, FK → Meeting.id, NOT NULL): Associated meeting
- `prospectId` (UUID, FK → Prospect.id, NOT NULL): Associated prospect
- `isOrganizer` (BOOLEAN, NOT NULL, DEFAULT false): Whether this prospect is the meeting organizer
- `responseStatus` (ENUM['accepted', 'declined', 'tentative', 'needsAction'], NULL): RSVP status from calendar
- `createdAt` (TIMESTAMP, NOT NULL): Record creation timestamp

**Validation Rules**:
- Composite unique constraint on (`meetingId`, `prospectId`)

**Indexes**:
- Primary key on `id`
- Composite unique index on (`meetingId`, `prospectId`)
- Index on `meetingId` for fetching meeting attendees
- Index on `prospectId` for finding all meetings with a prospect

**State Transitions**: N/A (junction records are created/deleted based on calendar changes)

---

## Drizzle Schema Structure

The schema will be organized in `/lib/db/schema.ts` with the following structure:

```typescript
// Core entities
export const users = pgTable('users', { ... })
export const campaigns = pgTable('campaigns', { ... })
export const webhookSubscriptions = pgTable('webhook_subscriptions', { ... })
export const meetings = pgTable('meetings', { ... })
export const prospects = pgTable('prospects', { ... })
export const companies = pgTable('companies', { ... })
export const researchBriefs = pgTable('research_briefs', { ... })
export const prospectInfo = pgTable('prospect_info', { ... })
export const researchSources = pgTable('research_sources', { ... })
export const adHocResearchRequests = pgTable('adhoc_research_requests', { ... })
export const meetingProspects = pgTable('meeting_prospects', { ... })

// Relations for type-safe queries
export const usersRelations = relations(users, ...)
export const campaignsRelations = relations(campaigns, ...)
// ... etc
```

## Data Retention & Archival

- **Active Meetings**: Meetings within 90 days of `startTime` are actively displayed
- **Historical Meetings**: Meetings older than 90 days are retained but not shown by default
- **Research Briefs**: Never automatically deleted; user can manually delete ad-hoc briefs
- **Webhook Subscriptions**: Expired subscriptions are retained for audit trail
- **Token Refresh**: Google tokens are refreshed automatically via NextAuth callbacks

## Encryption & Security

- **Sensitive Fields**: Google access/refresh tokens encrypted at application level
- **Database**: Neon Postgres provides encryption at rest by default
- **Connection**: TLS/SSL enforced for all database connections
- **API Keys**: Perplexity/Claude API keys stored in environment variables, never in database

## Migration Strategy

1. Initial migration creates all tables with indexes
2. Future migrations use Drizzle Kit's declarative approach
3. Run migrations in Vercel build process before deployment
4. Backward compatibility maintained for schema changes
5. No destructive migrations without explicit data migration scripts
