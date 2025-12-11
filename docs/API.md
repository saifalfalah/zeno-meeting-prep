# API Documentation

## Overview

This document describes the REST API endpoints available in the Zeno Meeting Prep application.

---

## Ad-Hoc Research Requests

### POST /api/adhoc

Create a new ad-hoc research request for a prospect or company.

**Authentication**: Required

#### Request Body

```json
{
  "campaignId": "string (required)",
  "prospectName": "string (optional)",
  "companyName": "string (optional)",
  "email": "string (optional, must be valid email format)",
  "website": "string (optional, must be valid URL format)"
}
```

#### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `campaignId` | string | Yes | The ID of the campaign to associate this research with |
| `prospectName` | string | No | Name of the prospect (e.g., "John Smith") |
| `companyName` | string | No | Name of the company (e.g., "Acme Corp") |
| `email` | string | No | Email address of the prospect (e.g., "john@acmecorp.com") |
| `website` | string | No | Company website URL (e.g., "https://acmecorp.com" or "acmecorp.com") |

#### Validation Rules

1. **At least one field required**: You must provide at least one of: `prospectName`, `companyName`, `email`, or `website`
2. **Email validation**: If provided, `email` must be a valid email format
3. **Website validation**: If provided, `website` must be a valid URL format
   - Accepted formats: `https://example.com`, `http://example.com`, or `example.com`
   - The system will automatically normalize bare domains by adding `https://`
4. **Website prioritization**: When both `website` and `email` are provided, the explicit `website` URL takes priority over the domain extracted from the `email` for research purposes

#### Request Examples

**Minimal request with email only:**
```json
{
  "campaignId": "cm-123",
  "prospectName": "John Doe",
  "email": "john@acmecorp.com"
}
```

**Request with explicit website (recommended):**
```json
{
  "campaignId": "cm-123",
  "prospectName": "John Doe",
  "companyName": "Acme Corp",
  "email": "john@acmecorp.com",
  "website": "https://acmecorp.com"
}
```

**Website-only request (no email):**
```json
{
  "campaignId": "cm-123",
  "prospectName": "Jane Smith",
  "companyName": "TechCorp",
  "website": "techcorp.com"
}
```

**Website prioritization example:**
```json
{
  "campaignId": "cm-123",
  "prospectName": "Alice Johnson",
  "email": "alice@subsidiary.com",
  "website": "https://parent-company.com"
}
```
> In this example, research will focus on `parent-company.com` rather than `subsidiary.com`, allowing you to target the parent company even when the prospect uses a subsidiary email address.

#### Response

**Success (200 OK):**
```json
{
  "id": "adhoc-xyz789",
  "campaignId": "cm-123",
  "prospectName": "John Doe",
  "companyName": "Acme Corp",
  "email": "john@acmecorp.com",
  "website": "https://acmecorp.com",
  "status": "pending",
  "createdAt": "2025-12-11T10:30:00Z"
}
```

**Error Responses:**

**400 Bad Request - Missing required fields:**
```json
{
  "error": "At least one of prospectName, companyName, email, or website must be provided"
}
```

**400 Bad Request - Invalid email:**
```json
{
  "error": "Invalid email format"
}
```

**400 Bad Request - Invalid website URL:**
```json
{
  "error": "Invalid website URL (e.g., https://example.com or example.com)"
}
```

**401 Unauthorized:**
```json
{
  "error": "Unauthorized"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to create research request"
}
```

---

### GET /api/adhoc

Retrieve all ad-hoc research requests for the authenticated user.

**Authentication**: Required

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `campaignId` | string | No | Filter by campaign ID |
| `status` | string | No | Filter by status (`pending`, `processing`, `completed`, `failed`) |

#### Response

**Success (200 OK):**
```json
{
  "requests": [
    {
      "id": "adhoc-xyz789",
      "campaignId": "cm-123",
      "prospectName": "John Doe",
      "companyName": "Acme Corp",
      "email": "john@acmecorp.com",
      "website": "https://acmecorp.com",
      "status": "completed",
      "createdAt": "2025-12-11T10:30:00Z",
      "completedAt": "2025-12-11T10:35:00Z",
      "briefId": "brief-abc123"
    }
  ]
}
```

---

### GET /api/adhoc/[id]

Retrieve a specific ad-hoc research request by ID.

**Authentication**: Required

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | The ad-hoc research request ID |

#### Response

**Success (200 OK):**
```json
{
  "id": "adhoc-xyz789",
  "campaignId": "cm-123",
  "prospectName": "John Doe",
  "companyName": "Acme Corp",
  "email": "john@acmecorp.com",
  "website": "https://acmecorp.com",
  "status": "completed",
  "createdAt": "2025-12-11T10:30:00Z",
  "completedAt": "2025-12-11T10:35:00Z",
  "brief": {
    "id": "brief-abc123",
    "companyOverview": "...",
    "prospectInsights": "...",
    "callStrategy": "...",
    "sources": [
      {
        "url": "https://acmecorp.com/about",
        "title": "About Acme Corp",
        "snippet": "Founded in 2020..."
      }
    ]
  }
}
```

**Error Responses:**

**404 Not Found:**
```json
{
  "error": "Research request not found"
}
```

---

## Research Quality Notes

### Website Field Impact on Research Quality

The `website` field significantly improves research quality by:

1. **Direct Source Access**: Research is performed directly on the specified company website rather than relying solely on email domain extraction
2. **Domain Filtering**: The Perplexity API uses `search_domain_filter` to prioritize content from the specified website
3. **Accurate Attribution**: When the prospect's email domain differs from the actual company (e.g., subsidiaries, personal emails), you can specify the correct company website
4. **Multi-Pass Research**: The system performs three research passes:
   - **Pass 1**: Company website focus (using the specified `website`)
   - **Pass 2**: Company news and context (broader search)
   - **Pass 3**: Prospect background (professional sources)

### Best Practices

1. **Always provide website when available**: This yields the highest quality research results
2. **Use canonical domains**: Prefer main company domains (e.g., `company.com`) over subdomains (e.g., `blog.company.com`)
3. **Include protocol when possible**: While `example.com` works, `https://example.com` is preferred for consistency
4. **Verify URLs**: Ensure the website URL is correct and accessible before submitting

### Research Timeouts and Error Handling

- **Per-pass timeout**: 60 seconds
- **Total research timeout**: 3 minutes (180 seconds)
- **Hard maximum**: 5 minutes for background job completion

If a research pass times out, the system will:
1. Continue with remaining passes (graceful degradation)
2. Mark the brief with `isPartialData: true`
3. Set `confidenceRating: LOW` if multiple passes fail
4. Include available results in the brief

---

## Rate Limiting

The API implements automatic retry with exponential backoff for rate-limited requests from the Perplexity API:

- **Max retries**: 3 attempts
- **Initial delay**: 1 second
- **Max delay**: 10 seconds
- **Backoff factor**: 2x

---

## Changelog

### 2025-12-11 - Perplexity Research Quality Enhancement

**Added:**
- `website` field to `/api/adhoc` endpoint
- URL validation and normalization
- Website prioritization over email domain
- Multi-pass research strategy
- Improved research source citations

**Changed:**
- Upgraded to Perplexity `sonar-pro` model
- Enhanced error handling with timeout controls
- Improved logging for research operations

---

## Support

For issues or questions about the API, please open an issue on the GitHub repository or contact the development team.
