# Feature Specification: Pre-Call Intelligence Dashboard

**Feature Branch**: `001-meeting-prep`
**Created**: 2025-12-06
**Status**: Draft
**Input**: User description: "Pre-Call Intelligence Dashboard - A public website that automatically generates detailed research briefs for every upcoming sales meeting that has external attendees."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Upcoming Meetings with Research Status (Priority: P1)

As a sales professional, I need to see all my upcoming meetings with external attendees in a familiar calendar format, so I can quickly identify which calls I have and whether research is ready for each one.

**Why this priority**: This is the core interface that enables all other functionality. Without the ability to view meetings and their research status, the system provides no value. This represents the minimal viable product - even if research generation isn't perfect, users can at least see what's coming and know if briefs are available.

**Independent Test**: Can be fully tested by connecting a calendar with sample meetings and verifying that the dashboard displays them in daily, weekly, and monthly views with accurate status indicators (ready, generating, failed, no external attendees). Delivers immediate value by providing a centralized view of sales calls.

**Acceptance Scenarios**:

1. **Given** I have connected my Google Calendar with 5 upcoming meetings (3 with external attendees, 2 internal-only), **When** I open the weekly dashboard view, **Then** I see 3 meetings displayed with research status badges and 2 meetings are hidden or marked as internal-only
2. **Given** I am viewing the dashboard on my device in Pacific timezone, **When** I have a meeting scheduled for 2:00 PM Eastern, **Then** the meeting displays as 11:00 AM with a "in X hours" relative time indicator
3. **Given** I am on the weekly view, **When** I click the "Day" toggle button or press "D" on my keyboard, **Then** the view switches to show only today's meetings in a vertical timeline format
4. **Given** I am on the monthly view, **When** I click on a specific date that has meetings, **Then** the view switches to the daily view for that selected date
5. **Given** I have multiple active campaigns, **When** I apply a campaign filter, **Then** only meetings associated with that campaign are displayed
6. **Given** I am on any calendar view, **When** I click the "Today" button, **Then** the view navigates to show today's date

---

### User Story 2 - Access Structured Research Briefs (Priority: P1)

As a sales professional preparing for a call, I need to access a consistently-formatted research brief for each meeting, so I can quickly scan key information about the prospect, their company, and how to approach the conversation.

**Why this priority**: This is the primary value proposition - automated research that saves 15-30 minutes per call. Without this, the system is just a calendar viewer. This story ensures that when research completes, users can access actionable intelligence.

**Independent Test**: Can be fully tested by triggering research for a known company/prospect and verifying that the brief follows the specified template structure with all required sections (header, quick facts, deep dive, call strategy, sources). Delivers immediate value by providing pre-call intelligence without manual research.

**Acceptance Scenarios**:

1. **Given** a meeting with "john@acmecorp.com" has completed research, **When** I click on the meeting card in any calendar view, **Then** I see a brief with a fixed-structure header showing prospect name/title/location, company name/industry/size, and meeting time/campaign/duration
2. **Given** I am viewing a research brief, **When** I scan the Quick Facts section, **Then** I see three consistent boxes: Company at a Glance, Prospect at a Glance, and Recent Signals (last 90 days) - even if some fields show "Unknown"
3. **Given** I am viewing a research brief for a well-documented company, **When** I read the Deep Dive section, **Then** I see detailed paragraphs under "What They Do", "Likely Pain Points", and "How We Fit" headers
4. **Given** I am viewing a research brief, **When** I review the Call Strategy section, **Then** I see exactly four boxes: Opening Line (personalized hook), Discovery Questions (numbered list), Success Outcome (what a successful call achieves), and Watch Out For (potential objections/red flags)
5. **Given** I am viewing a research brief, **When** I scroll to the footer, **Then** I see a confidence rating (HIGH/MEDIUM/LOW) with explanation and a list of sources used with URLs
6. **Given** I am viewing a brief on my mobile phone before a call, **When** I scan from top to bottom, **Then** I can comprehend the key information in under 60 seconds due to consistent structure

