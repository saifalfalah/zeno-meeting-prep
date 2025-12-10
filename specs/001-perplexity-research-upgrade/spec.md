# Feature Specification: Perplexity Research Quality Enhancement

**Feature Branch**: `001-perplexity-research-upgrade`
**Created**: 2025-12-10
**Status**: Draft
**Input**: User description: "Upgrade Perplexity research to use sonar-pro model with proper web search configuration for better research quality in ad-hoc and webhook features"

## Clarifications

### Session 2025-12-10

- Q: When Perplexity API rate limits are hit during multi-pass research (3 API calls per prospect), how should the system respond? → A: Complete available research passes and mark the brief as "partial results" due to rate limiting
- Q: What information should be logged when research operations execute, to enable debugging of web search quality issues and API failures in production? → A: Log API call parameters (model, domain filter, temperature), response metadata (token count, sources), timing, and any errors or partial results
- Q: When a user provides both an email address and an explicit website URL, but they point to different companies, how should the system resolve this conflict? → A: Prioritize the explicit website URL since it's often the marketing website with the most information, but if information is not available on the explicit website, also research the email domain as a fallback source
- Q: When the search_domain_filter is too restrictive and returns no results or very minimal results, how should the system respond? → A: Automatically retry the research pass without the domain filter and log that a fallback occurred
- Q: Success criteria SC-008 states research should remain under 45 seconds. What should happen if research execution exceeds this threshold? → A: 45 seconds is a performance benchmark/target, but it's acceptable to exceed it as long as total execution doesn't exceed 3-5 minutes hard maximum

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Improved Company Research Quality (Priority: P1)

Sales representatives using the ad-hoc research feature need comprehensive, factual company information gathered directly from company websites and recent news sources. Currently, research results lack depth because the system uses a local Llama model that doesn't actively browse websites.

**Why this priority**: This is the core value proposition of the feature - delivering high-quality, web-sourced research that sales reps can trust for their prospect meetings. Without this, the entire research feature provides diminished value.

**Independent Test**: Can be fully tested by submitting an ad-hoc research request with just a company website URL and verifying that the research brief contains information directly sourced from the company's actual website (verified by checking for specific content that only exists on the live website).

**Acceptance Scenarios**:

1. **Given** a sales rep provides a company website URL in the ad-hoc research form, **When** research is generated, **Then** the brief contains information scraped directly from that company's website with recent, accurate details
2. **Given** a sales rep provides a company domain via email, **When** the system researches the company, **Then** results include recent news from the last 6-12 months about the company
3. **Given** a sales rep provides a company name and website, **When** research completes, **Then** the brief shows multiple cited sources indicating the system visited various web pages

---

### User Story 2 - Enhanced Prospect Research with Website Priority (Priority: P1)

Sales representatives often have access to a prospect's company website but not their email address. The current ad-hoc form doesn't include a website field, forcing users to work around this by only using email (which may not be available) or company name (which produces less accurate results).

**Why this priority**: Adding a website field is essential for improved research quality since company websites are often the most reliable source of information and are frequently available when email addresses are not.

**Independent Test**: Can be fully tested by using the ad-hoc form to submit only a prospect name and company website URL (no email), then verifying that detailed company research is generated using the provided website as the primary source.

**Acceptance Scenarios**:

1. **Given** a sales rep has a prospect's company website but no email, **When** they fill out the ad-hoc research form, **Then** they can provide the website URL in a dedicated field
2. **Given** a sales rep provides both email and website URL, **When** research is performed, **Then** the system prioritizes the explicitly provided website over the domain extracted from email
3. **Given** a sales rep provides only a website URL with no other information, **When** they submit the form, **Then** validation accepts the submission (since website alone is sufficient for research)

---

### User Story 3 - Deep Multi-Source Prospect Research (Priority: P2)

Sales representatives need comprehensive background information about individual prospects, gathered from multiple professional sources including LinkedIn, company leadership pages, recent activities, and public profiles.

**Why this priority**: While important for personalization, prospect-level research is secondary to getting accurate company information. Good company research alone enables valuable conversations, while prospect research adds personalization.

