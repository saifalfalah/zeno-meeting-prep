# Inngest Background Job Contracts

**Feature**: 001-meeting-prep | **Date**: 2025-12-07

This document defines the contract for all Inngest background jobs used in the Pre-Call Intelligence Dashboard.

## Overview

Inngest provides reliable, step-based background job execution for long-running tasks that exceed Vercel's serverless function timeout limits. All functions use automatic retries, state persistence, and event-driven triggers.

## Function Definitions

### 1. process-webhook

**Trigger**: `calendar/webhook.received`

**Purpose**: Process Google Calendar webhook notifications and determine what action to take (create meeting, update meeting, trigger research).

**Event Payload**:
```typescript
{
  name: 'calendar/webhook.received',
  data: {
    channelId: string;           // Google channel ID
    resourceId: string;          // Google resource ID
    resourceState: 'sync' | 'exists' | 'not_exists';
    campaignId: string;          // Associated campaign UUID
    calendarId: string;          // Google calendar ID
    receivedAt: string;          // ISO timestamp
  }
}
```

**Steps**:
1. **Validate webhook** (`step.run('validate-webhook')`)
   - Verify channel ID matches active subscription
   - Check campaign is active
   - Return: `{ valid: boolean, campaignId?: string }`

2. **Fetch calendar changes** (`step.run('fetch-calendar-changes')`)
   - Call Google Calendar API to get recent event changes
   - Use syncToken for incremental sync
   - Return: `{ events: GoogleCalendarEvent[] }`

3. **Process each event** (`step.run('process-event-{eventId}')`)
   - For each changed event, determine if it has external attendees
   - Create/update Meeting record
   - Create/update MeetingProspect records
   - Return: `{ meetingId: string, hasExternalAttendees: boolean, isNewMeeting: boolean }`

4. **Trigger research if needed** (`step.run('trigger-research-{meetingId}')`)
   - If new meeting with external attendees, send `research/generate.requested` event
   - If meeting updated with new attendees, send `research/generate.requested` event
   - Skip if meeting already has recent research (<7 days)
   - Return: `{ researchTriggered: boolean }`

**Retry Strategy**:
- Google API calls: 3 retries with exponential backoff
- Database operations: 2 retries with 1s delay
- Total timeout: 60 seconds

**Error Handling**:
- Google API rate limit: Use `RetryAfterError` with delay from rate limit header
- Invalid webhook: Log and return 200 (prevent retry loop)
- Database errors: Retry with exponential backoff, fail after 2 attempts

**Success Criteria**: Meeting record created/updated, research triggered if appropriate

---

### 2. generate-research

**Trigger**: `research/generate.requested`

**Purpose**: Orchestrate the multi-step research process using Perplexity API and Claude API to generate a research brief.

**Event Payload**:
```typescript
{
  name: 'research/generate.requested',
  data: {
    type: 'calendar' | 'adhoc';
    meetingId?: string;          // If type='calendar'
    adHocRequestId?: string;     // If type='adhoc'
    campaignId: string;
    prospects: Array<{
      email: string;
      name?: string;
      companyDomain?: string;
    }>;
    requestedAt: string;         // ISO timestamp
  }
}
```

**Steps**:
1. **Update status to generating** (`step.run('update-status-generating')`)
   - Set Meeting.researchStatus = 'generating' OR AdHocRequest.status = 'generating'
   - Return: `{ updated: boolean }`

2. **Research prospects** (`step.run('research-prospect-{email}')`) - Parallel for each prospect
   - Call Perplexity API with prompt: "Research {name} at {company domain}: job title, background, recent activity"
   - Parse response and extract structured data
   - Rate limit: Sleep 1s between calls if rate limited
   - Return: `{ prospectId: string, data: ProspectResearchData }`

3. **Research companies** (`step.run('research-company-{domain}')`) - Parallel for each unique company
   - Check if company researched in last 24 hours (cache)
   - If cached, return cached data
   - Otherwise, call Perplexity API: "Research company {domain}: industry, size, funding, recent news (last 90 days)"
   - Store in Company table with lastResearchedAt
   - Return: `{ companyId: string, data: CompanyResearchData }`

4. **Fetch campaign context** (`step.run('fetch-campaign-context')`)
   - Load campaign offering description, target customer, pain points
   - Return: `{ campaign: CampaignContext }`

5. **Generate brief with Claude** (`step.run('generate-brief')`)
   - Construct prompt with all research data + campaign context
   - Call Claude API with system prompt for brief generation
   - Parse response into structured brief sections
   - Retry up to 2 times if Claude returns invalid JSON
   - Return: `{ brief: ResearchBriefData }`

6. **Create brief record** (`step.run('create-brief-record')`)
   - Insert ResearchBrief record
   - Insert ProspectInfo records for each prospect
   - Insert ResearchSource records for all sources used
   - Return: `{ briefId: string }`

7. **Update meeting/ad-hoc status** (`step.run('update-status-ready')`)
   - Set Meeting.researchStatus = 'ready' and researchBriefId
   - OR set AdHocRequest.status = 'ready' and researchBriefId
   - Return: `{ updated: boolean }`