---

### User Story 3 - Set Up Campaign with Calendar Integration (Priority: P1)

As a sales professional setting up the system for the first time, I need to connect my Google Calendar and describe what I'm selling, so the system can automatically detect relevant meetings and generate contextually appropriate research.

**Why this priority**: This is the essential onboarding flow that makes the system operational. Without campaign setup, no automated research can occur. This story ensures users can activate the system independently without technical assistance.

**Independent Test**: Can be fully tested by walking through the 4-step setup flow (connect calendar, define company, define offering, review & activate) and verifying that a webhook subscription is created and the campaign appears in settings as active. Delivers value by enabling automated monitoring of calendar events.

**Acceptance Scenarios**:

1. **Given** I am a new user with no campaigns, **When** I navigate to the campaign setup page and click "Connect Google Account", **Then** I am redirected to Google OAuth consent screen requesting calendar read access
2. **Given** I have granted calendar access, **When** I complete the OAuth flow, **Then** I see a list of my calendars (primary, work, custom) with checkboxes to select which calendar to watch
3. **Given** I have selected a calendar, **When** I proceed to Step 2 "Define Your Company", **Then** I see form fields for: Company name (text), Company domain (text with example "mycompany.com"), and Company description (textarea, 2-3 sentences)
4. **Given** I have entered company information, **When** I proceed to Step 3 "Define What You're Selling", **Then** I see form fields for: Campaign name, What we're selling (detailed textarea), Target customer description (textarea), and Key pain points we solve (bullet point editor)
5. **Given** I have completed all setup fields, **When** I reach Step 4 "Review & Activate", **Then** I see a summary of all entered information with an "Activate Campaign" button
6. **Given** I click "Activate Campaign", **When** the system creates the webhook subscription, **Then** I see a confirmation that the webhook is working and the campaign appears in my dashboard with status "active"
7. **Given** I have an active campaign, **When** I navigate to Settings, **Then** I see the campaign listed with options to edit, pause, or delete it

---

### User Story 4 - Automatic Research Triggering and PDF Export (Priority: P2)

As a sales professional who schedules meetings throughout the day, I need research to automatically start when I create or update a calendar event with external attendees, and I need to download research briefs as PDFs, so I don't have to manually trigger research for each call and can access briefs offline or share them with colleagues.

**Why this priority**: This automation eliminates manual effort and ensures consistency - every external meeting gets researched. PDF export enables offline access and sharing, which is valuable but not blocking for proving core value. This is P2 because it's high-value but not required for MVP validation.

**Independent Test**: Can be fully tested by creating a calendar event with an external email address and verifying that: (1) webhook notification is received, (2) research job starts within seconds, (3) meeting appears on dashboard with "Generating" status, (4) brief is completed within 2-5 minutes, (5) PDF download button appears and generates properly formatted document. Delivers value by eliminating 15-30 minutes of manual research per call without user action.

**Acceptance Scenarios**:

1. **Given** I have an active campaign watching my "Sales Calls" calendar, **When** I create a new meeting with attendee "prospect@external-company.com" scheduled for tomorrow at 2pm, **Then** within 30 seconds the system receives a webhook notification and initiates research
2. **Given** a calendar event has both "colleague@mycompany.com" and "prospect@external-company.com", **When** the webhook notification is processed, **Then** the system identifies "prospect@external-company.com" as external (different domain from campaign company domain) and starts research only for external attendees
3. **Given** research has been initiated for a meeting, **When** I open the dashboard within 1 minute of creating the event, **Then** I see the meeting displayed with status badge "Generating" and no brief is accessible yet
4. **Given** research is in progress, **When** 2-5 minutes have elapsed, **Then** the meeting status updates to "Research Ready" and I can click to view the completed brief
5. **Given** I reschedule a meeting from 2pm to 3pm, **When** the webhook notification is received, **Then** the system updates the displayed meeting time but keeps the existing research (does not re-research)
6. **Given** I reschedule a meeting and add a new external attendee, **When** the webhook notification is received, **Then** the system triggers research for the new attendee and merges it with existing research
7. **Given** I am viewing a completed research brief for any meeting, **When** I click the "Download PDF" button, **Then** a PDF file is generated and downloaded with the same structure and content as the web view
8. **Given** I have downloaded a research brief as PDF, **When** I open the PDF file, **Then** I see all sections (header, quick facts, deep dive, call strategy, sources) properly formatted and readable offline

