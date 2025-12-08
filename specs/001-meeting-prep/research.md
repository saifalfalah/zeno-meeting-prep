# Technical Research: Next.js 15 + Tailwind 4 + Neon Postgres Application

## Table of Contents
1. [Vitest Configuration for Next.js 15 App Router](#1-vitest-configuration-for-nextjs-15-app-router)
2. [Neon Postgres Connection Pooling on Vercel](#2-neon-postgres-connection-pooling-on-vercel)
3. [NextAuth v5 with Google Calendar API](#3-nextauth-v5-with-google-calendar-api)
4. [Inngest on Vercel](#4-inngest-on-vercel)
5. [Tailwind CSS 4 with Next.js 15](#5-tailwind-css-4-with-nextjs-15)
6. [Perplexity API](#6-perplexity-api)

---

## 1. Vitest Configuration for Next.js 15 App Router

### Decision Made
Use Vitest with React Testing Library for unit testing synchronous Server and Client Components, with E2E testing (Playwright) for async Server Components. Configure 80%+ code coverage thresholds using v8 coverage provider.

### Rationale
- **Official Support**: Next.js 15 officially documents Vitest integration
- **Performance**: Vitest is significantly faster than Jest due to its Vite-based architecture
- **Server Component Limitation**: Vitest currently does not support async Server Components - this is a known limitation of the testing ecosystem, not a Vitest deficiency
- **Coverage Tooling**: Built-in coverage reporting with threshold enforcement prevents regressions

### Implementation Notes

#### Required Dependencies
```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths @vitest/coverage-v8
```

#### Configuration File (`vitest.config.mts`)
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    }
  },
})
```

#### Mocking Next.js Features

**Mocking `next/headers` (cookies):**
```typescript
// vitest.setup.ts
import { vi } from 'vitest'

vi.mock("next/headers", () => ({
  cookies: () => ({
    get: (name: string) => ({ value: "mocked-cookie" }),
    set: vi.fn(),
  }),
  headers: () => ({
    get: (name: string) => "mocked-header",
  }),
}))
```

**Mocking `next/router`:**
```typescript
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    pathname: '/',
    query: {},
  }),
}))
```

#### Testing Strategy
- **Client Components**: Full unit testing with Vitest + RTL
- **Synchronous Server Components**: Unit testing supported
- **Async Server Components**: Use E2E tests (Playwright)
- **API Routes**: Test with Vitest using mock requests

#### Running Tests
```bash
# Run tests
npx vitest

# Run tests with coverage
npx vitest run --coverage

# Watch mode
npx vitest watch
```

### Alternatives Considered
- **Jest**: More mature ecosystem but significantly slower than Vitest; configuration more complex for Next.js 15
- **Testing Library without Vitest**: Requires additional test runner; Vitest provides better DX
- **E2E only**: Too slow for development feedback loop; expensive to maintain

### References
- [Next.js Official Vitest Guide](https://nextjs.org/docs/app/guides/testing/vitest)
- [Vitest Coverage Configuration](https://vitest.dev/guide/coverage)
- [Setting up Vitest for Next.js 15](https://www.wisp.blog/blog/setting-up-vitest-for-nextjs-15)

---

## 2. Neon Postgres Connection Pooling on Vercel

### Decision Made
Use standard Postgres TCP connection (node-postgres) with connection pooling for Vercel Node.js runtime. Use pooled connection strings (-pooler suffix) to leverage Neon's PgBouncer. For Edge Functions, use @neondatabase/serverless HTTP driver.

### Rationale
- **Vercel Fluid Optimization**: Vercel's new Fluid compute model allows function instances to reuse warm compute and share resources, making connection pooling safe and performant
- **Connection Reuse**: Pay connection cost once and reuse for subsequent queries
- **PgBouncer Efficiency**: 2KB overhead per connection, can handle up to 10,000 concurrent connections
- **Serverless-Optimized**: Designed for high connection count with infrequent/short transactions

### Implementation Notes

#### For Vercel Node.js Functions (Recommended for 2025)

**Installation:**
```bash
npm install pg
```

**Connection Setup:**
```typescript
import { Pool } from 'pg'

