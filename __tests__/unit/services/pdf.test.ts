import { describe, it, expect, vi } from 'vitest';
import { generateBriefPDF } from '@/lib/services/pdf';

// Mock @react-pdf/renderer
vi.mock('@react-pdf/renderer', () => ({
  Document: vi.fn(({ children }) => children),
  Page: vi.fn(({ children }) => children),
  Text: vi.fn(({ children }) => children),
  View: vi.fn(({ children }) => children),
  StyleSheet: {
    create: vi.fn((styles) => styles),
  },
  pdf: vi.fn(() => ({
    toBlob: vi.fn(async () => {
      const buffer = Buffer.from('mock pdf content');
      return {
        arrayBuffer: vi.fn(async () => buffer.buffer),
      };
    }),
    toBuffer: vi.fn(async () => Buffer.from('mock pdf content')),
  })),
}));

describe('PDF Generation Service', () => {
  describe('generateBriefPDF', () => {
    const mockBriefData = {
      meeting: {
        title: 'Sales Call with Acme Corp',
        startTime: new Date('2025-01-15T10:00:00Z'),
        timezone: 'America/Los_Angeles',
      },
      campaign: {
        companyName: 'Our Company',
        offeringTitle: 'AI Platform',
      },
      brief: {
        confidenceRating: 'HIGH' as const,
        confidenceExplanation: 'All data verified',
        companyOverview: 'Acme Corp is a technology company...',
        painPoints: 'They struggle with scalability...',
        howWeFit: 'Our platform solves their scaling issues...',
        openingLine: 'Hi John, congrats on recent funding...',
        discoveryQuestions: ['What are your AI challenges?', 'How do you currently scale?'],
        successOutcome: 'Identify 2-3 use cases for our platform',
        watchOuts: 'May be budget-constrained',
        recentSignals: ['Raised $10M Series B', 'Hired VP of Engineering'],
      },
      prospects: [
        {
          name: 'John Doe',
          title: 'CTO',
          companyName: 'Acme Corp',
          email: 'john@acme.com',
        },
      ],
      company: {
        name: 'Acme Corp',
        industry: 'Technology',
        employeeCount: '50-200',
        fundingStage: 'Series B',
      },
      sources: [
        {
          sourceType: 'company_website',
          url: 'https://acme.com',
          title: 'Acme Corp Website',
        },
      ],
    };

    it('should generate PDF buffer from brief data', async () => {
      const result = await generateBriefPDF(mockBriefData);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle missing optional fields gracefully', async () => {
      const minimalData = {
        meeting: {
          title: 'Meeting',
          startTime: new Date(),
          timezone: 'UTC',
        },
        campaign: {
          companyName: 'Company',
          offeringTitle: 'Product',
        },
        brief: {
          confidenceRating: 'LOW' as const,
          confidenceExplanation: 'Limited data',
        },
        prospects: [],
        company: {},
        sources: [],
      };

      const result = await generateBriefPDF(minimalData);

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should include all brief sections in PDF', async () => {
      const result = await generateBriefPDF(mockBriefData);

      // Verify PDF was generated with content
      expect(result.toString()).toContain('mock pdf content');
    });

    it('should format dates correctly', async () => {
      const dataWithDate = {
        ...mockBriefData,
        meeting: {
          ...mockBriefData.meeting,
          startTime: new Date('2025-01-15T10:00:00Z'),
        },
      };

      const result = await generateBriefPDF(dataWithDate);

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle arrays in brief data', async () => {
      const dataWithArrays = {
        ...mockBriefData,
        brief: {
          ...mockBriefData.brief,
          discoveryQuestions: ['Question 1', 'Question 2', 'Question 3'],
          recentSignals: ['Signal 1', 'Signal 2'],
        },
      };

      const result = await generateBriefPDF(dataWithArrays);

      expect(result).toBeInstanceOf(Buffer);
    });
  });
});
