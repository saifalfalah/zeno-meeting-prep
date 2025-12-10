import { describe, it, expect } from 'vitest';
import type {
  CompanyResearchData,
  ResearchSource,
  ResearchMetadata,
  MultiPassResearchResult,
  ProspectResearchData,
} from '@/lib/services/perplexity';

/**
 * Contract tests for Perplexity service data structures
 * These tests verify that the data structures returned by the Perplexity service
 * conform to the expected shape and include required fields for US1.
 */
describe('Perplexity Service Contracts', () => {
  describe('CompanyResearchData structure', () => {
    it('should include sources array field', () => {
      const mockData: CompanyResearchData = {
        name: 'Test Company',
        industry: 'Technology',
        sources: [
          {
            url: 'https://example.com',
            title: 'Example Source',
            snippet: 'Test snippet',
          },
        ],
      };

      expect(mockData.sources).toBeDefined();
      expect(Array.isArray(mockData.sources)).toBe(true);
      expect(mockData.sources.length).toBeGreaterThan(0);
    });

    it('should include metadata field', () => {
      const mockData: CompanyResearchData = {
        name: 'Test Company',
        metadata: {
          model: 'sonar-pro',
          totalTokens: 1500,
          durationMs: 5000,
          timestamp: new Date().toISOString(),
          usedDomainFilter: true,
          fallbackOccurred: false,
        },
      };

      expect(mockData.metadata).toBeDefined();
      expect(mockData.metadata?.model).toBe('sonar-pro');
      expect(mockData.metadata?.timestamp).toBeDefined();
    });

    it('should allow all optional company fields', () => {
      const mockData: CompanyResearchData = {
        name: 'Test Company',
        industry: 'Technology',
        employeeCount: '50-200',
        revenue: '$10M-$50M',
        fundingStage: 'Series B',
        headquarters: 'San Francisco, CA',
        website: 'https://testcompany.com',
        recentNews: ['News item 1', 'News item 2'],
        sources: [],
        metadata: {
          model: 'sonar-pro',
          timestamp: new Date().toISOString(),
        },
      };

      expect(mockData.name).toBeDefined();
      expect(mockData.industry).toBeDefined();
      expect(mockData.sources).toBeDefined();
      expect(mockData.metadata).toBeDefined();
    });
  });

  describe('ResearchSource structure', () => {
    it('should require url field', () => {
      const mockSource: ResearchSource = {
        url: 'https://example.com/article',
        title: 'Example Article',
        snippet: 'Article excerpt...',
      };

      expect(mockSource.url).toBeDefined();
      expect(typeof mockSource.url).toBe('string');
      expect(mockSource.url).toMatch(/^https?:\/\//);
    });

    it('should allow optional title and snippet', () => {
      const mockSource1: ResearchSource = {
        url: 'https://example.com',
      };

      const mockSource2: ResearchSource = {
        url: 'https://example.com',
        title: 'Test Title',
      };

      const mockSource3: ResearchSource = {
        url: 'https://example.com',
        snippet: 'Test snippet',
      };

      expect(mockSource1.url).toBeDefined();
      expect(mockSource2.title).toBeDefined();
      expect(mockSource3.snippet).toBeDefined();
    });
  });

  describe('ResearchMetadata structure', () => {
    it('should include model and timestamp fields', () => {
      const mockMetadata: ResearchMetadata = {
        model: 'sonar-pro',
        timestamp: new Date().toISOString(),
      };

      expect(mockMetadata.model).toBeDefined();
      expect(mockMetadata.timestamp).toBeDefined();
      expect(typeof mockMetadata.model).toBe('string');
      expect(typeof mockMetadata.timestamp).toBe('string');
    });

    it('should include domain filter tracking fields', () => {
      const mockMetadata: ResearchMetadata = {
        model: 'sonar-pro',
        timestamp: new Date().toISOString(),
        usedDomainFilter: true,
        fallbackOccurred: false,
      };

      expect(mockMetadata.usedDomainFilter).toBe(true);
      expect(mockMetadata.fallbackOccurred).toBe(false);
    });

    it('should allow optional performance metrics', () => {
      const mockMetadata: ResearchMetadata = {
        model: 'sonar-pro',
        timestamp: new Date().toISOString(),
        totalTokens: 2500,
        durationMs: 8000,
      };

      expect(mockMetadata.totalTokens).toBe(2500);
      expect(mockMetadata.durationMs).toBe(8000);
    });
  });

  describe('MultiPassResearchResult structure (US3)', () => {
    it('should include data from all 3 passes', () => {
      const mockResult: MultiPassResearchResult = {
        companyWebsitePass: {
          content: 'Company website information...',
          sources: [{ url: 'https://company.com' }],
        },
        companyNewsPass: {
          content: 'Recent company news...',
          sources: [{ url: 'https://news.com/article' }],
        },
        prospectBackgroundPass: {
          content: 'Prospect background information...',
          sources: [{ url: 'https://linkedin.com/in/prospect' }],
        },
        metadata: {
          model: 'sonar-pro',
          timestamp: new Date().toISOString(),
          totalDurationMs: 45000,
          passesCompleted: 3,
        },
        isPartialData: false,
      };

      expect(mockResult.companyWebsitePass).toBeDefined();
      expect(mockResult.companyNewsPass).toBeDefined();
      expect(mockResult.prospectBackgroundPass).toBeDefined();
      expect(mockResult.metadata).toBeDefined();
      expect(mockResult.isPartialData).toBe(false);
    });

    it('should support partial results when passes fail', () => {
      const mockResult: MultiPassResearchResult = {
        companyWebsitePass: {
          content: 'Company website information...',
          sources: [{ url: 'https://company.com' }],
        },
        companyNewsPass: {
          content: 'Recent company news...',
          sources: [{ url: 'https://news.com/article' }],
        },
        prospectBackgroundPass: null,
        metadata: {
          model: 'sonar-pro',
          timestamp: new Date().toISOString(),
          totalDurationMs: 120000,
          passesCompleted: 2,
          errors: ['Pass 3 timed out after 60s'],
        },
        isPartialData: true,
      };

      expect(mockResult.companyWebsitePass).toBeDefined();
      expect(mockResult.companyNewsPass).toBeDefined();
      expect(mockResult.prospectBackgroundPass).toBeNull();
      expect(mockResult.isPartialData).toBe(true);
      expect(mockResult.metadata.passesCompleted).toBe(2);
      expect(mockResult.metadata.errors).toHaveLength(1);
    });

    it('should include operation logs for each pass', () => {
      const mockResult: MultiPassResearchResult = {
        companyWebsitePass: {
          content: 'Test',
          sources: [],
        },
        companyNewsPass: {
          content: 'Test',
          sources: [],
        },
        prospectBackgroundPass: {
          content: 'Test',
          sources: [],
        },
        metadata: {
          model: 'sonar-pro',
          timestamp: new Date().toISOString(),
          totalDurationMs: 45000,
          passesCompleted: 3,
        },
        isPartialData: false,
        operationLogs: [
          {
            pass: 'company_website',
            startTime: Date.now(),
            endTime: Date.now() + 15000,
            duration: 15000,
            apiCallParams: {
              model: 'sonar-pro',
              temperature: 0.2,
              max_tokens: 4000,
              search_domain_filter: ['company.com'],
            },
            responseMetadata: {
              tokenCount: 2000,
              sourcesCited: 3,
            },
            isPartialResult: false,
            fallbackOccurred: false,
          },
        ],
      };

      expect(mockResult.operationLogs).toBeDefined();
      expect(Array.isArray(mockResult.operationLogs)).toBe(true);
      expect(mockResult.operationLogs?.[0].pass).toBe('company_website');
    });
  });

  describe('ProspectResearchData structure (US3)', () => {
    it('should include sources and metadata fields', () => {
      const mockData: ProspectResearchData = {
        name: 'John Doe',
        title: 'VP of Engineering',
        linkedinUrl: 'https://linkedin.com/in/johndoe',
        background: 'Experienced engineering leader...',
        sources: [
          {
            url: 'https://linkedin.com/in/johndoe',
            title: 'LinkedIn Profile',
          },
          {
            url: 'https://company.com/team',
            title: 'Company Team Page',
          },
        ],
        metadata: {
          model: 'sonar-pro',
          timestamp: new Date().toISOString(),
          totalTokens: 1800,
          durationMs: 12000,
        },
      };

      expect(mockData.sources).toBeDefined();
      expect(Array.isArray(mockData.sources)).toBe(true);
      expect(mockData.sources.length).toBeGreaterThan(0);
      expect(mockData.metadata).toBeDefined();
      expect(mockData.metadata?.model).toBe('sonar-pro');
    });

    it('should allow optional prospect fields', () => {
      const mockData: ProspectResearchData = {
        name: 'Jane Smith',
        title: 'CEO',
        company: 'Acme Corp',
        email: 'jane@acme.com',
        linkedinUrl: 'https://linkedin.com/in/janesmith',
        twitterUrl: 'https://twitter.com/janesmith',
        background: 'Serial entrepreneur...',
        recentActivity: ['Spoke at Tech Conference 2024', 'Published article on AI'],
        sources: [],
      };

      expect(mockData.name).toBeDefined();
      expect(mockData.title).toBeDefined();
      expect(mockData.company).toBe('Acme Corp');
      expect(mockData.email).toBe('jane@acme.com');
      expect(mockData.recentActivity).toHaveLength(2);
    });

    it('should support minimal prospect data', () => {
      const mockData: ProspectResearchData = {
        name: 'Unknown Prospect',
        sources: [{ url: 'https://example.com' }],
      };

      expect(mockData.name).toBeDefined();
      expect(mockData.sources).toBeDefined();
    });
  });
});