// Create pool in global scope (outside request handler)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Use -pooler connection string
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// In your API route/Server Action
export async function GET() {
  const client = await pool.connect()
  try {
    const result = await client.query('SELECT * FROM users')
    return Response.json(result.rows)
  } finally {
    client.release() // Always release back to pool
  }
}
```

**Environment Variable:**
```env
# Use the -pooler connection string from Neon Console
DATABASE_URL=postgresql://user:password@project-name-pooler.region.aws.neon.tech/dbname
```

#### For Vercel Edge Functions

**Installation:**
```bash
npm install @neondatabase/serverless
```

**Usage:**
```typescript
import { neon } from '@neondatabase/serverless'

export const runtime = 'edge'

export async function GET() {
  const sql = neon(process.env.DATABASE_URL!)
  const result = await sql`SELECT * FROM users`
  return Response.json(result)
}
```

#### Connection Pooling Strategy

**PgBouncer Configuration:**
- Neon's built-in pooler uses PgBouncer in transaction mode
- `default_pool_size` determined by compute's `max_connections` setting
- Best for serverless apps with many connections but short transactions

**Pool Size Recommendations:**
- **Vercel Hobby**: 10-20 connections
- **Vercel Pro**: 20-50 connections
- **Enterprise**: Benchmark and adjust based on concurrent request patterns

#### Important Considerations

1. **Connection Lifecycle**: In Fluid compute, connections can be reused across requests to the same function instance
2. **Always Release**: Use try/finally to ensure connections are released back to the pool
3. **Global Pool**: Create pool outside request handler to reuse across invocations
4. **Pooled Strings**: Always use `-pooler` suffix in connection string for PgBouncer

### Alternatives Considered
- **Direct Connections (no pooler)**: Not recommended for serverless; exhausts connection limits quickly
- **Prisma with connection pooling**: Adds overhead; native pg driver is more performant for serverless
- **@neondatabase/serverless for all runtimes**: HTTP driver has higher latency than TCP for warm connections; only optimal for Edge runtime

### Performance Notes
- **Cold Start**: TCP connection has ~50-100ms overhead on cold start
- **Warm Connection**: Near-zero overhead when reusing from pool
- **HTTP Driver (Edge)**: 20-30ms per query regardless of warm/cold
- **Benchmark First**: Test both approaches with your specific workload

### References
- [Neon Vercel Connection Methods](https://neon.com/docs/guides/vercel-connection-methods)
- [Neon Connection Pooling Documentation](https://neon.com/docs/connect/connection-pooling)
- [Vercel Connection Pooling Guide](https://vercel.com/guides/connection-pooling-with-serverless-functions)

---

## 3. NextAuth v5 with Google Calendar API

### Decision Made
Use NextAuth v5 (Auth.js) with JWT session strategy, implementing automatic token refresh in jwt() callback. Store access_token, refresh_token, and expires_at in JWT. Include Google Calendar scope and configure for offline access.

### Rationale
- **Serverless-Friendly**: JWT strategy doesn't require database queries for session validation
- **Automatic Refresh**: Token refresh logic in jwt() callback ensures valid tokens for API calls
- **Official Pattern**: Auth.js documentation provides complete reference implementation
- **Webhook Support**: Refreshed tokens available for webhook handlers that need Calendar API access

### Implementation Notes

#### Installation
```bash
npm install next-auth@beta
```

#### Auth.js Configuration (`auth.ts`)
```typescript
import NextAuth, { type User } from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      // Critical: Request offline access and force consent to get refresh token
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/calendar",
            "https://www.googleapis.com/auth/calendar.events"
          ].join(" ")
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      // First-time login: save tokens from OAuth provider
      if (account) {
        return {
          ...token,
          access_token: account.access_token,
          expires_at: account.expires_at,
          refresh_token: account.refresh_token,
        }
      }

      // Subsequent logins: check if token is still valid
      if (Date.now() < (token.expires_at as number) * 1000) {
        return token
      }

      // Token expired: refresh it
      try {
        const response = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: process.env.AUTH_GOOGLE_ID!,
            client_secret: process.env.AUTH_GOOGLE_SECRET!,
            grant_type: "refresh_token",
            refresh_token: token.refresh_token as string,
          }),
        })

        const tokensOrError = await response.json()

        if (!response.ok) throw tokensOrError

        const newTokens = tokensOrError as {
          access_token: string
          expires_in: number
          refresh_token?: string
        }

        return {
          ...token,
          access_token: newTokens.access_token,
          expires_at: Math.floor(Date.now() / 1000 + newTokens.expires_in),
          // Google may not issue new refresh token; preserve existing
          refresh_token: newTokens.refresh_token ?? token.refresh_token,
        }
      } catch (error) {
        console.error("Error refreshing access_token", error)
        // Return error to handle in app
        return { ...token, error: "RefreshAccessTokenError" }
      }
    },

    async session({ session, token }) {
      // Make tokens available in session
      session.access_token = token.access_token as string
      session.error = token.error as string | undefined
      return session
    }
  }
})
```

#### TypeScript Types
```typescript
// types/next-auth.d.ts
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    access_token?: string
    error?: string
    user: {
      id: string
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    access_token?: string
    expires_at?: number
    refresh_token?: string
    error?: string
  }
}
```

#### Using Calendar API
```typescript
import { auth } from "@/auth"