**Retry Strategy**:
- Perplexity API: 3 retries with exponential backoff (1s, 2s, 4s)
- Claude API: 2 retries with 2s delay
- Database operations: 2 retries with 1s delay
- Total timeout: 300 seconds (5 minutes)

**Error Handling**:
- Perplexity rate limit (429): Use `RetryAfterError` with 60s delay
- Claude rate limit (429): Use `RetryAfterError` with 30s delay
- Perplexity no data (404 equivalent): Continue with available data, mark confidence as LOW
- Claude invalid response: Retry up to 2 times, then fail
- Database errors: Retry, then fail and set researchStatus = 'failed' with error message

**Success Criteria**: ResearchBrief record created with all sections populated, meeting/ad-hoc status updated to 'ready'

**Failure Handling**: Set researchStatus = 'failed' with failureReason explaining what step failed

---

### 3. renew-webhook-subscriptions

**Trigger**: `cron` - Every 6 hours

**Purpose**: Renew Google Calendar webhook subscriptions before they expire (Google expires after 7 days).

**Event Payload**:
```typescript
{
  name: 'app/scheduled.webhook-renewal',
  data: {
    scheduledAt: string;  // ISO timestamp
  }
}
```

**Steps**:
1. **Find expiring subscriptions** (`step.run('find-expiring-subscriptions')`)
   - Query WebhookSubscription where expiresAt < now + 12 hours AND status = 'active'
   - Return: `{ subscriptions: Array<{ id: string, campaignId: string, calendarId: string }> }`

2. **Renew each subscription** (`step.run('renew-subscription-{id}')`) - Parallel
   - Get user's Google access token (refresh if needed)
   - Stop existing webhook via Google Calendar API
   - Create new webhook with same channel
   - Update WebhookSubscription record with new resourceId, channelId, expiresAt
   - Return: `{ renewed: boolean, newExpiresAt: string }`

3. **Mark failed renewals** (`step.run('handle-renewal-failures')`)
   - For any subscriptions that failed to renew, set status = 'expired'
   - Send notification event for user to reconnect calendar
   - Return: `{ failedCount: number }`

**Retry Strategy**:
- Google API calls: 2 retries with 5s delay
- Database operations: 2 retries with 1s delay
- Total timeout: 180 seconds (3 minutes)

**Error Handling**:
- Google API auth failure: Mark subscription as expired, send notification
- Google API rate limit: Use `RetryAfterError` with delay
- Database errors: Retry with exponential backoff

**Success Criteria**: All expiring subscriptions renewed successfully with new expiresAt > now + 6 days

---

### 4. send-research-notification (Optional - P2)

**Trigger**: `research/generate.failed`

**Purpose**: Notify user when research fails for an upcoming meeting.

**Event Payload**:
```typescript
{
  name: 'research/generate.failed',
  data: {
    meetingId: string;
    meetingTitle: string;
    meetingStartTime: string;
    failureReason: string;
    userId: string;
  }
}
```

**Steps**:
1. **Check meeting timing** (`step.run('check-if-urgent')`)
   - If meeting is >24 hours away, don't send notification (user has time)
   - If meeting is <24 hours away, proceed with notification
   - Return: `{ shouldNotify: boolean }`

2. **Send notification** (`step.run('send-notification')`)
   - Send email notification to user
   - Include meeting title, time, failure reason, link to manual research
   - Return: `{ sent: boolean }`

**Retry Strategy**:
- Email sending: 2 retries with 5s delay
- Total timeout: 30 seconds

**Error Handling**:
- Email send failure: Log error, don't retry more than 2 times

**Success Criteria**: User notified of research failure via email

---

## Function Registration

All Inngest functions are registered in `/lib/inngest/client.ts` and served via the API route `/api/inngest`.

```typescript
// /lib/inngest/functions/index.ts
export const functions = [
  processWebhook,
  generateResearch,
  renewWebhookSubscriptions,
  sendResearchNotification,
];
```

## Event Naming Convention

- `calendar/webhook.received` - Google Calendar webhook received
- `research/generate.requested` - Research generation requested
- `research/generate.completed` - Research generation completed
- `research/generate.failed` - Research generation failed
- `app/scheduled.webhook-renewal` - Scheduled webhook renewal cron

## Monitoring & Observability

- All functions emit logs to Inngest dashboard
- Failed functions trigger `onFailure` hooks
- Function execution time tracked for performance monitoring
- Retry counts tracked to identify flaky dependencies

## Rate Limiting Strategy

**Perplexity API**:
- Default: 10 requests per minute
- Strategy: Use exponential backoff on 429, wait 60s before retry
- Batching: Process prospects sequentially with 1s delay between calls

**Claude API**:
- Default: 50 requests per minute
- Strategy: Use exponential backoff on 429, wait 30s before retry
- No batching needed (single call per brief)

**Google Calendar API**:
- Default: 100,000 requests per day per project
- Strategy: Exponential backoff on 429 with delay from `Retry-After` header
