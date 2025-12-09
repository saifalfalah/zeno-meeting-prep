import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/research/briefs/[id]/pdf/route';

// Mock dependencies
vi.mock('@/lib/auth/config', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db/queries/briefs', () => ({
  getResearchBriefById: vi.fn(),
}));

vi.mock('@/lib/services/pdf', () => ({
  generateBriefPDF: vi.fn(),
}));

import { auth } from '@/lib/auth/config';
import { getResearchBriefById } from '@/lib/db/queries/briefs';
import { generateBriefPDF } from '@/lib/services/pdf';

describe('GET /api/research/briefs/[id]/pdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockBriefData = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    type: 'calendar' as const,
    campaignId: 'campaign-123',
    meetingId: 'meeting-123',
    adHocRequestId: null,
    confidenceRating: 'HIGH' as const,
    confidenceExplanation: 'All data verified',
    companyOverview: 'Acme Corp is a tech company',
    painPoints: 'Scalability issues',
    howWeFit: 'Our platform solves scaling',
    openingLine: 'Hi John',
    discoveryQuestions: JSON.stringify(['Question 1', 'Question 2']),
    successOutcome: 'Identify use cases',
    watchOuts: 'Budget constraints',
    recentSignals: JSON.stringify(['Series B funding']),
    pdfUrl: null,
    generatedAt: new Date('2025-01-15T10:00:00Z'),
    createdAt: new Date('2025-01-15T10:00:00Z'),
    updatedAt: new Date('2025-01-15T10:00:00Z'),
    campaign: {
      id: 'campaign-123',
      name: 'Q1 Sales',
      companyName: 'Our Company',
      offeringTitle: 'AI Platform',
    },
    meeting: {
      id: 'meeting-123',
      title: 'Sales Call with Acme Corp',
      startTime: new Date('2025-01-15T10:00:00Z'),
      endTime: new Date('2025-01-15T11:00:00Z'),
      timezone: 'America/Los_Angeles',
    },
    adHocRequest: null,
    prospectInfo: [
      {
        id: 'prospect-info-123',
        researchBriefId: '123e4567-e89b-12d3-a456-426614174000',
        prospectId: 'prospect-123',
        title: 'CTO',
        location: 'San Francisco',
        background: 'Engineering leader',
        reportsTo: 'CEO',
        teamSize: '50',
        recentActivity: 'Recent hire',
        prospect: {
          id: 'prospect-123',
          name: 'John Doe',
          email: 'john@acme.com',
          companyId: 'company-123',
          company: {
            id: 'company-123',
            name: 'Acme Corp',
            domain: 'acme.com',
            industry: 'Technology',
            employeeCount: '50-200',
            fundingStage: 'Series B',
            headquarters: 'San Francisco, CA',
          },
        },
      },
    ],
    researchSources: [
      {
        id: 'source-123',
        researchBriefId: '123e4567-e89b-12d3-a456-426614174000',
        sourceType: 'company_website',
        url: 'https://acme.com',
        title: 'Acme Corp Website',
        accessedAt: new Date('2025-01-15T10:00:00Z'),
      },
    ],
  };

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/research/briefs/123/pdf');
    const params = Promise.resolve({ id: '123' });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 404 if brief not found', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-123' } } as any);
    vi.mocked(getResearchBriefById).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/research/briefs/123/pdf');
    const params = Promise.resolve({ id: '123' });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Brief not found');
  });

  it('should generate and return PDF for valid brief', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-123' } } as any);
    vi.mocked(getResearchBriefById).mockResolvedValue(mockBriefData as any);

    const mockPDFBuffer = Buffer.from('mock pdf content');
    vi.mocked(generateBriefPDF).mockResolvedValue(mockPDFBuffer);

    const request = new NextRequest('http://localhost:3000/api/research/briefs/123/pdf');
    const params = Promise.resolve({ id: '123' });

    const response = await GET(request, { params });

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(response.headers.get('Content-Disposition')).toContain('attachment');
    expect(response.headers.get('Content-Disposition')).toContain('.pdf');

    // Verify PDF generation was called with correct data
    expect(generateBriefPDF).toHaveBeenCalledWith(
      expect.objectContaining({
        meeting: expect.objectContaining({
          title: 'Sales Call with Acme Corp',
          timezone: 'America/Los_Angeles',
        }),
        campaign: expect.objectContaining({
          companyName: 'Our Company',
          offeringTitle: 'AI Platform',
        }),
        brief: expect.objectContaining({
          confidenceRating: 'HIGH',
          companyOverview: 'Acme Corp is a tech company',
        }),
      })
    );
  });

  it('should handle ad-hoc briefs correctly', async () => {
    const adHocBriefData = {
      ...mockBriefData,
      type: 'adhoc' as const,
      meetingId: null,
      adHocRequestId: 'adhoc-123',
      meeting: null,
      adHocRequest: {
        id: 'adhoc-123',
        prospectName: 'Jane Smith',
        companyName: 'Tech Corp',
        prospectEmail: 'jane@techcorp.com',
      },
    };

    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-123' } } as any);
    vi.mocked(getResearchBriefById).mockResolvedValue(adHocBriefData as any);

    const mockPDFBuffer = Buffer.from('mock pdf content');
    vi.mocked(generateBriefPDF).mockResolvedValue(mockPDFBuffer);

    const request = new NextRequest('http://localhost:3000/api/research/briefs/123/pdf');
    const params = Promise.resolve({ id: '123' });

    const response = await GET(request, { params });

    expect(response.status).toBe(200);
    expect(generateBriefPDF).toHaveBeenCalledWith(
      expect.objectContaining({
        meeting: expect.objectContaining({
          title: 'Jane Smith',
        }),
      })
    );
  });

  it('should return 500 on internal error', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-123' } } as any);
    vi.mocked(getResearchBriefById).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/research/briefs/123/pdf');
    const params = Promise.resolve({ id: '123' });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });

  it('should use sanitized filename in Content-Disposition header', async () => {
    const briefWithSpecialChars = {
      ...mockBriefData,
      meeting: {
        ...mockBriefData.meeting!,
        title: 'Sales Call: Acme/Corp & Partners',
      },
    };

    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-123' } } as any);
    vi.mocked(getResearchBriefById).mockResolvedValue(briefWithSpecialChars as any);

    const mockPDFBuffer = Buffer.from('mock pdf content');
    vi.mocked(generateBriefPDF).mockResolvedValue(mockPDFBuffer);

    const request = new NextRequest('http://localhost:3000/api/research/briefs/123/pdf');
    const params = Promise.resolve({ id: '123' });

    const response = await GET(request, { params });

    expect(response.status).toBe(200);
    const contentDisposition = response.headers.get('Content-Disposition');
    expect(contentDisposition).not.toContain('/');
    expect(contentDisposition).not.toContain('&');
    expect(contentDisposition).toMatch(/filename=.*\.pdf/);
  });
});