---

### User Story 5 - Handle Research Errors Transparently (Priority: P2)

As a sales professional relying on automated research, I need to be clearly notified when research fails and understand why, so I can manually prepare for calls that don't have automated briefs.

**Why this priority**: Error handling prevents silent failures and user surprises. While important for trust and reliability, this is P2 because the happy path (successful research) is more critical for initial validation. Good error handling improves the experience but isn't required for proving value.

**Independent Test**: Can be fully tested by simulating various failure scenarios (API timeout, rate limiting, obscure company with no data) and verifying that each shows a clear "Research Failed" status with specific error message and optional notification. Delivers value by ensuring users are never caught unprepared.

**Acceptance Scenarios**:

1. **Given** research is initiated for a prospect at an obscure company with minimal web presence, **When** the research pipeline completes with limited data, **Then** the brief is generated with available information, "Unknown" placeholders for missing data, and confidence rating marked as "LOW" with explanation
2. **Given** the research API (Perplexity or Claude) is experiencing downtime, **When** research is triggered, **Then** the system retries 3 times with exponential backoff before marking as failed
3. **Given** all retry attempts have failed, **When** the research job terminates, **Then** the meeting status updates to "Research Failed" with a clear error message (e.g., "API temporarily unavailable - retry manually or check back later")
4. **Given** a research failure has occurred, **When** I click on the failed meeting card, **Then** I see which specific step failed (prospect lookup, company lookup, or brief generation) to understand the issue
5. **Given** research has failed for an upcoming meeting, **When** the failure is detected, **Then** I optionally receive a notification (Slack or email) alerting me to manually prepare for this call

---

### User Story 6 - Manage Multiple Campaigns (Priority: P3)

As a sales professional selling different products or services, I need to create and manage multiple campaigns with different calendar connections and offering descriptions, so research briefs are contextually tailored to what I'm selling in each campaign.

**Why this priority**: This enables advanced users to scale the system across different sales motions. While valuable, it's P3 because most users will start with a single campaign. The core value (automated research) is proven with one campaign, and multi-campaign support is an enhancement for power users.

**Independent Test**: Can be fully tested by creating 2-3 campaigns with different calendars and offering descriptions, scheduling meetings in each calendar, and verifying that briefs reflect the appropriate campaign context in the "How We Fit" and "Call Strategy" sections. Delivers value by enabling one user to manage multiple distinct sales processes.

**Acceptance Scenarios**:

1. **Given** I have completed the setup flow for "Campaign A: Cold Email Services", **When** I click "Add New Campaign" in Settings, **Then** I am guided through the same 4-step setup flow for a second campaign
2. **Given** I have two active campaigns ("Cold Email Services" watching "Sales Calls" calendar, "Marketing Automation" watching "Agency Leads" calendar), **When** I create meetings in both calendars, **Then** research for each meeting uses the campaign-specific "what we're selling" context
3. **Given** I am viewing the dashboard with multiple campaigns active, **When** I apply a campaign filter dropdown, **Then** only meetings associated with the selected campaign are displayed
4. **Given** I have a campaign I no longer use, **When** I click "Pause" in Settings, **Then** the webhook stops monitoring that calendar and no new research is triggered, but existing research is preserved
5. **Given** I have a paused campaign, **When** I click "Resume" or "Edit", **Then** I can reactivate or update the campaign details and webhook monitoring restarts
6. **Given** I want to permanently remove a campaign, **When** I click "Delete" and confirm, **Then** the webhook subscription is removed, but historical research for past meetings is retained for reference