export async function createCalendarEvent() {
  const session = await auth()

  if (!session?.access_token) {
    throw new Error("No access token")
  }

  if (session.error === "RefreshAccessTokenError") {
    throw new Error("Token refresh failed - user needs to re-authenticate")
  }

  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: "Meeting",
        start: { dateTime: "2025-12-08T10:00:00Z" },
        end: { dateTime: "2025-12-08T11:00:00Z" },
      }),
    }
  )

  return response.json()
}
```

#### Webhook Token Handling
```typescript
// For webhooks that need valid tokens
export async function POST(req: Request) {
  const session = await auth()

  // Token is automatically refreshed if expired
  const accessToken = session?.access_token

  // Use token for Calendar API calls
  // ...
}
```

### Important Considerations

1. **Refresh Token Issued Once**: Google only provides refresh_token on first consent. If lost, user must re-authenticate
2. **Scope Changes**: Adding new scopes requires `prompt: "consent"` to force re-authorization
3. **Token Security**: Store tokens in httpOnly cookies (JWT strategy default)
4. **Error Handling**: Check for `RefreshAccessTokenError` and prompt re-authentication

### Alternatives Considered
- **Database Session Strategy**: Requires database query on every session check; slower for serverless
- **Custom OAuth Implementation**: Reinventing the wheel; Auth.js provides battle-tested solution
- **Storing Tokens in Database**: Possible with database adapter, but adds complexity and latency

### References
- [Auth.js Refresh Token Rotation](https://authjs.dev/guides/refresh-token-rotation)
- [Auth.js Google Provider](https://authjs.dev/getting-started/providers/google)
- [NextAuth v5 Migration Guide](https://authjs.dev/getting-started/migrating-to-v5)

---

## 4. Inngest on Vercel

### Decision Made
Use Inngest as the background job orchestration platform for long-running research tasks (2-5 minutes). Structure jobs with `step.run()` for automatic retries per step, implement custom retry logic with `RetryAfterError` for rate limits, and use `onFailure` handlers for error notifications.

### Rationale
- **Vercel Native**: Built for serverless; no connection management required
- **Step-Based Retries**: Each `step.run()` has independent retry counter, preventing duplicate work
- **State Persistence**: Inngest persists step output across retries and serverless cold starts
- **Built for Long Tasks**: Can pause and resume execution, surviving serverless function timeouts
- **Observability**: Built-in monitoring and logging for all function executions

### Implementation Notes

#### Installation
```bash
npm install inngest
```

#### Setup Inngest Client (`src/inngest/client.ts`)
```typescript
import { Inngest } from "inngest"

export const inngest = new Inngest({
  id: "zeno-meeting-prep",
  name: "Zeno Meeting Prep",
})
```

#### Define Background Function (`src/inngest/functions/research.ts`)
```typescript
import { inngest } from "../client"
import { NonRetriableError, RetryAfterError } from "inngest"