**Independent Test**: Can be fully tested by submitting an ad-hoc request with a prospect name and company website, then verifying the research brief contains prospect-specific information from at least 2-3 different web sources (e.g., company about page, LinkedIn, news mentions).

**Acceptance Scenarios**:

1. **Given** a sales rep provides a prospect name and company, **When** research is conducted, **Then** the system searches multiple sources (company site, LinkedIn, news) for prospect information
2. **Given** a prospect has recent professional activities, **When** research completes, **Then** the brief includes recent activities from the past 6-12 months
3. **Given** limited information is available about a prospect, **When** research completes, **Then** the system still provides company-focused insights to enable a productive conversation

---

### User Story 4 - Webhook Integration Research Quality (Priority: P2)

When calendar events trigger automatic research via webhooks, the system should use the same high-quality web search approach to ensure consistency between ad-hoc and automated research.

**Why this priority**: Consistency across all research pathways is important for user trust, but webhook-triggered research has fewer configuration options (no explicit website field in calendar events), making it dependent on proper domain extraction.

**Independent Test**: Can be fully tested by creating a calendar event with attendee email addresses, waiting for the webhook to trigger, and verifying that the resulting research brief contains web-sourced information of the same quality as ad-hoc research.

**Acceptance Scenarios**:

1. **Given** a calendar event webhook triggers research, **When** the system researches attendee companies, **Then** the same sonar-pro model and web search configuration is used as in ad-hoc research
2. **Given** a calendar event includes attendee emails, **When** domain extraction occurs, **Then** the extracted domains are used with search_domain_filter to focus on company websites
3. **Given** webhook research completes, **When** compared to ad-hoc research for the same company, **Then** both produce similarly comprehensive results

---

### Edge Cases