---

### User Story 7 - Ad-Hoc Research Without Calendar Events (Priority: P2)

As a sales professional who sometimes gets last-minute meeting requests or needs to research a prospect outside the formal calendar flow, I need to manually trigger research for any prospect by providing whatever information I have available (name, company, email), so I can prepare for ad-hoc meetings and opportunities without creating calendar events.

**Why this priority**: This addresses a real use case where sales professionals receive unexpected meeting invitations or need to quickly research someone they're about to meet. It also serves testing and demo purposes. While valuable, it's P2 because the primary workflow (calendar-driven research) proves the core value, and this is an enhancement that increases flexibility.

**Independent Test**: Can be fully tested by accessing the ad-hoc research interface, providing partial information (e.g., just company name, or just prospect name and email), selecting a campaign for context, and verifying that a research brief is generated based on available information. The brief should be downloadable as PDF and accessible from a dedicated section (not mixed with calendar meetings). Delivers value by enabling research for any prospect regardless of calendar status.

**Acceptance Scenarios**:

1. **Given** I navigate to the "Ad-Hoc Research" section of the dashboard, **When** I see the research form, **Then** I have optional fields for: Prospect Name (text), Company Name (text), Email (text), and Campaign (dropdown - required for context)
2. **Given** I have entered "Sarah Johnson" as prospect name, "TechStartup Inc" as company, and selected my "Cold Email Services" campaign, **When** I click "Generate Research", **Then** research is triggered using the same pipeline as calendar-based meetings
3. **Given** I have entered only a company name "Acme Corp" (no prospect name or email) and selected a campaign, **When** I click "Generate Research", **Then** research is triggered and generates a brief focused on company information with prospect section marked as "Unknown - no prospect provided"
4. **Given** I have entered only an email "john@techcorp.com" and selected a campaign, **When** I click "Generate Research", **Then** the system attempts to infer company from email domain and research both prospect and company
5. **Given** I have entered prospect name "John Smith" and company "Generic Company" (very common/ambiguous), **When** research completes, **Then** the brief is generated with available information and confidence rating reflects ambiguity (likely MEDIUM or LOW)
6. **Given** ad-hoc research is in progress, **When** I wait for completion (2-5 minutes), **Then** I see the resulting brief with all standard sections populated based on provided information and campaign context
7. **Given** I have generated an ad-hoc research brief, **When** I view the brief, **Then** I see a "Download PDF" button and can export the brief for offline access or sharing
8. **Given** I have multiple ad-hoc research briefs, **When** I view the "Ad-Hoc Research" section, **Then** I see a list of all my ad-hoc briefs (separate from calendar meetings) with prospect/company names, creation date, and campaign tags for easy reference
9. **Given** I have created an ad-hoc brief that I no longer need, **When** I click "Delete" on that brief, **Then** it is removed from my ad-hoc research list (calendar-based research is never deleted, only ad-hoc)
10. **Given** I want to quickly prepare for an unexpected meeting, **When** I trigger ad-hoc research and download the PDF, **Then** I can complete the entire flow (input → research → download) in under 3 minutes total

---

### Edge Cases

- **Multiple external attendees from same company**: What happens when a meeting has 3 people all from "acmecorp.com"? System should research the company once and create individual prospect sections for each person within a combined brief.

- **Multiple external attendees from different companies**: What happens when a meeting has "prospect1@companyA.com" and "prospect2@companyB.com"? System should research both companies and generate a combined brief with clearly separated sections for each company/prospect.

- **Recurring weekly meetings**: What happens when I have a standing weekly sync with the same prospect? System should reuse recent research (less than 7 days old) and only update if significant new news is detected, rather than re-researching every week.

- **Meeting created 10 minutes before start time**: What happens if I schedule a call for 10 minutes from now and research doesn't complete in time? System should show "Generating" status and allow user to view partial results or proceed without brief - never block or error.

