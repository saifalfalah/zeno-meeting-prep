import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '@/app/api/adhoc/route';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/client';
import { inngest } from '@/lib/inngest/client';

// Mock dependencies
vi.mock('@/lib/auth/config', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db/client', () => ({
  db: {
    query: {
      users: {
        findFirst: vi.fn(),
      },
      campaigns: {
        findFirst: vi.fn(),
      },
      adHocResearchRequests: {
        findFirst: vi.fn(),
      },
    },
  },
}));

vi.mock('@/lib/db/queries/adhoc', () => ({
  createAdHocResearchRequest: vi.fn(),
  getAdHocResearchRequestsByUserId: vi.fn(),
}));

vi.mock('@/lib/inngest/client', () => ({
  inngest: {
    send: vi.fn(),
  },
}));

describe('POST /api/adhoc - Website Field Support (User Story 2)', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockCampaign = {
    id: 'campaign-123',
    userId: 'user-123',
    name: 'Test Campaign',
    status: 'active',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { email: mockUser.email },
    });

    (db.query.users.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    (db.query.campaigns.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockCampaign);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('T034: POST /api/adhoc with website field', () => {
    it('should accept request with website field', async () => {
      const { createAdHocResearchRequest } = await import('@/lib/db/queries/adhoc');

      const mockRequest = {
        id: 'request-123',
        userId: mockUser.id,
        campaignId: mockCampaign.id,
        prospectName: 'John Doe',
        companyName: 'Acme Corp',
        email: 'john@acme.com',
        website: 'https://acme.com',
        status: 'pending',
      };

      (createAdHocResearchRequest as ReturnType<typeof vi.fn>).mockResolvedValue(mockRequest);
      (db.query.adHocResearchRequests.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        ...mockRequest,
        campaign: mockCampaign,
      });

      const request = new NextRequest('http://localhost:3000/api/adhoc', {
        method: 'POST',
        body: JSON.stringify({
          prospectName: 'John Doe',
          companyName: 'Acme Corp',
          email: 'john@acme.com',
          website: 'https://acme.com',
          campaignId: 'campaign-123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(createAdHocResearchRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          website: 'https://acme.com',
        })
      );
    });

    it('should pass website to Inngest event', async () => {
      const { createAdHocResearchRequest } = await import('@/lib/db/queries/adhoc');

      const mockRequest = {
        id: 'request-123',
        userId: mockUser.id,
        campaignId: mockCampaign.id,
        website: 'https://acme.com',
        status: 'pending',
      };

      (createAdHocResearchRequest as ReturnType<typeof vi.fn>).mockResolvedValue(mockRequest);

      const request = new NextRequest('http://localhost:3000/api/adhoc', {
        method: 'POST',
        body: JSON.stringify({
          website: 'https://acme.com',
          campaignId: 'campaign-123',
        }),
      });

      await POST(request);

      expect(inngest.send).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'research/generate.adhoc',
          data: expect.objectContaining({
            website: 'https://acme.com',
          }),
        })
      );
    });
  });

  describe('T035: Website-only submission success', () => {
    it('should accept request with only website field (no email, name, company)', async () => {
      const { createAdHocResearchRequest } = await import('@/lib/db/queries/adhoc');

      const mockRequest = {
        id: 'request-123',
        userId: mockUser.id,
        campaignId: mockCampaign.id,
        website: 'https://acme.com',
        status: 'pending',
        prospectName: null,
        companyName: null,
        email: null,
      };

      (createAdHocResearchRequest as ReturnType<typeof vi.fn>).mockResolvedValue(mockRequest);
      (db.query.adHocResearchRequests.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        ...mockRequest,
        campaign: mockCampaign,
      });

      const request = new NextRequest('http://localhost:3000/api/adhoc', {
        method: 'POST',
        body: JSON.stringify({
          website: 'https://acme.com',
          campaignId: 'campaign-123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.request).toBeDefined();
    });

    it('should validate that at least one field (including website) is provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/adhoc', {
        method: 'POST',
        body: JSON.stringify({
          campaignId: 'campaign-123',
          // No prospectName, companyName, email, or website
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toBeDefined();
    });
  });

  describe('T036: Invalid website URL rejection', () => {
    it('should reject invalid website URL format', async () => {
      const request = new NextRequest('http://localhost:3000/api/adhoc', {
        method: 'POST',
        body: JSON.stringify({
          website: 'not-a-valid-url',
          campaignId: 'campaign-123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should reject javascript: protocol URLs', async () => {
      const request = new NextRequest('http://localhost:3000/api/adhoc', {
        method: 'POST',
        body: JSON.stringify({
          website: 'javascript:alert(1)',
          campaignId: 'campaign-123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should reject empty string as website', async () => {
      const request = new NextRequest('http://localhost:3000/api/adhoc', {
        method: 'POST',
        body: JSON.stringify({
          website: '',
          campaignId: 'campaign-123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should accept valid https:// URLs', async () => {
      const { createAdHocResearchRequest } = await import('@/lib/db/queries/adhoc');

      const mockRequest = {
        id: 'request-123',
        userId: mockUser.id,
        campaignId: mockCampaign.id,
        website: 'https://example.com',
        status: 'pending',
      };

      (createAdHocResearchRequest as ReturnType<typeof vi.fn>).mockResolvedValue(mockRequest);
      (db.query.adHocResearchRequests.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        ...mockRequest,
        campaign: mockCampaign,
      });

      const request = new NextRequest('http://localhost:3000/api/adhoc', {
        method: 'POST',
        body: JSON.stringify({
          website: 'https://example.com',
          campaignId: 'campaign-123',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('should accept valid http:// URLs', async () => {
      const { createAdHocResearchRequest } = await import('@/lib/db/queries/adhoc');

      const mockRequest = {
        id: 'request-123',
        userId: mockUser.id,
        campaignId: mockCampaign.id,
        website: 'http://example.com',
        status: 'pending',
      };

      (createAdHocResearchRequest as ReturnType<typeof vi.fn>).mockResolvedValue(mockRequest);
      (db.query.adHocResearchRequests.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        ...mockRequest,
        campaign: mockCampaign,
      });

      const request = new NextRequest('http://localhost:3000/api/adhoc', {
        method: 'POST',
        body: JSON.stringify({
          website: 'http://example.com',
          campaignId: 'campaign-123',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('should accept bare domain format (example.com)', async () => {
      const { createAdHocResearchRequest } = await import('@/lib/db/queries/adhoc');

      const mockRequest = {
        id: 'request-123',
        userId: mockUser.id,
        campaignId: mockCampaign.id,
        website: 'example.com',
        status: 'pending',
      };

      (createAdHocResearchRequest as ReturnType<typeof vi.fn>).mockResolvedValue(mockRequest);
      (db.query.adHocResearchRequests.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        ...mockRequest,
        campaign: mockCampaign,
      });

      const request = new NextRequest('http://localhost:3000/api/adhoc', {
        method: 'POST',
        body: JSON.stringify({
          website: 'example.com',
          campaignId: 'campaign-123',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });
  });

  describe('Website prioritization with email', () => {
    it('should accept both website and email in same request', async () => {
      const { createAdHocResearchRequest } = await import('@/lib/db/queries/adhoc');

      const mockRequest = {
        id: 'request-123',
        userId: mockUser.id,
        campaignId: mockCampaign.id,
        email: 'john@example.com',
        website: 'https://acme.com',
        status: 'pending',
      };

      (createAdHocResearchRequest as ReturnType<typeof vi.fn>).mockResolvedValue(mockRequest);
      (db.query.adHocResearchRequests.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        ...mockRequest,
        campaign: mockCampaign,
      });

      const request = new NextRequest('http://localhost:3000/api/adhoc', {
        method: 'POST',
        body: JSON.stringify({
          email: 'john@example.com',
          website: 'https://acme.com',
          campaignId: 'campaign-123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(inngest.send).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'john@example.com',
            website: 'https://acme.com',
          }),
        })
      );
    });
  });
});
