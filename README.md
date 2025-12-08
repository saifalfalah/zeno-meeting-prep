# Zeno Meeting Prep

Pre-Call Intelligence Dashboard for Sales Professionals

## Project Status

**Phase 1: Setup** ✅ Complete

A Next.js 15 full-stack application that automatically generates detailed research briefs for upcoming sales meetings with external attendees.

## Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 4+
- **Database**: Neon Postgres with Drizzle ORM
- **Authentication**: NextAuth v5 (Google OAuth + Calendar API)
- **Background Jobs**: Inngest
- **Research APIs**: Perplexity API, Claude API
- **Testing**: Vitest (unit), Playwright (E2E)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 20+
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/saifalfalah/zeno-meeting-prep.git
cd zeno-meeting-prep
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your API keys
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production bundle
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run unit tests with Vitest
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:e2e` - Run E2E tests with Playwright
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Apply database migrations
- `npm run db:studio` - Open Drizzle Studio

## Project Structure

```
.
├── app/                  # Next.js App Router pages and layouts
├── components/           # React components
├── lib/                  # Business logic and utilities
│   ├── db/              # Database schema and queries
│   ├── services/        # External API clients
│   ├── inngest/         # Background job functions
│   └── auth/            # Authentication configuration
├── __tests__/           # Unit and integration tests
├── e2e/                 # End-to-end tests
├── public/              # Static assets
└── specs/               # Feature specifications and planning
```

## Development Workflow

1. Review feature specifications in `specs/001-meeting-prep/`
2. Implement tasks from `specs/001-meeting-prep/tasks.md`
3. Write tests for new functionality
4. Ensure all tests pass before committing
5. Follow the project constitution for code quality standards

## Testing

### Unit Tests
```bash
npm test                  # Run all unit tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage
```

### E2E Tests
```bash
npx playwright install   # First time only
npm run test:e2e         # Run all E2E tests
npm run test:e2e:ui      # Interactive UI mode
```

## Documentation

- [Feature Specification](specs/001-meeting-prep/spec.md)
- [Implementation Plan](specs/001-meeting-prep/plan.md)
- [Data Model](specs/001-meeting-prep/data-model.md)
- [Quickstart Guide](specs/001-meeting-prep/quickstart.md)
- [Technical Research](specs/001-meeting-prep/research.md)

## Next Steps

Phase 2 will implement the foundational infrastructure:
- Database schema with Drizzle ORM
- NextAuth authentication
- Inngest background jobs
- Base UI components

See `specs/001-meeting-prep/tasks.md` for the complete task list.

## License

ISC