- **Personal email domains (gmail.com, outlook.com)**: How does system determine company when attendee uses "john@gmail.com"? System should attempt to extract company from meeting title/notes if available, or flag as "Company unknown - manual input needed."

- **API failures and rate limiting**: What happens if Perplexity API is down or rate limits are hit? System should retry 3 times with exponential backoff, then mark as failed with clear error message. Never silently fail.

- **Duplicate webhook notifications**: How does system handle Google sending multiple notifications for the same event change? System should implement idempotent processing using event IDs to prevent duplicate research jobs.

- **Meeting cancelled then uncancelled**: What happens if I cancel a meeting and later restore it? System should resume displaying it on the dashboard and continue/restart research if needed.

- **All-day calendar events**: How should system handle all-day events (likely not sales calls)? System should either hide these or display them in a visually distinct way (greyed out) since they rarely represent prospect meetings.

- **Meetings outside business hours**: Should system research meetings at 9pm or 6am? Yes - still show and research them, as sales professionals often have calls across timezones.

- **Empty days/weeks**: What displays when I have no meetings? Show "No meetings scheduled" message rather than blank/empty space to confirm the system is working.

- **Timezone changes while traveling**: What happens if I travel from Pacific to Eastern timezone? System should auto-detect device timezone and recalculate all displayed meeting times to match current location.

- **Very long meeting durations**: How does system display a 4-hour workshop vs. a 30-minute call? Display duration as-is, but may want to flag unusually long meetings as potentially not 1:1 sales calls.

## Requirements *(mandatory)*

### Functional Requirements

**Calendar Integration & Event Detection**

- **FR-001**: System MUST integrate with Google Calendar via OAuth 2.0 to read calendar events and attendee information
- **FR-002**: System MUST create webhook subscriptions to receive real-time notifications when calendar events are created, updated, or deleted
- **FR-003**: System MUST identify external attendees by comparing email domains against the campaign's configured company domain
- **FR-004**: System MUST distinguish between meetings with external attendees (prospects) and internal-only meetings
- **FR-005**: System MUST handle webhook notifications idempotently using event IDs to prevent duplicate processing

**Research Automation**

- **FR-006**: System MUST automatically trigger research within 30 seconds when a meeting with external attendees is created or updated
- **FR-007**: System MUST research both prospect information (name, role, background, team) and company information (industry, size, funding, recent news, signals)
- **FR-008**: System MUST complete research and brief generation within 2-5 minutes under normal conditions
- **FR-009**: System MUST aggregate research when multiple external attendees are from the same company
- **FR-010**: System MUST generate separate research sections when external attendees are from different companies
- **FR-011**: System MUST reuse recent research (less than 7 days old) for recurring meetings unless significant new information is available
- **FR-012**: System MUST include campaign context ("what we're selling", "target customer", "pain points") when generating "How We Fit" and "Call Strategy" sections

**Research Brief Structure**

- **FR-013**: System MUST generate briefs following the fixed template structure: Header Bar (prospect|company|meeting columns), Quick Facts (3 boxes), Deep Dive (flexible content), Call Strategy (4 boxes), Sources & Confidence footer
- **FR-014**: System MUST display "Unknown" or "Not found" placeholders for missing data fields while maintaining section structure
- **FR-015**: System MUST assign a confidence rating (HIGH/MEDIUM/LOW) based on data availability and source quality
- **FR-016**: System MUST list all sources used with URLs (company website, Crunchbase, LinkedIn, news articles, etc.)
- **FR-017**: System MUST generate Recent Signals section showing positive/neutral/negative developments from the last 90 days

**Dashboard & Calendar Views**

