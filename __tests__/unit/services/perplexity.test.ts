import { describe, it, expect, vi, beforeEach } from 'vitest';
import { researchCompany, researchProspect } from '@/lib/services/perplexity';

// Mock fetch globally
global.fetch = vi.fn();

describe('Perplexity API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PERPLEXITY_API_KEY = 'test-api-key';
  });

  describe('researchCompany', () => {
    it('should successfully research a company and return structured data', async () => {
      const mockResponse = {
        id: 'test-id',
        model: 'llama-3.1-sonar-large-128k-online',
        choices: [
          {
            message: {
              role: 'assistant',
              content: JSON.stringify({
                name: 'Acme Corp',
                industry: 'Technology',
                employeeCount: '50-200',
                fundingStage: 'Series B',
                recentNews: ['Raised $10M', 'Launched new product'],
                headquarters: 'San Francisco, CA',
              }),
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 200,
          total_tokens: 300,
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await researchCompany('acmecorp.com');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.perplexity.ai/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Bearer'),
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result).toMatchObject({
        name: 'Acme Corp',
        industry: 'Technology',
        employeeCount: '50-200',
        fundingStage: 'Series B',
        recentNews: ['Raised $10M', 'Launched new product'],
        headquarters: 'San Francisco, CA',
      });

      // Verify sources and metadata are added
      expect(result.sources).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.model).toBe('sonar-pro');
      expect(result.metadata?.fallbackOccurred).toBe(false);
    });

    it('should throw RetryAfterError when rate limited (429)', async () => {
      // Mock multiple 429 responses (for retry attempts)
      for (let i = 0; i < 3; i++) {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: new Headers({ 'retry-after': '60' }),
          json: async () => ({ error: 'Rate limit exceeded' }),
        } as Response);
      }

      await expect(researchCompany('acmecorp.com')).rejects.toThrow(
        'Rate limited'
      );
    });

    it('should throw error on non-retryable errors (4xx)', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid request' }),
      } as Response);

      await expect(researchCompany('acmecorp.com')).rejects.toThrow(
        'Invalid request'
      );
    });

    it('should throw retryable error on server errors (5xx)', async () => {
      // Mock multiple 500 responses (for retry attempts)
      for (let i = 0; i < 3; i++) {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ error: 'Server error' }),
        } as Response);
      }

      await expect(researchCompany('acmecorp.com')).rejects.toThrow(
        'Server error'
      );
    });

    // T017: Test sonar-pro model usage
    it('should use sonar-pro model in API calls', async () => {
      const mockResponse = {
        id: 'test-id',
        model: 'sonar-pro',
        choices: [
          {
            message: {
              role: 'assistant',
              content: JSON.stringify({
                name: 'Test Company',
                industry: 'Technology',
              }),
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 200,
          total_tokens: 300,
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await researchCompany('testcompany.com');

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock
        .calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.model).toBe('sonar-pro');
    });

    // T018: Test search_domain_filter parameter
    it('should pass search_domain_filter parameter correctly when provided', async () => {
      const mockResponse = {
        id: 'test-id',
        model: 'sonar-pro',
        choices: [
          {
            message: {
              role: 'assistant',
              content: JSON.stringify({
                name: 'Test Company',
                industry: 'Technology',
              }),
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 200,
          total_tokens: 300,
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await researchCompany('testcompany.com', {
        searchDomainFilter: 'testcompany.com',
      });

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock
        .calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.search_domain_filter).toEqual(['testcompany.com']);
    });

    // T019: Test domain filter fallback logic
    it('should retry without domain filter when initial results are insufficient', async () => {
      // First call with domain filter returns insufficient data
      const insufficientResponse = {
        id: 'test-id-1',
        model: 'sonar-pro',
        choices: [
          {
            message: {
              role: 'assistant',
              content: JSON.stringify({
                name: null,
                industry: null,
              }),
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 50,
          completion_tokens: 20,
          total_tokens: 70,
        },
      };

      // Second call without filter returns complete data
      const completeResponse = {
        id: 'test-id-2',
        model: 'sonar-pro',
        choices: [
          {
            message: {
              role: 'assistant',
              content: JSON.stringify({
                name: 'Test Company',
                industry: 'Technology',
                employeeCount: '100-500',
              }),
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 200,
          total_tokens: 300,
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => insufficientResponse,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => completeResponse,
        } as Response);

      const result = await researchCompany('testcompany.com', {
        searchDomainFilter: 'testcompany.com',
        includeDomainFallback: true,
      });

      // Should have been called twice
      expect(global.fetch).toHaveBeenCalledTimes(2);

      // First call should have domain filter
      const firstCallBody = JSON.parse(
        (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body
      );
      expect(firstCallBody.search_domain_filter).toEqual(['testcompany.com']);

      // Second call should NOT have domain filter
      const secondCallBody = JSON.parse(
        (global.fetch as ReturnType<typeof vi.fn>).mock.calls[1][1].body
      );
      expect(secondCallBody.search_domain_filter).toBeUndefined();

      // Result should have fallback flag
      expect(result.metadata?.fallbackOccurred).toBe(true);
      expect(result.name).toBe('Test Company');
    });
  });

  describe('researchProspect', () => {
    it('should successfully research a prospect and return structured data', async () => {
      const mockResponse = {
        id: 'test-id',
        model: 'llama-3.1-sonar-large-128k-online',
        choices: [
          {
            message: {
              role: 'assistant',
              content: JSON.stringify({
                name: 'John Doe',
                title: 'CTO',
                companyName: 'Acme Corp',
                location: 'San Francisco, CA',
                background: 'Former engineer at Google with 15 years experience',
                recentActivity: ['Posted about AI trends', 'Spoke at conference'],
              }),
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 150,
          total_tokens: 250,
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await researchProspect({
        email: 'john@acmecorp.com',
        name: 'John Doe',
        companyDomain: 'acmecorp.com',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.perplexity.ai/chat/completions',
        expect.objectContaining({
          method: 'POST',
        })
      );

      expect(result).toEqual({
        name: 'John Doe',
        title: 'CTO',
        companyName: 'Acme Corp',
        location: 'San Francisco, CA',
        background: 'Former engineer at Google with 15 years experience',
        recentActivity: ['Posted about AI trends', 'Spoke at conference'],
      });
    });

    it('should handle missing prospect information gracefully', async () => {
      const mockResponse = {
        id: 'test-id',
        model: 'llama-3.1-sonar-large-128k-online',
        choices: [
          {
            message: {
              role: 'assistant',
              content: JSON.stringify({
                name: 'Unknown',
                title: null,
                companyName: null,
              }),
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await researchProspect({
        email: 'unknown@example.com',
      });

      expect(result).toEqual({
        name: 'Unknown',
        title: null,
        companyName: null,
      });
    });

    it('should throw error when rate limited', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({ 'retry-after': '60' }),
        json: async () => ({ error: 'Rate limit exceeded' }),
      } as Response);

      await expect(
        researchProspect({
          email: 'test@example.com',
          name: 'Test User',
        })
      ).rejects.toThrow('Rate limited');
    });
  });
});
