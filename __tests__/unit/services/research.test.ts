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
      const mockProspectData = {
        name: 'John Doe',
        title: 'CTO',
        companyName: 'Acme Corp',
        location: 'San Francisco',
      };

      const mockCompanyData = {
        name: 'Acme Corp',
        industry: 'Technology',
        employeeCount: '50-200',
        fundingStage: 'Series B',
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

      vi.spyOn(perplexity, 'researchProspect').mockResolvedValueOnce(mockProspectData);
      vi.spyOn(perplexity, 'researchCompany').mockResolvedValueOnce(mockCompanyData);
      vi.spyOn(claude, 'generateResearchBrief').mockResolvedValueOnce(mockBriefData);

      const result = await orchestrateResearch({
        campaignContext: mockCampaignContext,
        prospects: mockProspects,
      });

      expect(perplexity.researchProspect).toHaveBeenCalledWith({
        email: 'john@acme.com',
        name: 'John Doe',
        companyDomain: 'acme.com',
      });

      expect(perplexity.researchCompany).toHaveBeenCalledWith('acme.com');

      expect(claude.generateResearchBrief).toHaveBeenCalledWith({
        campaignContext: mockCampaignContext,
        companyResearch: mockCompanyData,
        prospectResearch: [mockProspectData],
      });

      expect(result).toEqual({
        brief: mockBriefData,
        prospectResearch: [mockProspectData],
        companyResearch: mockCompanyData,
      });
    });

    it('should handle multiple prospects from same company', async () => {
      const prospects = [
        { email: 'john@acme.com', name: 'John', companyDomain: 'acme.com' },
        { email: 'jane@acme.com', name: 'Jane', companyDomain: 'acme.com' },
      ];

      vi.spyOn(perplexity, 'researchProspect')
        .mockResolvedValueOnce({ name: 'John', title: 'CTO' })
        .mockResolvedValueOnce({ name: 'Jane', title: 'CEO' });

      vi.spyOn(perplexity, 'researchCompany').mockResolvedValueOnce({
        name: 'Acme Corp',
      });

      vi.spyOn(claude, 'generateResearchBrief').mockResolvedValueOnce({
        confidenceRating: 'HIGH',
        confidenceExplanation: 'Complete data',
      });

      await orchestrateResearch({
        campaignContext: mockCampaignContext,
        prospects,
      });

      // Should only research company once
      expect(perplexity.researchCompany).toHaveBeenCalledTimes(1);
      // Should research each prospect
      expect(perplexity.researchProspect).toHaveBeenCalledTimes(2);
    });

    it('should continue with LOW confidence when prospect research fails', async () => {
      vi.spyOn(perplexity, 'researchProspect').mockRejectedValueOnce(
        new Error('Prospect not found')
      );

      vi.spyOn(perplexity, 'researchCompany').mockResolvedValueOnce({
        name: 'Acme Corp',
      });

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

    it('should continue with MEDIUM confidence when company research fails', async () => {
      vi.spyOn(perplexity, 'researchProspect').mockResolvedValueOnce({
        name: 'John Doe',
      });

      vi.spyOn(perplexity, 'researchCompany').mockRejectedValueOnce(
        new Error('Company not found')
      );

      vi.spyOn(claude, 'generateResearchBrief').mockResolvedValueOnce({
        confidenceRating: 'MEDIUM',
        confidenceExplanation: 'Limited company data',
      });

      const result = await orchestrateResearch({
        campaignContext: mockCampaignContext,
        prospects: mockProspects,
      });

      expect(result.brief.confidenceRating).toBe('MEDIUM');
      expect(result.companyResearch).toEqual({});
    });

    it('should throw error when brief generation fails', async () => {
      vi.spyOn(perplexity, 'researchProspect').mockResolvedValueOnce({
        name: 'John',
      });
      vi.spyOn(perplexity, 'researchCompany').mockResolvedValueOnce({
        name: 'Acme',
      });
      vi.spyOn(claude, 'generateResearchBrief').mockRejectedValueOnce(
        new Error('Claude API failed')
      );

      await expect(
        orchestrateResearch({
          campaignContext: mockCampaignContext,
          prospects: mockProspects,
        })
      ).rejects.toThrow('Claude API failed');
    });

    it('should extract company domain from email when not provided', async () => {
      const prospectsWithoutDomain = [
        { email: 'john@acme.com', name: 'John' },
      ];

      vi.spyOn(perplexity, 'researchProspect').mockResolvedValueOnce({
        name: 'John',
      });
      vi.spyOn(perplexity, 'researchCompany').mockResolvedValueOnce({
        name: 'Acme',
      });
      vi.spyOn(claude, 'generateResearchBrief').mockResolvedValueOnce({
        confidenceRating: 'HIGH',
        confidenceExplanation: 'Complete',
      });

      await orchestrateResearch({
        campaignContext: mockCampaignContext,
        prospects: prospectsWithoutDomain,
      });

      // Should extract acme.com from email
      expect(perplexity.researchCompany).toHaveBeenCalledWith('acme.com');
    });
  });
});