- What happens when a provided website URL is invalid or unreachable (404, DNS failure)?
- How does the system handle companies with multiple domains or redirect chains (e.g., company.com → www.company.com)?
- **Rate Limiting**: When Perplexity API rate limits are hit during multi-pass research, the system completes whatever research passes succeeded and marks the brief as "partial results" with a note about rate limiting, rather than failing entirely
- How does the system behave when a company website has no useful content (parking page, under construction)?
- **Conflicting Domains**: When both email domain and explicit website are provided but point to different companies (e.g., email @companyA.com, website companyB.com), the system prioritizes the explicit website as the primary research target, but includes the email domain as a fallback source if the explicit website yields insufficient information
- How does the system handle very new companies or individuals with minimal online presence?
- **Restrictive Domain Filter**: When search_domain_filter returns no results or very minimal results (e.g., company website has little content), the system automatically retries the research pass without the domain filter to ensure useful results are returned, and logs the fallback event for monitoring
- How does the system handle non-English company websites?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST upgrade from "llama-3.1-sonar-large-128k-online" model to "sonar-pro" model for all Perplexity API calls in both researchCompany and researchProspect functions
- **FR-002**: System MUST include explicit system message instructing "Always browse the live web and company websites. Use multiple sources and include recent information." for all Perplexity research calls
- **FR-003**: System MUST implement search_domain_filter parameter when researching companies, passing the company domain to bias search toward the actual company website
- **FR-004**: System MUST perform multiple targeted research passes per prospect: one pass focused on company website (with domain filter), one pass for company news/context (without domain filter), and one pass for prospect background
- **FR-005**: System MUST add a "Company Website" field to the AdHocForm component as an optional input field
- **FR-006**: System MUST validate website URLs provided in the ad-hoc form, accepting common formats (http://, https://, or bare domain) and normalizing them to proper URLs
- **FR-007**: System MUST prioritize explicitly provided website URLs over domains extracted from email addresses when both are available, using the explicit website as the primary research target and the email domain as a fallback source if the explicit website yields insufficient information
- **FR-008**: System MUST update form validation to accept submissions with only website field populated (removing requirement for email/name/company when website is provided)
- **FR-009**: System MUST use temperature between 0.1-0.3 for all Perplexity research calls to reduce hallucinations
- **FR-010**: System MUST use max_tokens of 2000-3000 for research calls to allow comprehensive responses
- **FR-011**: System MUST apply the same Perplexity configuration (sonar-pro, search_domain_filter, multi-pass research) to webhook-triggered research
- **FR-012**: System MUST handle cases where provided website is unreachable by falling back to research without domain filter (allowing broader search)
- **FR-013**: System MUST extract and normalize company domains from various URL formats (e.g., "https://www.company.com/about" → "company.com")
- **FR-014**: System MUST update AdHocFormData interface to include optional website field
- **FR-015**: System MUST pass website information through the API endpoint to the research orchestration layer
- **FR-016**: System MUST handle Perplexity API rate limit errors by completing available research passes and marking the research brief with a "partial results" indicator rather than failing the entire request
- **FR-017**: System MUST log comprehensive research operation details including API call parameters (model, domain filter, temperature), response metadata (token count, sources cited), execution timing per research pass, and any errors or partial result conditions
- **FR-018**: System MUST detect when search_domain_filter returns insufficient results (no results or very minimal content) and automatically retry the research pass without the domain filter, logging the fallback occurrence
- **FR-019**: System MUST implement a hard timeout of 5 minutes for research operations to prevent indefinite hangs, terminating the operation and returning partial results if the timeout is exceeded

### Key Entities

- **Research Configuration**: Represents Perplexity API call settings including model ("sonar-pro"), temperature (0.1-0.3), max_tokens (2000-3000), search_domain_filter (optional domain array), system message (web browsing instruction)
- **Research Pass**: Represents a single focused research query with specific intent (company website focus, news context, or prospect background), each with distinct configuration
- **Company Website**: Represents a company's primary web domain, may be explicitly provided by user or extracted from email/company name, used for domain filtering
- **Ad-Hoc Research Request**: Enhanced to include optional website field alongside existing fields (prospectName, companyName, email, campaignId)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Research briefs contain information verifiable as sourced from actual company websites (determined by spot-checking 10 random briefs and confirming specific website content appears in research)
- **SC-002**: Research quality subjective rating improves as measured by comparing 5 research briefs generated before and after the upgrade (rating on 1-10 scale for accuracy, depth, and recency)
- **SC-003**: Ad-hoc research requests succeed with only website field populated (no email or company name required)
- **SC-004**: 90% of ad-hoc research requests complete successfully without errors when valid website URLs are provided
- **SC-005**: Research briefs include citations or references to multiple sources (minimum 2-3 sources per brief) indicating multi-source web research occurred
- **SC-006**: Webhook-triggered research produces results with equivalent quality to ad-hoc research (measured by comparing research briefs for the same company through both pathways)
- **SC-007**: System gracefully handles invalid or unreachable websites by falling back to broader search without failing the entire research request
- **SC-008**: Research execution time remains under 45 seconds for standard ad-hoc requests as a performance target (not a hard limit), with a hard maximum timeout of 3-5 minutes to prevent indefinite hangs

## Assumptions *(if any)*

- Perplexity API "sonar-pro" model is available and accessible with current API key
- Perplexity API supports search_domain_filter parameter as documented
- Current Perplexity API rate limits are sufficient for multi-pass research approach (3 calls per prospect/company)
- Users providing website URLs will primarily provide homepage or main domain URLs rather than deep links to specific pages
- Domain extraction from email addresses is already implemented and reliable
- The orchestrateResearch function in lib/services/research.ts is the appropriate place to coordinate multiple research passes
- Existing error handling and retry logic (RetryAfterError, NonRetriableError) will continue to work with upgraded model
- Claude brief generation service can effectively synthesize information from multiple research passes

## Dependencies

- Perplexity API availability and "sonar-pro" model access
- Existing authentication and API key configuration (PERPLEXITY_API_KEY environment variable)
- Current form validation framework in AdHocForm component
- Existing database schema for ad-hoc research requests (may need migration to add website field)
- Webhook integration system for calendar events

## Out of Scope

- Implementing custom web scraping or crawling (relying on Perplexity's built-in web search capabilities)
- Adding website field to calendar event integration (only focusing on ad-hoc form UI)
- Creating a website validation service that checks if domains are reachable before research
- Implementing caching of company research results to reduce API calls
- Adding user-configurable research depth or model selection options
- Translating non-English website content
- Integrating additional research APIs beyond Perplexity
- Creating a preview or diff view to show research quality improvements
- Implementing usage analytics or cost tracking for sonar-pro model usage
