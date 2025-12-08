# Quickstart Guide: Pre-Call Intelligence Dashboard

**Feature**: 001-meeting-prep | **Date**: 2025-12-07

This guide helps developers set up the local development environment and understand the implementation workflow for the Pre-Call Intelligence Dashboard.

## Prerequisites

- **Node.js**: v20+ (check with `node --version`)
- **Package Manager**: npm, yarn, or pnpm
- **Database**: Neon Postgres account (free tier available at [neon.tech](https://neon.tech))
- **Google Cloud**: Project with Calendar API enabled
- **APIs**: Perplexity API key, Anthropic API key
- **Inngest**: Free account at [inngest.com](https://inngest.com)

## 1. Environment Setup

### Clone and Install

```bash
cd zeno-meeting-prep
npm install
```

### Environment Variables

Create `.env.local` in the project root:

```bash
# Database (Neon Postgres)
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"
# Use the -pooler connection string for production
DATABASE_URL_POOLER="postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"

# Google OAuth & Calendar API
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
# Scopes needed: calendar.readonly, userinfo.email, userinfo.profile

# Perplexity API
PERPLEXITY_API_KEY="pplx-xxxxxxxxxxxx"

# Anthropic Claude API
ANTHROPIC_API_KEY="sk-ant-xxxxxxxxxxxx"

# Inngest
INNGEST_EVENT_KEY="your-inngest-event-key"
INNGEST_SIGNING_KEY="your-inngest-signing-key"

# Application
NODE_ENV="development"
```

### Google Cloud Console Setup

1. **Create OAuth Client**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Google Calendar API
   - Create OAuth 2.0 credentials (Web application)
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
   - Copy Client ID and Client Secret to `.env.local`

2. **Configure OAuth Consent Screen**:
   - Add scopes: `calendar.readonly`, `userinfo.email`, `userinfo.profile`
   - Add test users (your email) during development

### Neon Postgres Setup

1. Create a new Neon project at [neon.tech](https://neon.tech)
2. Copy the connection string (both regular and `-pooler` variants)
3. Add to `.env.local`

### Inngest Setup

1. Create account at [inngest.com](https://inngest.com)
2. Create new app
3. Copy Event Key and Signing Key to `.env.local`
4. For local development, run Inngest Dev Server (see below)

## 2. Database Setup

### Run Migrations

```bash
# Generate migration files from schema
npm run db:generate

# Apply migrations to database
npm run db:migrate

# Optional: Open Drizzle Studio to view database
npm run db:studio
```

### Seed Development Data (Optional)

```bash
npm run db:seed
```

This creates:
- Test user account
- Sample campaign
- Mock meetings with external attendees
- Sample research briefs

## 3. Development Workflow

### Start Development Server

```bash
# Terminal 1: Next.js development server
npm run dev

# Terminal 2: Inngest Dev Server (for background jobs)
npx inngest-cli dev
```

The app will be available at:
- **Next.js**: http://localhost:3000
- **Inngest Dev UI**: http://localhost:8288

### First-Time Setup Flow

1. Navigate to http://localhost:3000
2. Click "Sign in with Google"
3. Authorize calendar access
4. Complete campaign setup wizard:
   - Select calendar to monitor
   - Enter company details
   - Define offering
   - Activate campaign
5. Webhook subscription is created automatically

### Triggering Background Jobs Manually

**Option 1: Via Inngest Dev UI**
1. Open http://localhost:8288
2. Go to "Events" tab
3. Send test event:

```json
{
  "name": "research/generate.requested",
  "data": {
    "type": "adhoc",
    "adHocRequestId": "uuid-here",
    "campaignId": "uuid-here",
    "prospects": [
      {
        "email": "test@example.com",
        "name": "Test Prospect",
        "companyDomain": "example.com"
      }
    ],
    "requestedAt": "2025-12-07T10:00:00Z"
  }
}
```

**Option 2: Via API Route**
```bash
curl -X POST http://localhost:3000/api/research/trigger \
  -H "Content-Type: application/json" \
  -d '{"meetingId": "uuid-here"}'
```

### Testing Webhook Locally

Google Calendar webhooks require a publicly accessible HTTPS URL. For local testing:

**Option 1: Use ngrok**
```bash
ngrok http 3000
# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Update Google Calendar webhook URL to: https://abc123.ngrok.io/api/webhooks/google-calendar
```

**Option 2: Skip webhook during development**
- Manually trigger research for test meetings via API
- Create meetings directly in database for testing
- Use Inngest Dev UI to simulate webhook events

## 4. Project Structure Overview

```text
app/
├── (auth)/              # Authentication pages (login, callback)
├── (dashboard)/         # Protected dashboard pages
│   ├── page.tsx         # Main calendar view
│   ├── meetings/[id]/   # Meeting detail + research brief
│   ├── ad-hoc/          # Ad-hoc research interface
│   └── settings/        # Campaign management
└── api/                 # API routes
    ├── auth/            # NextAuth routes
    ├── campaigns/       # Campaign CRUD
    ├── meetings/        # Meeting endpoints
    ├── research/        # Research endpoints
    ├── adhoc/           # Ad-hoc research endpoints
    ├── webhooks/        # Google Calendar webhook
    └── inngest/         # Inngest background job endpoint

components/
├── ui/                  # Base components (Button, Card, Badge, etc.)
├── calendar/            # Calendar view components
├── brief/               # Research brief components
├── campaign/            # Campaign setup components
└── layout/              # Layout components

lib/
├── db/                  # Database (Drizzle schema + queries)
├── services/            # Business logic (Google, Perplexity, Claude, Research, PDF)
├── inngest/             # Inngest functions
├── auth/                # NextAuth configuration
└── utils/               # Shared utilities

__tests__/               # Tests (unit, integration, contract)
e2e/                     # Playwright E2E tests
```

## 5. Key Implementation Patterns

### Server Components vs Client Components

**Use Server Components for**:
- Fetching data from database
- Calling external APIs with secrets
- Initial page rendering with data

**Use Client Components for**:
- Interactive UI (buttons, forms, modals)
- State management (useState, useReducer)
- Browser-only APIs (localStorage, geolocation)

### Database Queries

Always use Drizzle query functions for type safety:

```typescript
// ✅ Good: Type-safe query
import { getMeetingsByDateRange } from '@/lib/db/queries/meetings';
const meetings = await getMeetingsByDateRange(startDate, endDate);

// ❌ Bad: Raw SQL
const meetings = await db.execute(sql`SELECT * FROM meetings...`);
```

### Error Handling

```typescript
// API Route error handling pattern
try {
  const result = await someOperation();
  return NextResponse.json(result);
} catch (error) {
  if (error instanceof ValidationError) {
    return NextResponse.json(
      { error: 'ValidationError', message: error.message },
      { status: 400 }
    );
  }
  console.error('Unexpected error:', error);
  return NextResponse.json(
    { error: 'InternalServerError', message: 'An unexpected error occurred' },
    { status: 500 }
  );
}
```

### Inngest Function Pattern

```typescript
export const myFunction = inngest.createFunction(
  { id: 'my-function', retries: 3 },
  { event: 'my/event.triggered' },
  async ({ event, step }) => {
    // Step 1: Each step is retried independently
    const data = await step.run('fetch-data', async () => {
      return await fetchData(event.data.id);
    });

    // Step 2: Parallel execution
    const results = await Promise.all(
      data.items.map((item) =>
        step.run(`process-${item.id}`, async () => {
          return await processItem(item);
        })
      )
    );

    // Step 3: Final aggregation
    await step.run('save-results', async () => {
      return await saveResults(results);
    });
  }
);
```

## 6. Testing

### Unit Tests

```bash
# Run all unit tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### E2E Tests

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests
npm run test:e2e

# Run in UI mode (interactive)
npm run test:e2e:ui
```

### Contract Tests

```bash
# Validate API contracts match implementation
npm run test:contract
```

## 7. Common Development Tasks

### Add a New API Route

1. Create file in `app/api/your-route/route.ts`
2. Define handler functions (GET, POST, etc.)
3. Add validation using Zod or similar
4. Update `contracts/api-spec.yaml` with new endpoint
5. Write integration test in `__tests__/integration/api/your-route.test.ts`

### Add a New Database Table

1. Update `lib/db/schema.ts` with new table definition
2. Define relations for type-safe joins
3. Generate migration: `npm run db:generate`
4. Review generated SQL in `drizzle/migrations/`
5. Apply migration: `npm run db:migrate`
6. Create query functions in `lib/db/queries/`

### Add a New Inngest Function

1. Create function file in `lib/inngest/functions/your-function.ts`
2. Define event trigger and steps
3. Export function in `lib/inngest/functions/index.ts`
4. Update `contracts/inngest-functions.md` with contract
5. Test via Inngest Dev UI

### Add a New React Component

1. Create component in appropriate directory (`components/`)
2. Use TypeScript for props
3. Follow Tailwind utility-first styling
4. Add Storybook story if component is reusable
5. Write unit test if component has logic

## 8. Deployment Checklist

Before deploying to Vercel:

- [ ] All tests passing (`npm run test && npm run test:e2e`)
- [ ] Migrations applied to production database
- [ ] Environment variables set in Vercel dashboard
- [ ] Google OAuth redirect URI includes production URL
- [ ] Inngest configured for production environment
- [ ] Webhook URL updated to production domain
- [ ] Constitution compliance verified (code quality, test coverage)

## 9. Troubleshooting

### "Database connection refused"
- Verify `DATABASE_URL` is correct
- Check Neon dashboard for database status
- Ensure IP is whitelisted (Neon allows all by default)

### "Google Calendar API quota exceeded"
- Check quota usage in Google Cloud Console
- Increase quotas if needed (usually high by default)
- Implement exponential backoff for rate limiting

### "Inngest function not executing"
- Verify Inngest Dev Server is running (`npx inngest-cli dev`)
- Check event name matches function trigger exactly
- View logs in Inngest Dev UI at http://localhost:8288

### "NextAuth session not persisting"
- Ensure `NEXTAUTH_SECRET` is set
- Check browser cookies are enabled
- Verify `NEXTAUTH_URL` matches your domain

### "Research generation fails"
- Check Perplexity API key is valid
- Check Anthropic API key is valid
- View detailed error in Inngest function logs
- Verify API rate limits not exceeded

## 10. Resources

- **Next.js 15 Docs**: https://nextjs.org/docs
- **Drizzle ORM**: https://orm.drizzle.team/docs
- **NextAuth v5**: https://authjs.dev/
- **Inngest**: https://www.inngest.com/docs
- **Tailwind CSS 4**: https://tailwindcss.com/docs
- **Neon Postgres**: https://neon.tech/docs
- **Google Calendar API**: https://developers.google.com/calendar/api
- **Perplexity API**: https://docs.perplexity.ai/
- **Anthropic Claude**: https://docs.anthropic.com/

## 11. Next Steps

After completing this quickstart:

1. Review the [feature specification](./spec.md) for detailed requirements
2. Review the [data model](./data-model.md) to understand database schema
3. Review the [API contracts](./contracts/) for endpoint specifications
4. Start implementing tasks from `tasks.md` (generated by `/speckit.tasks`)
5. Join team standups and code reviews to stay aligned

## Need Help?

- Check existing GitHub issues
- Review the constitution for coding standards
- Ask in team Slack channel
- Pair with another developer for complex features
