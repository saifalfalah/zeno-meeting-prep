# Zeno Meeting Prep - User Guide

## Table of Contents

- [Getting Started](#getting-started)
- [Creating Ad-Hoc Research Requests](#creating-ad-hoc-research-requests)
- [Understanding Research Briefs](#understanding-research-briefs)
- [Tips for Best Results](#tips-for-best-results)
- [Troubleshooting](#troubleshooting)

---

## Getting Started

Zeno Meeting Prep automatically generates detailed research briefs for your sales meetings. You can trigger research in two ways:

1. **Automatic**: Connect your Google Calendar - research briefs are generated automatically for meetings with external attendees
2. **Manual**: Create ad-hoc research requests for prospects you want to research on-demand

This guide focuses on creating manual ad-hoc research requests.

---

## Creating Ad-Hoc Research Requests

### Accessing the Form

1. Navigate to the **Ad-Hoc Research** page from the main menu
2. Click the **"New Research Request"** button
3. The research request form will appear

### Form Fields

#### Required Field

- **Campaign**: Select which sales campaign this research request belongs to
  - You must have at least one active campaign to create research requests
  - Create campaigns in the Settings page if needed

#### Research Target Fields

You must provide **at least one** of the following fields:

| Field | Description | Example |
|-------|-------------|---------|
| **Prospect Name** | Name of the person you're meeting with | "John Smith" |
| **Company Name** | Name of their company | "Acme Corporation" |
| **Email Address** | Prospect's email address | "john@acmecorp.com" |
| **Company Website** | Company's website URL | "https://acmecorp.com" |

### Using the Website Field ⭐ NEW

The **Company Website** field is a powerful new feature that significantly improves research quality.

#### Why Provide a Website?

When you provide an explicit company website URL:

✅ **Higher Quality Research**: The system directly searches and analyzes the company's actual website for the most accurate, up-to-date information

✅ **Better Source Citations**: Research briefs include verifiable citations from the company website

✅ **Correct Company Attribution**: Useful when the prospect's email domain doesn't match their actual company (see examples below)

✅ **Multi-Source Insights**: The system performs focused research on the website, company news, and prospect background

#### Website Prioritization Logic

**Important**: When you provide both an email address AND a website URL, the website URL takes priority for research purposes.

**Example Scenarios:**

**Scenario 1: Subsidiary Email**
```
Prospect Name: Alice Johnson
Email: alice@subsidiary-llc.com
Website: https://parent-company.com
```
✅ Research will focus on `parent-company.com` even though the email is from `subsidiary-llc.com`

**Scenario 2: Personal Email**
```
Prospect Name: Bob Williams
Email: bob@gmail.com
Website: https://techstartup.io
```
✅ Research will focus on `techstartup.io` since the email doesn't provide company information

**Scenario 3: Email Only (No Website)**
```
Prospect Name: Carol Davis
Email: carol@example.com
```
⚠️ Research will use the domain extracted from email (`example.com`), which may be less reliable

### URL Format Guidelines

The website field accepts multiple URL formats:

| Format | Accepted | Normalized To |
|--------|----------|---------------|
| `https://company.com` | ✅ Yes | `https://company.com` |
| `http://company.com` | ✅ Yes | `http://company.com` |
| `company.com` | ✅ Yes | `https://company.com` |
| `www.company.com` | ✅ Yes | `https://www.company.com` |
| `not-a-url` | ❌ No | *(validation error)* |

💡 **Tip**: If you omit the `https://` prefix, the system will automatically add it for you.

### Complete Form Example

**Recommended approach (all fields provided):**

```
Campaign: Q4 2025 Enterprise Sales
Prospect Name: Sarah Chen
Company Name: InnovateTech Solutions
Email: sarah.chen@innovatetech.io
Website: https://innovatetech.io
```

This provides maximum context for high-quality research.

**Minimal approach (website only):**

```
Campaign: Q4 2025 Enterprise Sales
Company Name: InnovateTech Solutions
Website: https://innovatetech.io
```

This is sufficient if you don't have prospect details yet.

### Submitting the Request

1. Fill in at least the **Campaign** and one research target field
2. Click **"Submit"** or **"Create Research Request"**
3. You'll be redirected to the ad-hoc research list
4. The research request status will show as **"Pending"** or **"Processing"**

---

## Understanding Research Briefs

### Research Process

Once you submit a request, the system performs a **multi-pass research strategy**:

1. **Company Website Pass** (60s max)
   - Focuses on content from the specified website
   - Gathers official company information
   - Extracts key facts and recent updates

2. **Company News & Context Pass** (60s max)
   - Searches broader web for company news
   - Finds recent announcements and press releases
   - Identifies industry trends and competitors

3. **Prospect Background Pass** (60s max)
   - Searches for prospect's professional information
   - Checks LinkedIn and professional networks
   - Finds relevant career history and expertise

**Total research time**: Typically 45 seconds, maximum 3 minutes

### Research Brief Sections

A completed research brief includes:

1. **Company at a Glance**
   - Industry, employee count, funding stage
   - Headquarters location
   - Key facts and metrics

2. **Prospect at a Glance**
   - Current title and role
   - Reports to (if available)
   - Team size and responsibilities
   - Professional background

3. **Recent Signals**
   - Recent news and developments
   - Hiring signals
   - Product launches or updates
   - Funding rounds or acquisitions

4. **Deep Dive**
   - Detailed company analysis
   - Business model insights
   - Challenges and opportunities

5. **Call Strategy**
   - Recommended talking points
   - Questions to ask
   - Value propositions to highlight
   - Potential objections and responses

6. **Sources**
   - List of all sources cited
   - URL links to original content
   - Organized by research pass

### Confidence Ratings

Each brief includes a confidence rating:

- **HIGH**: All research passes completed successfully with comprehensive data
- **MEDIUM**: Most research passes completed, some gaps in data
- **LOW**: Multiple passes failed or insufficient data found

💡 **Tip**: HIGH confidence briefs with explicit websites typically provide the best call preparation.

---

## Tips for Best Results

### 1. Always Provide the Website When Possible

**❌ Don't rely on email domain alone:**
```
Email: john@company.com
Website: (empty)
```

**✅ Provide explicit website:**
```
Email: john@company.com
Website: https://company.com
```

### 2. Use Canonical Company Domains

**❌ Avoid subdomains:**
```
Website: https://blog.company.com
```

**✅ Use main domain:**
```
Website: https://company.com
```

### 3. Verify URLs Before Submitting

- Double-check spelling of company names in URLs
- Ensure the website is accessible (not behind a paywall or login)
- Use the official company website, not third-party review sites

### 4. Provide Context with Multiple Fields

The more information you provide, the better the research:

**Good:**
```
Prospect Name: Jane Doe
Email: jane@company.com
Website: https://company.com
```

**Better:**
```
Prospect Name: Jane Doe
Company Name: Acme Corp
Email: jane@acmecorp.com
Website: https://acmecorp.com
```

### 5. Handle Edge Cases Appropriately

**Prospect uses parent company email:**
```
Email: john@parentco.com
Website: https://subsidiary.com
(Research will focus on subsidiary.com)
```

**Prospect uses personal email:**
```
Email: john@gmail.com
Website: https://theircompany.com
(Research will focus on theircompany.com)
```

---

## Research Quality Indicators

### Signs of High-Quality Research

✅ Multiple verifiable sources cited (5-10+ sources)
✅ Content directly from company website included
✅ Recent news and updates (within last 6 months)
✅ Specific metrics and facts (employee count, funding, etc.)
✅ HIGH confidence rating

### Signs You May Need to Refine Your Request

⚠️ Very few sources cited (1-2 sources)
⚠️ Generic or outdated information
⚠️ LOW confidence rating
⚠️ "Insufficient data" errors

**How to improve:**
1. Verify the website URL is correct and accessible
2. Ensure the company has an online presence
3. Try providing additional context (company name, prospect name)
4. For very small or stealth companies, research may be limited

---

## Troubleshooting

### "Invalid website URL" Error

**Problem**: The URL format is not recognized

**Solution**:
- Ensure the URL is a valid domain (e.g., `company.com`)
- Remove extra spaces or special characters
- Use format: `https://company.com` or just `company.com`

### "At least one field must be provided" Error

**Problem**: No research target fields are filled in

**Solution**:
- Provide at least ONE of: Prospect Name, Company Name, Email, or Website
- The Campaign field alone is not sufficient

### Research Brief Shows LOW Confidence

**Problem**: Multiple research passes failed or returned insufficient data

**Possible causes**:
- Website URL is incorrect or inaccessible
- Company has minimal online presence
- Company website is behind authentication
- Network or API timeout issues

**Solution**:
- Verify the website URL is correct
- Try using a different URL (e.g., main domain instead of subdomain)
- Check if the company has a public website
- Wait a few minutes and try again if it was a temporary issue

### Research Takes Too Long (Timeout)

**Problem**: Research doesn't complete within expected time

**Expected behavior**:
- Normal research: 30-60 seconds
- Maximum allowed: 3 minutes
- Hard timeout: 5 minutes

**What happens on timeout**:
- System continues with completed research passes
- Brief marked with `isPartialData: true`
- Available research included in brief
- You can still use the partial results

**Solution**:
- This is often temporary - the system is working as designed
- Partial results are usually sufficient for call preparation
- If consistently timing out, the website may be slow or inaccessible

### "No active campaigns found" Error

**Problem**: Cannot create research request without a campaign

**Solution**:
1. Navigate to Settings
2. Click "Create Campaign"
3. Fill in campaign details
4. Ensure campaign status is "Active"
5. Return to ad-hoc research form

---

## Frequently Asked Questions

### Q: Can I use the website field without providing an email?

**A**: Yes! You can provide just the website field (along with company/prospect name). This is useful when you have company information but no contact email yet.

### Q: What if the prospect's email domain is different from their company website?

**A**: This is exactly why we added the website field! Provide both - the website URL will take priority for research, ensuring accurate company information.

### Q: How long does research take?

**A**: Typically 30-60 seconds. The system performs three research passes with a maximum of 3 minutes total time. If research is taking longer, you'll receive partial results.

### Q: Can I update the website after submitting?

**A**: Currently, you need to create a new research request if you want to use a different website. We recommend verifying the URL before submitting.

### Q: What happens if I provide a wrong website URL?

**A**: The research will be performed on that website, which may result in incorrect or irrelevant information. Always verify URLs before submitting.

### Q: Why is the website field optional?

**A**: While optional, providing a website significantly improves research quality. If you don't provide one, the system will extract the domain from the email address (if provided) or perform broader research based on company/prospect name.

---

## What's New - December 2025

### ⭐ Enhanced Research Quality

We've upgraded our research system with several improvements:

- **🆕 Website Field**: Explicitly specify company websites for better research
- **🆕 Website Prioritization**: Your specified website takes priority over email domains
- **🆕 Multi-Pass Research**: Three focused research passes for comprehensive insights
- **🆕 Improved Sources**: Better citation and source tracking
- **⚡ Upgraded AI Model**: Now using Perplexity's `sonar-pro` model for higher quality results
- **🔧 Better Error Handling**: Graceful degradation when research passes fail
- **📊 Enhanced Logging**: Better visibility into research process and results

---

## Need Help?

If you're experiencing issues not covered in this guide:

1. Check the [API Documentation](./API.md) for technical details
2. Review the [Google OAuth Setup Guide](./GOOGLE_OAUTH_SETUP.md) for calendar integration
3. Open an issue on the GitHub repository
4. Contact your system administrator

---

**Last Updated**: December 11, 2025
**Version**: 2.0 (Perplexity Research Quality Enhancement)