export const researchProspect = inngest.createFunction(
  {
    id: "research-prospect",
    name: "Research Prospect Company",
    retries: 4, // Each step retried up to 4 times (5 total attempts)
    onFailure: async ({ error, event, step }) => {
      // Send notification about failure
      await step.run("send-failure-notification", async () => {
        await sendSlackNotification({
          message: `Research failed for ${event.data.prospectId}: ${error.message}`,
        })
      })
    },
  },
  { event: "research/prospect.requested" },
  async ({ event, step }) => {
    const { prospectId, companyName } = event.data

    // Step 1: Research company with Perplexity
    const companyResearch = await step.run("research-company", async () => {
      try {
        const response = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.1-sonar-large-128k-online",
            messages: [
              {
                role: "user",
                content: `Research ${companyName}. Provide recent news, funding, key executives.`
              }
            ],
          }),
        })

        if (response.status === 429) {
          // Rate limited - retry after delay
          throw new RetryAfterError(
            "Rate limited by Perplexity API",
            "60s" // Retry after 60 seconds
          )
        }

        if (!response.ok) {
          const error = await response.json()
          // Don't retry 4xx errors (except 429)
          if (response.status >= 400 && response.status < 500) {
            throw new NonRetriableError(`API error: ${error.message}`)
          }
          throw new Error(`API error: ${error.message}`)
        }

        return response.json()
      } catch (error) {
        // Rethrow Inngest errors as-is
        if (error instanceof RetryAfterError || error instanceof NonRetriableError) {
          throw error
        }
        // Network errors should be retried
        throw error
      }
    })

    // Step 2: Analyze and structure data
    const analysis = await step.run("analyze-research", async () => {
      // This runs only after step 1 succeeds
      return analyzeCompanyData(companyResearch)
    })

    // Step 3: Save to database
    const saved = await step.run("save-to-database", async () => {
      // This runs only after step 2 succeeds
      // If this fails, steps 1 & 2 won't re-run on retry
      await saveResearchToDatabase(prospectId, analysis)
      return { success: true }
    })

    // Step 4: Wait for user review (can pause for hours/days)
    const reviewed = await step.waitForEvent("research/prospect.reviewed", {
      timeout: "7d",
      match: "data.prospectId",
    })

    // Step 5: Send to CRM if approved
    if (reviewed?.data.approved) {
      await step.run("sync-to-crm", async () => {
        await syncToCRM(prospectId, analysis)
      })
    }

    return { prospectId, status: "completed" }
  }
)
```

#### API Route for Inngest (`src/app/api/inngest/route.ts`)
```typescript
import { serve } from "inngest/next"
import { inngest } from "@/inngest/client"
import { researchProspect } from "@/inngest/functions/research"

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    researchProspect,
    // Add other functions here
  ],
})
```

#### Triggering Jobs
```typescript
import { inngest } from "@/inngest/client"

// From Server Action or API Route
export async function startResearch(prospectId: string, companyName: string) {
  await inngest.send({
    name: "research/prospect.requested",
    data: {
      prospectId,
      companyName,
    },
  })
}
```

#### Advanced Patterns

**Parallel Execution:**
```typescript
const [linkedin, twitter, news] = await Promise.all([
  step.run("research-linkedin", () => researchLinkedIn(company)),
  step.run("research-twitter", () => researchTwitter(company)),
  step.run("research-news", () => researchNews(company)),
])
```

**Sleep/Delay:**
```typescript
// Wait 1 hour before follow-up
await step.sleep("wait-before-followup", "1h")

// Wait until specific time
await step.sleepUntil("wait-until-morning", "2025-12-08T09:00:00Z")
```

**Error Notifications:**
```typescript
import { NonRetriableError } from "inngest"

if (invalidInput) {
  // Don't retry - fail immediately
  throw new NonRetriableError("Invalid company name provided")
}
```

### Monitoring and Debugging

**Inngest Dev Server:**
```bash
npx inngest-cli dev
```

Access dashboard at `http://localhost:8288` to:
- View function runs in real-time
- See step-by-step execution
- Inspect payloads and errors
- Manually trigger events

**Production Monitoring:**
- Inngest Cloud provides built-in dashboard
- View metrics: success rate, duration, failure reasons
- Set up alerts for high failure rates

### Best Practices

1. **Granular Steps**: Break work into small, focused steps for better retry granularity
2. **Idempotent Steps**: Ensure steps can be safely re-run (no duplicate database inserts)
3. **Error Classification**: Use `NonRetriableError` for permanent failures, `RetryAfterError` for rate limits
4. **Timeouts**: Set realistic timeouts for `step.waitForEvent()`
5. **Cleanup**: Use `onFailure` to clean up partial work if needed

### Alternatives Considered
- **Vercel Cron Jobs**: No retry logic, no step orchestration, limited to scheduled tasks
- **AWS Step Functions**: More complex setup, not serverless-native, higher operational overhead
- **BullMQ**: Requires Redis instance, connection pooling complexity in serverless
- **Temporal**: Heavyweight, requires separate infrastructure, overkill for use case