- **FR-018**: System MUST provide three calendar views: Daily (single day vertical timeline), Weekly (7 days as columns with default view), Monthly (traditional grid)
- **FR-019**: System MUST support view switching via toggle buttons and keyboard shortcuts (D, W, M)
- **FR-020**: System MUST display meetings in the user's device-detected timezone with automatic conversion
- **FR-021**: System MUST show relative time indicators ("in 2 hours", "tomorrow at 3pm") alongside absolute times
- **FR-022**: System MUST display research status badges on meeting cards (Ready, Generating, Failed, No External Attendees)
- **FR-023**: System MUST support campaign filtering to show meetings from all campaigns or a selected campaign
- **FR-024**: System MUST provide date navigation controls (Previous/Next arrows, Today button)
- **FR-025**: System MUST allow clicking a meeting card to open the full research brief
- **FR-026**: System MUST allow clicking a date in monthly view to navigate to that day's daily view

**Campaign Management**

- **FR-027**: System MUST support multiple concurrent campaigns, each with its own calendar connection and offering description
- **FR-028**: System MUST guide users through a 4-step setup flow: (1) Connect Google Calendar, (2) Define Company, (3) Define What You're Selling, (4) Review & Activate
- **FR-029**: System MUST collect company domain to identify internal vs. external attendees
- **FR-030**: System MUST collect campaign-specific context: campaign name, what we're selling, target customer, key pain points
- **FR-031**: System MUST allow users to edit, pause, or delete campaigns from Settings page
- **FR-032**: System MUST preserve historical research when a campaign is paused or deleted
- **FR-033**: System MUST verify webhook subscription is working before marking campaign as active

**Event Lifecycle Handling**

- **FR-034**: System MUST update displayed meeting time when a meeting is rescheduled without re-researching
- **FR-035**: System MUST trigger research for new external attendees when attendees are added to an existing meeting
- **FR-036**: System MUST mark meetings as cancelled and stop in-progress research when meetings are cancelled
- **FR-037**: System MUST restore meetings and resume research when a cancelled meeting is uncancelled
- **FR-038**: System MUST note when external attendees are removed from a meeting while preserving their research

**Error Handling & Transparency**

- **FR-039**: System MUST retry failed API calls 3 times with exponential backoff before marking research as failed
- **FR-040**: System MUST display "Research Failed" status with specific error messages when research cannot complete
- **FR-041**: System MUST indicate which research step failed (prospect lookup, company lookup, brief generation)
- **FR-042**: System MUST generate briefs with available information and LOW confidence rating when data is limited (obscure companies)
- **FR-043**: System MUST flag meetings with personal email domains (gmail.com, outlook.com) as "Company unknown - manual input needed" when company cannot be inferred

**PDF Export**

- **FR-044**: System MUST provide a "Download PDF" button on all completed research briefs (both calendar-based and ad-hoc)
- **FR-045**: System MUST generate PDF files that maintain the same structure and formatting as the web view (header, quick facts, deep dive, call strategy, sources)
- **FR-046**: System MUST include all brief content in PDF exports with proper page breaks and readable formatting

**Ad-Hoc Research**

- **FR-047**: System MUST provide an "Ad-Hoc Research" interface accessible from the dashboard for manual research triggering
- **FR-048**: System MUST accept optional fields for ad-hoc research: Prospect Name, Company Name, Email
- **FR-049**: System MUST require campaign selection for ad-hoc research to provide appropriate context
- **FR-050**: System MUST generate research briefs using the same pipeline for ad-hoc requests as calendar-based meetings
- **FR-051**: System MUST handle partial information gracefully (e.g., company only, email only, name only) and generate briefs based on available data
- **FR-052**: System MUST infer company from email domain when only email is provided
- **FR-053**: System MUST display ad-hoc research briefs in a dedicated section separate from calendar meetings
- **FR-054**: System MUST allow users to delete ad-hoc research briefs (calendar-based briefs cannot be deleted)
- **FR-055**: System MUST list ad-hoc briefs with prospect/company name, creation date, and campaign tags
- **FR-056**: System MUST support PDF export for all ad-hoc research briefs

**Timezone & Locale**

