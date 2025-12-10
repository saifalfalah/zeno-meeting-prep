import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { CompanyResearchData, ProspectResearchData } from '@/lib/services/perplexity';

// Create the mock function outside so we can control it from tests
const mockCreate = vi.fn();

// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = {
        create: mockCreate,
      };
      static RateLimitError = class extends Error {};
      static AuthenticationError = class extends Error {};
    },
  };
});

describe('Claude API Service', () => {
  let originalApiKey: string | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    originalApiKey = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    if (originalApiKey !== undefined) {
      process.env.ANTHROPIC_API_KEY = originalApiKey;
    } else {
      delete process.env.ANTHROPIC_API_KEY;
    }
  });

  describe('generateResearchBrief', () => {
    const mockCampaignContext = {
      companyName: 'Our Company',
      companyDescription: 'We provide AI solutions',
      offeringTitle: 'AI Platform',
      offeringDescription: 'Enterprise AI platform for scaling',
      targetCustomer: 'Enterprise tech companies',
      keyPainPoints: ['Scalability', 'Cost efficiency'],
    };

    const mockCompanyResearch: CompanyResearchData = {
      name: 'Acme Corp',
      industry: 'Technology',
      employeeCount: '50-200',
      fundingStage: 'Series B',
      recentNews: ['Raised $10M', 'Launched new product'],
    };

    const mockProspectResearch: ProspectResearchData[] = [
      {
        name: 'John Doe',
        title: 'CTO',
        companyName: 'Acme Corp',
        location: 'San Francisco',
        background: 'Former Google engineer',
      },
    ];

    it('should successfully generate a research brief with all sections', async () => {
      // Import after mock is set up
      const { generateResearchBrief } = await import('@/lib/services/claude');

      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              confidenceRating: 'HIGH',
              confidenceExplanation: 'All data points verified',
              companyOverview: 'Acme Corp is a technology company...',
              painPoints: 'They likely struggle with scalability...',
              howWeFit: 'Our AI platform can help them scale...',
              openingLine: 'Hi John, congrats on the recent funding...',
              discoveryQuestions: ['What are your current AI challenges?'],
              successOutcome: 'Identify 2-3 specific use cases',
              watchOuts: 'May be budget-constrained after recent funding',
              recentSignals: ['Raised $10M Series B', 'Hired new VP of Engineering'],
            }),
          },
        ],
        stop_reason: 'end_turn',
      });

      const result = await generateResearchBrief({
        campaignContext: mockCampaignContext,
        companyResearch: mockCompanyResearch,
        prospectResearch: mockProspectResearch,
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 4000,
          temperature: 0.3,
        })
      );

      expect(result).toEqual({
        confidenceRating: 'HIGH',
        confidenceExplanation: 'All data points verified',
        companyOverview: 'Acme Corp is a technology company...',
        painPoints: 'They likely struggle with scalability...',
        howWeFit: 'Our AI platform can help them scale...',
        openingLine: 'Hi John, congrats on the recent funding...',
        discoveryQuestions: ['What are your current AI challenges?'],
        successOutcome: 'Identify 2-3 specific use cases',
        watchOuts: 'May be budget-constrained after recent funding',
        recentSignals: ['Raised $10M Series B', 'Hired new VP of Engineering'],
      });
    });

    it('should handle LOW confidence when data is limited', async () => {
      const { generateResearchBrief } = await import('@/lib/services/claude');

      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              confidenceRating: 'LOW',
              confidenceExplanation: 'Limited public information available',
              companyOverview: 'Limited information about this company',
              painPoints: 'Unable to determine specific pain points',
              howWeFit: 'General AI platform benefits apply',
              openingLine: 'Hi there, would love to learn more about your needs...',
              discoveryQuestions: ['Tell me about your company?'],
              successOutcome: 'Understand their business model',
              watchOuts: 'Need to qualify heavily before proposing solution',
              recentSignals: [],
            }),
          },
        ],
        stop_reason: 'end_turn',
      });

      const result = await generateResearchBrief({
        campaignContext: mockCampaignContext,
        companyResearch: { name: 'Unknown Corp' },
        prospectResearch: [],
      });

      expect(result.confidenceRating).toBe('LOW');
      expect(result.confidenceExplanation).toContain('Limited');
    });

    it('should throw error when API key is missing', async () => {
      const { generateResearchBrief } = await import('@/lib/services/claude');

      delete process.env.ANTHROPIC_API_KEY;

      await expect(
        generateResearchBrief({
          campaignContext: mockCampaignContext,
          companyResearch: mockCompanyResearch,
          prospectResearch: mockProspectResearch,
        })
      ).rejects.toThrow('ANTHROPIC_API_KEY is not configured');
    });

    it('should retry when Claude returns invalid JSON', async () => {
      const { generateResearchBrief } = await import('@/lib/services/claude');

      mockCreate
        // First call returns invalid JSON
        .mockResolvedValueOnce({
          content: [
            {
              type: 'text',
              text: 'This is not valid JSON',
            },
          ],
          stop_reason: 'end_turn',
        })
        // Second call returns valid JSON
        .mockResolvedValueOnce({
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                confidenceRating: 'MEDIUM',
                confidenceExplanation: 'Moderate data available',
                companyOverview: 'Valid response',
              }),
            },
          ],
          stop_reason: 'end_turn',
        });

      const result = await generateResearchBrief({
        campaignContext: mockCampaignContext,
        companyResearch: mockCompanyResearch,
        prospectResearch: mockProspectResearch,
      });

      expect(mockCreate).toHaveBeenCalledTimes(2);
      expect(result.confidenceRating).toBe('MEDIUM');
    });

    it('should throw error after max retries on invalid JSON', async () => {
      const { generateResearchBrief } = await import('@/lib/services/claude');

      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'This is not valid JSON',
          },
        ],
        stop_reason: 'end_turn',
      });

      await expect(
        generateResearchBrief({
          campaignContext: mockCampaignContext,
          companyResearch: mockCompanyResearch,
          prospectResearch: mockProspectResearch,
        })
      ).rejects.toThrow('Failed to get valid JSON response from Claude after 3 attempts');

      expect(mockCreate).toHaveBeenCalledTimes(3);
    });
  });
});