### References
- [Inngest Background Jobs Guide](https://www.inngest.com/docs/guides/background-jobs)
- [Inngest Error Handling & Retries](https://www.inngest.com/docs/guides/error-handling)
- [Inngest Vercel Integration](https://www.inngest.com/blog/vercel-integration)
- [Long-running Functions on Vercel](https://www.inngest.com/blog/vercel-long-running-background-functions)

---

## 5. Tailwind CSS 4 with Next.js 15

### Decision Made
Use Tailwind CSS 4 with Next.js 15 (requires Next.js 15.2+). Migrate to CSS-first configuration using `@theme` directive in CSS instead of `tailwind.config.js`. Use `@import` instead of `@tailwind` directives.

### Rationale
- **Official Support**: Tailwind 4 fully supported in Next.js 15.2+ (released January 2025)
- **Simplified Setup**: No config file required for default setup; auto-scanning enabled
- **Modern CSS**: Leverages native CSS features like `@property` and `color-mix()`
- **Performance**: Improved build times and smaller CSS output
- **Future-Proof**: Tailwind 4 is the current major version going forward

### Implementation Notes

#### Browser Requirements
Tailwind CSS v4 requires:
- Safari 16.4+
- Chrome 111+
- Firefox 128+

If you need to support older browsers, stick with Tailwind 3.x.

#### New Project Setup

```bash
# Create Next.js 15 project with Tailwind
npx create-next-app@latest my-project --ts --tailwind --eslint --app

# Install Tailwind 4
npm install tailwindcss@next @tailwindcss/postcss@next postcss@latest
```

#### Migration from Tailwind 3 to 4

**1. Update Dependencies:**
```bash
npm install tailwindcss@next @tailwindcss/postcss@next
```

**2. Update PostCSS Config (`postcss.config.mjs`):**
```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {}
    // Remove postcss-import and autoprefixer - now built-in
  }
}
```

**3. Update CSS File (`app/globals.css`):**

**Before (Tailwind 3):**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**After (Tailwind 4):**
```css
@import "tailwindcss";

/* Custom theme configuration */
@theme {
  --color-primary: #3b82f6;
  --color-secondary: #8b5cf6;

  --font-heading: "Inter", sans-serif;

  --breakpoint-xs: 375px;
  --breakpoint-3xl: 1920px;
}
```

**4. Remove/Migrate `tailwind.config.js`:**

Tailwind 4 auto-scans your project for class usage. If you need custom configuration, move it to CSS:

**Before (tailwind.config.js):**
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
      },
      screens: {
        '3xl': '1920px',
      }
    }
  }
}
```

**After (globals.css):**
```css
@theme {
  --color-primary: #3b82f6;
  --breakpoint-3xl: 1920px;
}
```

#### Key Breaking Changes

1. **Content Scanning**: Automatic - no `content` array needed
2. **Import Syntax**: Use `@import "tailwindcss"` instead of `@tailwind` directives
3. **Configuration**: CSS-first via `@theme` instead of JS config
4. **Preflight Changes**:
   - Placeholder text now uses `currentColor` at 50% opacity (was `gray-400`)
   - Buttons use `cursor: default` instead of `cursor: pointer`
5. **Transform Properties**: `transition-transform` now uses `translate`, `scale`, `rotate` custom properties
6. **PostCSS Plugins**: `postcss-import` and `autoprefixer` now built-in - remove them

#### Using with shadcn/ui

Tailwind 4 works with shadcn/ui components. The community has created guides for setting up both together.

#### Development
```bash
npm run dev
```

Tailwind 4 includes automatic source detection and rebuilds on file changes.

### Important Considerations

1. **No CSS Preprocessors**: Tailwind 4 is a complete CSS build tool; don't use with Sass/Less/Stylus
2. **Migration Tool**: Tailwind provides automated migration tool (requires Node.js 20+)
3. **Gradual Adoption**: Can run Tailwind 3 and 4 side-by-side during migration if needed
4. **Breaking Changes**: Test thoroughly - some utilities behave differently

### Alternatives Considered
- **Stick with Tailwind 3**: Supported but no new features; will eventually need to migrate
- **Vanilla CSS**: Too much custom CSS to maintain; loses utility-first benefits
- **CSS Modules**: Less developer productivity; no design system consistency
- **Other CSS Frameworks**: None match Tailwind's ecosystem and Next.js integration

### References
- [Tailwind CSS 4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
- [Moving from Tailwind 3 to 4 in Next.js 15](https://www.9thco.com/labs/moving-from-tailwind-3-to-tailwind-4)
- [Next.js Tailwind CSS Installation](https://tailwindcss.com/docs/guides/nextjs)
- [Tailwind v4 Complete Migration Guide](https://medium.com/@mernstackdevbykevin/tailwind-css-v4-0-complete-migration-guide-breaking-changes-you-need-to-know-7f99944a9f95)

---

## 6. Perplexity API

### Decision Made
Use Perplexity API with the `llama-3.1-sonar-large-128k-online` model for company/prospect research. Implement exponential backoff for rate limit handling, cache responses for 24 hours, and structure queries to maximize search context.

### Rationale
- **Real-Time Data**: Online models provide current information (news, funding, recent changes)
- **Structured Research**: Built-in web search with citation support
- **Cost-Effective**: More affordable than GPT-4 for research tasks with comparable quality
- **Rate Limits**: Generous limits with clear tier system

### Implementation Notes

#### Model Selection

**Recommended for Research:**
- `llama-3.1-sonar-large-128k-online` - Best quality, includes web search, 128k context
- `llama-3.1-sonar-huge-128k-online` - Highest quality, more expensive

**For Basic Queries:**
- `llama-3.1-sonar-small-128k-online` - Faster, cheaper, good for simple lookups

#### Pricing (2025)

**Cost Structure:**
- Token costs: $0.2 to $5 per 1M tokens depending on model
- Request fees: Additional fee for Sonar models (search-enabled)
- Pro/Max subscribers: $5 monthly API credit included

**Approximate Costs:**
- `sonar-large-128k-online`: ~$1-3 per 1M tokens + request fee
- Average research query: ~2000 tokens = ~$0.003-0.006 per query

#### Basic Implementation

```typescript
interface PerplexityResponse {
  id: string
  model: string
  choices: Array<{
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export async function researchCompany(companyName: string) {
  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.1-sonar-large-128k-online",
      messages: [
        {
          role: "system",
          content: "You are a business research assistant. Provide factual, cited information."
        },
        {
          role: "user",
          content: `Research ${companyName}. Include:
          1. Recent news and developments (last 6 months)
          2. Funding rounds and investors
          3. Key executives and leadership
          4. Products/services and market position
          5. Company size and growth trajectory

          Cite all sources.`
        }
      ],
      temperature: 0.2, // Lower = more factual
      max_tokens: 2000,
      // Optional: filter to reliable sources
      search_domain_filter: [
        "techcrunch.com",
        "bloomberg.com",
        "reuters.com",
        "crunchbase.com"
      ],
      search_context_size: 10, // Number of search results to use
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Perplexity API error: ${error.message}`)
  }

  const data: PerplexityResponse = await response.json()
  return data.choices[0].message.content
}
```

#### Rate Limit Handling

```typescript
import { RetryAfterError } from "inngest"

export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url, options)

    // Rate limited
    if (response.status === 429) {
      const retryAfter = response.headers.get("retry-after")
      const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000

      // If using Inngest, throw RetryAfterError
      if (attempt === maxRetries - 1) {
        throw new RetryAfterError(
          "Rate limited by Perplexity API",
          `${waitTime / 1000}s`
        )
      }

      // Otherwise, wait and retry
      await new Promise(resolve => setTimeout(resolve, waitTime))
      continue
    }

    // Other errors
    if (!response.ok) {
      const error = await response.json()
      throw new Error(`API error ${response.status}: ${error.message}`)
    }

    return response
  }

  throw new Error("Max retries exceeded")
}
```

#### Response Caching

```typescript
import { unstable_cache } from "next/cache"

// Cache for 24 hours
export const getCachedCompanyResearch = unstable_cache(
  async (companyName: string) => {
    return await researchCompany(companyName)
  },
  ["company-research"],
  {
    revalidate: 86400, // 24 hours
    tags: ["research"],
  }
)

// Usage
const research = await getCachedCompanyResearch("Acme Corp")
```

#### Monitoring Usage

```typescript
export async function trackAPIUsage(
  response: PerplexityResponse,
  companyName: string
) {
  await db.insert(apiUsage).values({
    provider: "perplexity",
    model: response.model,
    prompt_tokens: response.usage.prompt_tokens,
    completion_tokens: response.usage.completion_tokens,
    total_tokens: response.usage.total_tokens,
    estimated_cost: calculateCost(response),
    metadata: { companyName },
  })
}

function calculateCost(response: PerplexityResponse): number {
  const inputCost = 0.001 // $1 per 1M tokens (example)
  const outputCost = 0.002 // $2 per 1M tokens (example)

  return (
    (response.usage.prompt_tokens / 1_000_000) * inputCost +
    (response.usage.completion_tokens / 1_000_000) * outputCost
  )
}
```

#### Best Practices

1. **Show Citations**: Display sources from Perplexity response to users
2. **Respect Sources**: Follow robots.txt and rate limits for cited sources
3. **Cache Aggressively**: Company data changes slowly; cache for 24h+
4. **Monitor Costs**: Track token usage and set budget alerts
5. **Structured Prompts**: Use numbered lists and clear requirements for consistent output
6. **Temperature Control**: Use low temperature (0.2-0.3) for factual research
7. **Search Filters**: Use `search_domain_filter` for high-quality sources only
8. **Error Handling**: Implement exponential backoff and graceful degradation

#### Rate Limits by Tier

Exact limits vary by tier (check your API settings page):
- **Standard**: ~50 requests/minute
- **Pro**: ~100 requests/minute
- **Enterprise**: Custom limits

Submit rate limit increase request for higher limits.

#### Advanced Configuration

```typescript
const advancedQuery = {
  model: "llama-3.1-sonar-large-128k-online",
  messages: [...],
  temperature: 0.2,
  max_tokens: 2000,
  top_p: 0.9,
  search_context_size: 10, // Number of search results
  search_domain_filter: ["techcrunch.com"], // Optional: specific domains
  // return_images: true, // Include relevant images
  // return_related_questions: true, // Get follow-up questions
}
```

### Alternatives Considered
- **GPT-4 with Browsing**: More expensive, slower, less specialized for research
- **Google Custom Search API**: Requires separate LLM for analysis, more complex
- **Manual Research**: Not scalable, too time-consuming
- **Scrapy/Crawling**: Complex, maintenance overhead, legal concerns

### Cost Optimization Strategies

1. **Batch Requests**: Research multiple prospects in one longer query
2. **Incremental Updates**: Only re-research when significant time has passed
3. **Selective Deep Dives**: Use cheaper model for initial triage, expensive model for priority prospects
4. **Smart Caching**: Cache by company domain, not exact query

### References
- [Perplexity API Pricing](https://docs.perplexity.ai/getting-started/pricing)
- [Perplexity Rate Limits & Usage Tiers](https://docs.perplexity.ai/guides/usage-tiers)
- [Perplexity API Documentation](https://www.byteplus.com/en/topic/536561)
- [Perplexity API Best Practices](https://zuplo.com/learning-center/perplexity-api)

---

## Summary of Key Decisions

| Component | Technology Choice | Primary Rationale |
|-----------|------------------|-------------------|
| **Testing** | Vitest + Playwright | Fast unit tests + E2E for async components |
| **Database** | Neon Postgres with TCP pooling | Optimized for Vercel Fluid compute model |
| **Auth** | NextAuth v5 (Auth.js) | JWT strategy with auto token refresh |
| **Background Jobs** | Inngest | Step-based retries, serverless-native |
| **Styling** | Tailwind CSS 4 | Modern CSS, official Next.js 15.2+ support |
| **Research API** | Perplexity API | Real-time data, cost-effective, citation support |

## Next Steps

1. **Set up testing infrastructure**: Configure Vitest with coverage thresholds
2. **Configure database connection**: Implement connection pooling with Neon
3. **Implement authentication**: Set up NextAuth v5 with Google Calendar scopes
4. **Create Inngest functions**: Build research job orchestration
5. **Migrate to Tailwind 4**: Update CSS configuration and test components
6. **Integrate Perplexity API**: Build research service with caching and rate limiting

## Additional Resources

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Vercel Deployment Best Practices](https://vercel.com/docs/concepts/deployments/overview)
- [Neon Serverless Postgres Guides](https://neon.com/docs/guides)
- [Inngest Documentation](https://www.inngest.com/docs)
- [Auth.js Documentation](https://authjs.dev)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)

---

**Document Version**: 1.0
**Last Updated**: December 7, 2025
**Research Conducted By**: Claude Code (Anthropic)