- **FR-057**: System MUST auto-detect user's device timezone and display all meeting times in that timezone
- **FR-058**: System MUST recalculate displayed times when user's timezone changes (e.g., traveling)
- **FR-059**: System MUST handle meetings that span midnight correctly across timezone boundaries
- **FR-060**: System MUST respect user's locale for week start day (Monday vs. Sunday) in weekly view

### Key Entities

- **Campaign**: Represents a sales initiative with specific offering details; includes campaign name, connected calendar ID, company name, company domain, company description, what we're selling, target customer description, key pain points, status (active/paused), and webhook subscription details

- **Meeting**: Represents a calendar event with external attendees; includes meeting ID (from Google Calendar), title, start time, end time, duration, timezone, attendees list (internal and external), campaign association, research status (none/generating/ready/failed), and brief reference

- **Research Brief**: Represents the generated intelligence for a meeting or ad-hoc request; includes brief ID, type (calendar-based or ad-hoc), associated meeting (if calendar-based) or null (if ad-hoc), prospect information (name, title, location, background, reports-to, team size), company information (name, industry, size, stage, HQ, recent signals), deep dive analysis (what they do, pain points, how we fit), call strategy (opening line, discovery questions, success outcome, watch-outs), confidence rating, sources used, generated timestamp, campaign context used, and PDF download URL

- **Ad-Hoc Research Request**: Represents a manually triggered research request; includes request ID, optional prospect name, optional company name, optional email, required campaign association, creation timestamp, research status (generating/ready/failed), brief reference, and deletable flag (always true for ad-hoc, false for calendar-based)

- **Prospect**: Represents an external meeting attendee or ad-hoc research subject; includes email address, inferred or researched name, title, company affiliation, location, background, and research status

- **Company**: Represents an external organization being researched; includes company name, domain, industry, size (employees, revenue), funding stage, HQ location, recent news/signals, and last researched timestamp

- **Webhook Subscription**: Represents a Google Calendar webhook; includes subscription ID, calendar ID, campaign association, status (active/inactive), expiration timestamp, and last notification received timestamp

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view their upcoming meetings with accurate research status within 3 seconds of opening the dashboard
- **SC-002**: Research briefs are generated and marked "Ready" within 5 minutes for 90% of meetings under normal API conditions
- **SC-003**: Users can scan a research brief and extract key information (prospect background, company signals, call strategy) in under 60 seconds
- **SC-004**: System correctly identifies external attendees with 100% accuracy when email domains are different from configured company domain
- **SC-005**: Meeting times display in user's current timezone with less than 1 second delay when switching views
- **SC-006**: Campaign setup flow can be completed by a non-technical user in under 5 minutes
- **SC-007**: System handles 95% of research requests successfully without manual intervention (excluding legitimately obscure companies with no data)
- **SC-008**: Error messages for failed research clearly indicate the failure reason for 100% of failures
- **SC-009**: System processes webhook notifications and updates dashboard status within 30 seconds of calendar event changes
- **SC-010**: Users report spending less than 2 minutes preparing for calls (down from 15-30 minutes of manual research) based on user feedback
- **SC-011**: Dashboard remains responsive (page loads, view switches) with up to 100 upcoming meetings displayed
- **SC-012**: Research briefs maintain consistent template structure for 100% of generated briefs regardless of data availability
- **SC-013**: Users can successfully create and manage multiple campaigns without confusion or errors based on usability testing
- **SC-014**: System successfully handles recurring meetings by reusing recent research for 100% of recurring events within 7-day window
- **SC-015**: Users can download any research brief as PDF within 3 seconds of clicking the download button
- **SC-016**: PDF exports maintain 100% content fidelity with web view (all sections, formatting, and data present)
- **SC-017**: Users can complete the full ad-hoc research flow (input prospect details, generate research, download PDF) in under 3 minutes total
- **SC-018**: Ad-hoc research generates usable briefs even with partial information (company only or name only) for 90% of requests
- **SC-019**: Ad-hoc research briefs are clearly separated from calendar meetings and can be independently managed (viewed, deleted)
