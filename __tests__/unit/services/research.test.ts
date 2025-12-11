import { describe, it, expect, vi, beforeEach } from 'vitest';
import { orchestrateResearch } from '@/lib/services/research';
import * as perplexity from '@/lib/services/perplexity';
import * as claude from '@/lib/services/claude';

vi.mock('@/lib/services/perplexity');
vi.mock('@/lib/services/claude');

describe('Research Orchestration Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('orchestrateResearch', () => {
    const mockCampaignContext = {
      companyName: 'Our Company',
      companyDescription: 'We provide AI solutions',
      offeringTitle: 'AI Platform',
      offeringDescription: 'Enterprise AI platform',
      targetCustomer: 'Enterprise companies',
      keyPainPoints: ['Scalability', 'Cost'],
    };

    const mockProspects = [
      {
        email: 'john@acme.com',
        name: 'John Doe',
        companyDomain: 'acme.com',
      },
    ];

    it('should orchestrate full research pipeline successfully', async () => {
      const mockMultiPassResult = {
        companyWebsitePass: {
          content: JSON.stringify({ name: 'Acme Corp', industry: 'Technology', employeeCount: '50-200', fundingStage: 'Series B' }),
          sources: [],
        },
        companyNewsPass: {
          content: JSON.stringify({ recentNews: ['Raised funding'] }),
          sources: [],
        },
        prospectBackgroundPass: {
          content: JSON.stringify({ name: 'John Doe', title: 'CTO', companyName: 'Acme Corp', location: 'San Francisco' }),
          sources: [],
        },
        metadata: {
          model: 'sonar-pro',
          timestamp: '2025-01-01T00:00:00Z',
          totalDurationMs: 5000,
          passesCompleted: 3,
        },
        isPartialData: false,
        operationLogs: [],
      };

      const mockBriefData = {
        confidenceRating: 'HIGH' as const,
        confidenceExplanation: 'All data verified',
        companyOverview: 'Acme Corp overview',
        painPoints: 'Scalability issues',
        howWeFit: 'We can help scale',
        openingLine: 'Hi John',
        discoveryQuestions: ['What challenges?'],
        successOutcome: 'Identify use cases',
        watchOuts: 'Budget constraints',
        recentSignals: ['Raised funding'],
      };

      vi.spyOn(perplexity, 'performMultiPassResearch').mockResolvedValueOnce(mockMultiPassResult);
      vi.spyOn(claude, 'generateResearchBrief').mockResolvedValueOnce(mockBriefData);

      const result = await orchestrateResearch({
        campaignContext: mockCampaignContext,
        prospects: mockProspects,
      });

      expect(perplexity.performMultiPassResearch).toHaveBeenCalled();
      expect(claude.generateResearchBrief).toHaveBeenCalled();

      expect(result.brief).toEqual(mockBriefData);
      expect(result.isPartialData).toBe(false);
    });

    it('should handle multiple prospects from same company', async () => {
      const prospects = [
        { email: 'john@acme.com', name: 'John', companyDomain: 'acme.com' },
        { email: 'jane@acme.com', name: 'Jane', companyDomain: 'acme.com' },
      ];

      const mockMultiPassResult1 = {
        companyWebsitePass: { content: JSON.stringify({ name: 'Acme Corp' }), sources: [] },
        companyNewsPass: { content: JSON.stringify({}), sources: [] },
        prospectBackgroundPass: { content: JSON.stringify({ name: 'John', title: 'CTO' }), sources: [] },
        metadata: { model: 'sonar-pro', timestamp: '2025-01-01T00:00:00Z', totalDurationMs: 5000, passesCompleted: 3 },
        isPartialData: false,
        operationLogs: [],
      };

      const mockMultiPassResult2 = {
        companyWebsitePass: { content: JSON.stringify({ name: 'Acme Corp' }), sources: [] },
        companyNewsPass: { content: JSON.stringify({}), sources: [] },
        prospectBackgroundPass: { content: JSON.stringify({ name: 'Jane', title: 'CEO' }), sources: [] },
        metadata: { model: 'sonar-pro', timestamp: '2025-01-01T00:00:00Z', totalDurationMs: 5000, passesCompleted: 3 },
        isPartialData: false,
        operationLogs: [],
      };

      vi.spyOn(perplexity, 'performMultiPassResearch')
        .mockResolvedValueOnce(mockMultiPassResult1)
        .mockResolvedValueOnce(mockMultiPassResult2);

      vi.spyOn(claude, 'generateResearchBrief').mockResolvedValueOnce({
        confidenceRating: 'HIGH',
        confidenceExplanation: 'Complete data',
      });

      await orchestrateResearch({
        campaignContext: mockCampaignContext,
        prospects,
      });

      // Should perform multi-pass research for each prospect
      expect(perplexity.performMultiPassResearch).toHaveBeenCalledTimes(2);
    });

    it('should continue with LOW confidence when prospect research fails', async () => {
      vi.spyOn(perplexity, 'performMultiPassResearch').mockRejectedValueOnce(
        new Error('Prospect not found')
      );

      vi.spyOn(claude, 'generateResearchBrief').mockResolvedValueOnce({
        confidenceRating: 'LOW',
        confidenceExplanation: 'Limited prospect data',
      });

      const result = await orchestrateResearch({
        campaignContext: mockCampaignContext,
        prospects: mockProspects,
      });

      expect(result.brief.confidenceRating).toBe('LOW');
      expect(result.prospectResearch).toEqual([]);
    });

    it('should continue with LOW confidence when company research fails', async () => {
      const mockPartialMultiPassResult = {
        companyWebsitePass: null,
        companyNewsPass: null,
        prospectBackgroundPass: { content: JSON.stringify({ name: 'John Doe' }), sources: [] },
        metadata: { model: 'sonar-pro', timestamp: '2025-01-01T00:00:00Z', totalDurationMs: 5000, passesCompleted: 1 },
        isPartialData: true,
        operationLogs: [],
      };

      vi.spyOn(perplexity, 'performMultiPassResearch').mockResolvedValueOnce(mockPartialMultiPassResult);

      vi.spyOn(claude, 'generateResearchBrief').mockResolvedValueOnce({
        confidenceRating: 'MEDIUM',
        confidenceExplanation: 'Limited company data',
      });

      const result = await orchestrateResearch({
        campaignContext: mockCampaignContext,
        prospects: mockProspects,
      });

      // Confidence should be overridden to LOW when company lookup fails (partial data)
      expect(result.brief.confidenceRating).toBe('LOW');
      expect(result.isPartialData).toBe(true);
      expect(result.brief.confidenceExplanation).toContain('Some research data was unavailable');
    });

    it('should throw error when brief generation fails with no data', async () => {
      vi.spyOn(perplexity, 'performMultiPassResearch').mockResolvedValueOnce({
        companyWebsitePass: null,
        companyNewsPass: null,
        prospectBackgroundPass: null,
        metadata: { model: 'sonar-pro', timestamp: '2025-01-01T00:00:00Z', totalDurationMs: 5000, passesCompleted: 0 },
        isPartialData: true,
        operationLogs: [],
      });
      vi.spyOn(claude, 'generateResearchBrief').mockRejectedValueOnce(
        new Error('Claude API failed')
      );

      // Should return minimal brief when all passes fail
      const result = await orchestrateResearch({
        campaignContext: mockCampaignContext,
        prospects: mockProspects,
      });

      expect(result.brief.confidenceRating).toBe('LOW');
      expect(result.brief.confidenceExplanation).toContain('Minimal information available');
    });

    it('should extract company domain from email when not provided', async () => {
      const prospectsWithoutDomain = [
        { email: 'john@acme.com', name: 'John' },
      ];

      const mockMultiPassResult = {
        companyWebsitePass: { content: JSON.stringify({ name: 'Acme' }), sources: [] },
        companyNewsPass: { content: JSON.stringify({}), sources: [] },
        prospectBackgroundPass: { content: JSON.stringify({ name: 'John' }), sources: [] },
        metadata: { model: 'sonar-pro', timestamp: '2025-01-01T00:00:00Z', totalDurationMs: 5000, passesCompleted: 3 },
        isPartialData: false,
        operationLogs: [],
      };

      vi.spyOn(perplexity, 'performMultiPassResearch').mockResolvedValueOnce(mockMultiPassResult);
      vi.spyOn(claude, 'generateResearchBrief').mockResolvedValueOnce({
        confidenceRating: 'HIGH',
        confidenceExplanation: 'Complete',
      });

      const result = await orchestrateResearch({
        campaignContext: mockCampaignContext,
        prospects: prospectsWithoutDomain,
      });

      // Should successfully complete research
      expect(perplexity.performMultiPassResearch).toHaveBeenCalled();
      expect(result.isPartialData).toBe(false);
    });
  });

  describe('T046: Website prioritization over email domain (User Story 2)', () => {
    const mockCampaignContext = {
      companyName: 'Our Company',
      companyDescription: 'We provide AI solutions',
      offeringTitle: 'AI Platform',
      offeringDescription: 'Enterprise AI platform',
      targetCustomer: 'Enterprise companies',
      keyPainPoints: ['Scalability', 'Cost'],
    };

    const mockMultiPassResult = {
      companyWebsitePass: { content: JSON.stringify({ name: 'Acme Corp' }), sources: [] },
      companyNewsPass: { content: JSON.stringify({}), sources: [] },
      prospectBackgroundPass: { content: JSON.stringify({ name: 'John Doe' }), sources: [] },
      metadata: { model: 'sonar-pro', timestamp: '2025-01-01T00:00:00Z', totalDurationMs: 5000, passesCompleted: 3 },
      isPartialData: false,
      operationLogs: [],
    };

    it('should prioritize explicit website over email domain when both provided', async () => {
      const prospectsWithWebsite = [
        {
          email: 'john@wrongdomain.com',
          name: 'John Doe',
          website: 'https://acme.com',
        },
      ];

      vi.spyOn(perplexity, 'performMultiPassResearch').mockResolvedValueOnce(mockMultiPassResult);
      vi.spyOn(claude, 'generateResearchBrief').mockResolvedValueOnce({
        confidenceRating: 'HIGH',
        confidenceExplanation: 'Complete data',
      });

      await orchestrateResearch({
        campaignContext: mockCampaignContext,
        prospects: prospectsWithWebsite,
      });

      // Should pass website to performMultiPassResearch
      expect(perplexity.performMultiPassResearch).toHaveBeenCalledWith(
        expect.objectContaining({
          website: 'https://acme.com',
          companyDomain: 'acme.com',
        }),
        expect.any(Object)
      );
    });

    it('should use website when provided without email', async () => {
      const prospectsWebsiteOnly = [
        {
          name: 'John Doe',
          website: 'https://acme.com',
          email: 'john@example.com',
        },
      ];

      vi.spyOn(perplexity, 'performMultiPassResearch').mockResolvedValueOnce(mockMultiPassResult);
      vi.spyOn(claude, 'generateResearchBrief').mockResolvedValueOnce({
        confidenceRating: 'HIGH',
        confidenceExplanation: 'Complete data',
      });

      await orchestrateResearch({
        campaignContext: mockCampaignContext,
        prospects: prospectsWebsiteOnly,
      });

      // Should use website domain
      expect(perplexity.performMultiPassResearch).toHaveBeenCalledWith(
        expect.objectContaining({
          website: 'https://acme.com',
        }),
        expect.any(Object)
      );
    });

    it('should extract domain from website URL properly', async () => {
      const prospectsWithFullUrl = [
        {
          name: 'John Doe',
          website: 'https://www.acme.com/about/team',
          email: 'john@example.com',
        },
      ];

      vi.spyOn(perplexity, 'performMultiPassResearch').mockResolvedValueOnce(mockMultiPassResult);
      vi.spyOn(claude, 'generateResearchBrief').mockResolvedValueOnce({
        confidenceRating: 'HIGH',
        confidenceExplanation: 'Complete data',
      });

      await orchestrateResearch({
        campaignContext: mockCampaignContext,
        prospects: prospectsWithFullUrl,
      });

      // Should extract acme.com from full URL
      expect(perplexity.performMultiPassResearch).toHaveBeenCalledWith(
        expect.objectContaining({
          companyDomain: 'acme.com',
        }),
        expect.any(Object)
      );
    });

    it('should fallback to email domain when website is not provided', async () => {
      const prospectsEmailOnly = [
        {
          email: 'john@acme.com',
          name: 'John Doe',
        },
      ];

      vi.spyOn(perplexity, 'performMultiPassResearch').mockResolvedValueOnce(mockMultiPassResult);
      vi.spyOn(claude, 'generateResearchBrief').mockResolvedValueOnce({
        confidenceRating: 'HIGH',
        confidenceExplanation: 'Complete data',
      });

      await orchestrateResearch({
        campaignContext: mockCampaignContext,
        prospects: prospectsEmailOnly,
      });

      // Should use email domain as fallback
      expect(perplexity.performMultiPassResearch).toHaveBeenCalledWith(
        expect.objectContaining({
          companyDomain: 'acme.com',
        }),
        expect.any(Object)
      );
    });
  });

  describe('T062-T063: Multi-pass research integration (User Story 3)', () => {
    const mockCampaignContext = {
      companyName: 'Our Company',
      companyDescription: 'We provide AI solutions',
      offeringTitle: 'AI Platform',
      offeringDescription: 'Enterprise AI platform',
      targetCustomer: 'Enterprise companies',
      keyPainPoints: ['Scalability', 'Cost'],
    };

    it('should use performMultiPassResearch instead of single Perplexity calls', async () => {
      const mockProspects = [
        {
          email: 'john@acme.com',
          name: 'John Doe',
          website: 'https://acme.com',
        },
      ];

      const mockMultiPassResult = {
        companyWebsitePass: {
          content: 'Company website information',
          sources: [{ url: 'https://acme.com', title: 'Acme Corp' }],
        },
        companyNewsPass: {
          content: 'Recent company news',
          sources: [{ url: 'https://news.com/acme', title: 'Acme News' }],
        },
        prospectBackgroundPass: {
          content: 'John Doe background',
          sources: [{ url: 'https://linkedin.com/john', title: 'John LinkedIn' }],
        },
        metadata: {
          model: 'sonar-pro',
          timestamp: '2025-01-01T00:00:00Z',
          totalDurationMs: 5000,
          passesCompleted: 3,
        },
        isPartialData: false,
        operationLogs: [],
      };

      const mockBriefData = {
        confidenceRating: 'HIGH' as const,
        confidenceExplanation: 'All data verified',
        companyOverview: 'Acme Corp overview',
        painPoints: 'Scalability issues',
        howWeFit: 'We can help scale',
        openingLine: 'Hi John',
        discoveryQuestions: ['What challenges?'],
        successOutcome: 'Identify use cases',
        watchOuts: 'Budget constraints',
        recentSignals: ['Raised funding'],
      };

      vi.spyOn(perplexity, 'performMultiPassResearch').mockResolvedValueOnce(mockMultiPassResult);
      vi.spyOn(claude, 'generateResearchBrief').mockResolvedValueOnce(mockBriefData);

      const result = await orchestrateResearch({
        campaignContext: mockCampaignContext,
        prospects: mockProspects,
      });

      // Should call performMultiPassResearch instead of separate researchProspect/researchCompany
      expect(perplexity.performMultiPassResearch).toHaveBeenCalledWith(
        expect.objectContaining({
          prospectName: 'John Doe',
          prospectEmail: 'john@acme.com',
          companyDomain: 'acme.com',
          website: 'https://acme.com',
        }),
        expect.any(Object)
      );

      // Should NOT call individual research functions
      expect(perplexity.researchProspect).not.toHaveBeenCalled();
      expect(perplexity.researchCompany).not.toHaveBeenCalled();

      expect(result.isPartialData).toBe(false);
      expect(result.brief.confidenceRating).toBe('HIGH');
    });

    it('should handle partial results from multi-pass research with LOW confidence', async () => {
      const mockProspects = [
        {
          email: 'john@acme.com',
          name: 'John Doe',
          website: 'https://acme.com',
        },
      ];

      const mockPartialMultiPassResult = {
        companyWebsitePass: {
          content: 'Company website information',
          sources: [{ url: 'https://acme.com', title: 'Acme Corp' }],
        },
        companyNewsPass: null, // Failed pass
        prospectBackgroundPass: null, // Failed pass
        metadata: {
          model: 'sonar-pro',
          timestamp: '2025-01-01T00:00:00Z',
          totalDurationMs: 5000,
          passesCompleted: 1,
          errors: ['company_news failed: Timeout', 'prospect_background failed: Timeout'],
        },
        isPartialData: true,
        operationLogs: [],
      };

      const mockBriefData = {
        confidenceRating: 'MEDIUM' as const,
        confidenceExplanation: 'Some data available',
        companyOverview: 'Acme Corp overview',
        painPoints: 'Unknown',
        howWeFit: 'To be determined',
        openingLine: 'Hi John',
        discoveryQuestions: ['What challenges?'],
        successOutcome: 'Learn more',
        watchOuts: 'Limited information',
        recentSignals: [],
      };

      vi.spyOn(perplexity, 'performMultiPassResearch').mockResolvedValueOnce(mockPartialMultiPassResult);
      vi.spyOn(claude, 'generateResearchBrief').mockResolvedValueOnce(mockBriefData);

      const result = await orchestrateResearch({
        campaignContext: mockCampaignContext,
        prospects: mockProspects,
      });

      // Should mark as partial data
      expect(result.isPartialData).toBe(true);

      // Should override confidence rating to LOW (T063)
      expect(result.brief.confidenceRating).toBe('LOW');
      expect(result.brief.confidenceExplanation).toContain('Some research data was unavailable');
    });

    it('should handle complete multi-pass failure and still generate minimal brief', async () => {
      const mockProspects = [
        {
          email: 'john@acme.com',
          name: 'John Doe',
        },
      ];

      const mockFailedMultiPassResult = {
        companyWebsitePass: null,
        companyNewsPass: null,
        prospectBackgroundPass: null,
        metadata: {
          model: 'sonar-pro',
          timestamp: '2025-01-01T00:00:00Z',
          totalDurationMs: 5000,
          passesCompleted: 0,
          errors: ['All passes failed'],
        },
        isPartialData: true,
        operationLogs: [],
      };

      vi.spyOn(perplexity, 'performMultiPassResearch').mockResolvedValueOnce(mockFailedMultiPassResult);
      vi.spyOn(claude, 'generateResearchBrief').mockRejectedValueOnce(
        new Error('Insufficient data for brief generation')
      );

      const result = await orchestrateResearch({
        campaignContext: mockCampaignContext,
        prospects: mockProspects,
      });

      // Should still return a minimal brief
      expect(result.brief.confidenceRating).toBe('LOW');
      expect(result.brief.confidenceExplanation).toContain('Minimal information available');
      expect(result.isPartialData).toBe(true);
    });

    it('should handle multiple prospects with multi-pass research', async () => {
      const mockProspects = [
        { email: 'john@acme.com', name: 'John Doe', website: 'https://acme.com' },
        { email: 'jane@acme.com', name: 'Jane Smith', website: 'https://acme.com' },
      ];

      const mockMultiPassResult1 = {
        companyWebsitePass: { content: 'Info 1', sources: [] },
        companyNewsPass: { content: 'News 1', sources: [] },
        prospectBackgroundPass: { content: 'John background', sources: [] },
        metadata: {
          model: 'sonar-pro',
          timestamp: '2025-01-01T00:00:00Z',
          totalDurationMs: 5000,
          passesCompleted: 3,
        },
        isPartialData: false,
        operationLogs: [],
      };

      const mockMultiPassResult2 = {
        companyWebsitePass: { content: 'Info 2', sources: [] },
        companyNewsPass: { content: 'News 2', sources: [] },
        prospectBackgroundPass: { content: 'Jane background', sources: [] },
        metadata: {
          model: 'sonar-pro',
          timestamp: '2025-01-01T00:00:00Z',
          totalDurationMs: 5000,
          passesCompleted: 3,
        },
        isPartialData: false,
        operationLogs: [],
      };

      vi.spyOn(perplexity, 'performMultiPassResearch')
        .mockResolvedValueOnce(mockMultiPassResult1)
        .mockResolvedValueOnce(mockMultiPassResult2);

      vi.spyOn(claude, 'generateResearchBrief').mockResolvedValueOnce({
        confidenceRating: 'HIGH',
        confidenceExplanation: 'Complete data',
      });

      const result = await orchestrateResearch({
        campaignContext: mockCampaignContext,
        prospects: mockProspects,
      });

      // Should call performMultiPassResearch for each prospect
      expect(perplexity.performMultiPassResearch).toHaveBeenCalledTimes(2);
      expect(result.isPartialData).toBe(false);
    });
  });
});
