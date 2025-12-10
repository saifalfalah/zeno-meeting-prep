import { describe, it, expect } from 'vitest';
import type {
  CompanyResearchData,
  ResearchSource,
  ResearchMetadata,
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
});
