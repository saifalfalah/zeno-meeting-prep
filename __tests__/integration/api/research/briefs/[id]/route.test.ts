import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/research/briefs/[id]/route';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/config';
import * as briefQueries from '@/lib/db/queries/briefs';

// Mock the auth module
vi.mock('@/lib/auth/config', () => ({
  auth: vi.fn(),
}));

// Mock the database queries
vi.mock('@/lib/db/queries/briefs', () => ({
  getResearchBriefById: vi.fn(),
}));

describe('GET /api/research/briefs/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 if user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/research/briefs/123');
    const response = await GET(request, { params: { id: '123' } });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 404 if brief not found', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' },
    } as any);
    vi.mocked(briefQueries.getResearchBriefById).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/research/briefs/invalid-id');
    const response = await GET(request, { params: { id: 'invalid-id' } });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Research brief not found');
  });

  it('returns brief data when found', async () => {
    const mockBrief = {
      id: 'brief-1',
      type: 'calendar',
      campaignId: 'campaign-1',
      meetingId: 'meeting-1',
      confidenceRating: 'HIGH',
      confidenceExplanation: 'Comprehensive data available',
      companyOverview: 'Tech company',
      painPoints: 'Manual processes',
      howWeFit: 'Automation solution',
      openingLine: 'I saw you raised funding...',
      discoveryQuestions: JSON.stringify(['What are your challenges?', 'What tools do you use?']),
      successOutcome: 'Schedule a demo',
      watchOuts: 'May have budget constraints',
      recentSignals: JSON.stringify([
        { type: 'positive', text: 'Raised funding' },
      ]),
      generatedAt: new Date('2025-12-09T10:00:00Z'),
      prospectInfo: [
        {
          id: 'prospect-info-1',
          title: 'VP Engineering',
          location: 'SF',
          background: 'Former AWS engineer',
          reportsTo: 'CTO',
          teamSize: '15',
          prospect: {
            id: 'prospect-1',
            name: 'John Doe',
            email: 'john@acme.com',
            company: {
              id: 'company-1',
              name: 'Acme Corp',
              domain: 'acme.com',
              industry: 'SaaS',
              employeeCount: '50-200',
              fundingStage: 'Series B',
              headquarters: 'San Francisco, CA',
            },
          },
        },
      ],
      campaign: {
        id: 'campaign-1',
        name: 'Q4 Enterprise',
      },
      meeting: {
        id: 'meeting-1',
        title: 'Discovery Call',
        startTime: new Date('2025-12-10T10:00:00Z'),
        endTime: new Date('2025-12-10T10:30:00Z'),
      },
      adHocRequest: null,
      researchSources: [
        {
          id: 'source-1',
          sourceType: 'company_website',
          url: 'https://acme.com',
          title: 'Company Website',
        },
      ],
    };

    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' },
    } as any);
    vi.mocked(briefQueries.getResearchBriefById).mockResolvedValue(mockBrief as any);

    const request = new NextRequest('http://localhost:3000/api/research/briefs/brief-1');
    const response = await GET(request, { params: { id: 'brief-1' } });

    expect(response.status).toBe(200);
    const data = await response.json();

    // Verify structure matches component props
    expect(data).toHaveProperty('header');
    expect(data).toHaveProperty('quickFacts');
    expect(data).toHaveProperty('deepDive');
    expect(data).toHaveProperty('callStrategy');
    expect(data).toHaveProperty('footer');

    // Verify header data
    expect(data.header.prospect.name).toBe('John Doe');
    expect(data.header.company.name).toBe('Acme Corp');
    expect(data.header.meeting.title).toBe('Discovery Call');

    // Verify footer data
    expect(data.footer.confidenceRating).toBe('HIGH');
    expect(data.footer.sources).toHaveLength(1);
  });

  it('handles database errors gracefully', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' },
    } as any);
    vi.mocked(briefQueries.getResearchBriefById).mockRejectedValue(
      new Error('Database connection failed')
    );

    const request = new NextRequest('http://localhost:3000/api/research/briefs/brief-1');
    const response = await GET(request, { params: { id: 'brief-1' } });

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Internal server error');
  });
});
