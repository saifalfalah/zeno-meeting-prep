import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  researchCompany,
  researchProspect,
  performMultiPassResearch,
} from '@/lib/services/perplexity';

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

    // T072: Test timeout error handling
    it('should throw TimeoutError when request exceeds timeout limit', async () => {
      // Mock a delayed response that exceeds the timeout
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({
                    id: 'test-id',
                    model: 'sonar-pro',
                    choices: [{ message: { content: '{}' } }],
                  }),
                } as Response),
              70000 // 70 seconds - exceeds default 60s timeout
            );
          })
      );

      // Should timeout and throw TimeoutError
      await expect(
        researchCompany('acmecorp.com', { timeout: 1000 })
      ).rejects.toThrow();
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

      expect(result.name).toBe('John Doe');
      expect(result.title).toBe('CTO');
      expect(result.companyName).toBe('Acme Corp');
      expect(result.location).toBe('San Francisco, CA');
      expect(result.background).toBe('Former engineer at Google with 15 years experience');
      expect(result.recentActivity).toEqual(['Posted about AI trends', 'Spoke at conference']);

      // T052: Verify sources and metadata are added
      expect(result.sources).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.model).toBe('sonar-pro');
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

      expect(result.name).toBe('Unknown');
      expect(result.title).toBe(null);
      expect(result.companyName).toBe(null);

      // Verify sources and metadata are added
      expect(result.sources).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    it('should throw error when rate limited', async () => {
      // Mock multiple 429 responses (for retry attempts)
      for (let i = 0; i < 3; i++) {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: new Headers({ 'retry-after': '60' }),
          json: async () => ({ error: 'Rate limit exceeded' }),
        } as Response);
      }

      await expect(
        researchProspect({
          email: 'test@example.com',
          name: 'Test User',
        })
      ).rejects.toThrow('Rate limited');
    });
  });

  describe('performMultiPassResearch (US3)', () => {
    // T049: Test that performMultiPassResearch executes 3 passes sequentially
    it('should execute all 3 research passes sequentially', async () => {
      // Mock responses for all 3 passes
      const pass1Response = {
        id: 'test-id-1',
        model: 'sonar-pro',
        choices: [
          {
            message: {
              role: 'assistant',
              content:
                'Company website information from acmecorp.com with detailed insights.',
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

      const pass2Response = {
        id: 'test-id-2',
        model: 'sonar-pro',
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Recent company news and developments from various sources.',
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

      const pass3Response = {
        id: 'test-id-3',
        model: 'sonar-pro',
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Prospect background information from LinkedIn and professional sources.',
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
          json: async () => pass1Response,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => pass2Response,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => pass3Response,
        } as Response);

      const result = await performMultiPassResearch({
        prospectName: 'John Doe',
        prospectEmail: 'john@acmecorp.com',
        companyName: 'Acme Corp',
        companyDomain: 'acmecorp.com',
      });

      // Should have called fetch 3 times (one for each pass)
      expect(global.fetch).toHaveBeenCalledTimes(3);

      // All 3 passes should be present
      expect(result.companyWebsitePass).toBeDefined();
      expect(result.companyWebsitePass?.content).toContain('Company website information');
      expect(result.companyNewsPass).toBeDefined();
      expect(result.companyNewsPass?.content).toContain('Recent company news');
      expect(result.prospectBackgroundPass).toBeDefined();
      expect(result.prospectBackgroundPass?.content).toContain('Prospect background');

      // Should not be partial data (all passes succeeded)
      expect(result.isPartialData).toBe(false);
      expect(result.metadata.passesCompleted).toBe(3);
    });

    it('should continue with remaining passes if one pass fails (graceful degradation)', async () => {
      // Pass 1: Success
      const pass1Response = {
        id: 'test-id-1',
        model: 'sonar-pro',
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Company website information',
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

      // Pass 2: Success
      const pass2Response = {
        id: 'test-id-2',
        model: 'sonar-pro',
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Company news',
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

      // Pass 3: Timeout (simulate by mocking withTimeout to throw)
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => pass1Response,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => pass2Response,
        } as Response)
        .mockRejectedValueOnce(new Error('Timeout after 60000ms'));

      const result = await performMultiPassResearch({
        prospectName: 'John Doe',
        prospectEmail: 'john@acmecorp.com',
        companyDomain: 'acmecorp.com',
      });

      // First 2 passes should succeed
      expect(result.companyWebsitePass).toBeDefined();
      expect(result.companyNewsPass).toBeDefined();

      // Third pass should be null
      expect(result.prospectBackgroundPass).toBeNull();

      // Should be marked as partial data
      expect(result.isPartialData).toBe(true);
      expect(result.metadata.passesCompleted).toBe(2);
      expect(result.metadata.errors).toBeDefined();
      expect(result.metadata.errors?.length).toBeGreaterThan(0);
    });

    it('should use search_domain_filter for Pass 1 when website is provided', async () => {
      const mockResponse = {
        id: 'test-id',
        model: 'sonar-pro',
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Company information',
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

      // Mock all 3 passes
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValue({
          ok: true,
          json: async () => mockResponse,
        } as Response);

      await performMultiPassResearch({
        prospectName: 'John Doe',
        prospectEmail: 'john@acmecorp.com',
        companyName: 'Acme Corp',
        website: 'https://acmecorp.com',
      });

      // Check first API call (Pass 1) for search_domain_filter
      const firstCallBody = JSON.parse(
        (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body
      );
      expect(firstCallBody.search_domain_filter).toEqual(['acmecorp.com']);

      // Pass 2 and 3 should NOT have search_domain_filter
      const secondCallBody = JSON.parse(
        (global.fetch as ReturnType<typeof vi.fn>).mock.calls[1][1].body
      );
      expect(secondCallBody.search_domain_filter).toBeUndefined();

      const thirdCallBody = JSON.parse(
        (global.fetch as ReturnType<typeof vi.fn>).mock.calls[2][1].body
      );
      expect(thirdCallBody.search_domain_filter).toBeUndefined();
    });

    it('should respect per-pass timeout settings', async () => {
      const mockResponse = {
        id: 'test-id',
        model: 'sonar-pro',
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Test content',
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

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await performMultiPassResearch(
        {
          prospectName: 'John Doe',
          prospectEmail: 'john@acmecorp.com',
        },
        {
          perPassTimeout: 30000, // 30 seconds per pass
        }
      );

      expect(result).toBeDefined();
      expect(result.metadata.passesCompleted).toBe(3);
    });

    it('should include operation logs for each pass', async () => {
      const mockResponse = {
        id: 'test-id',
        model: 'sonar-pro',
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Test content',
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

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await performMultiPassResearch({
        prospectName: 'John Doe',
        prospectEmail: 'john@acmecorp.com',
        companyDomain: 'acmecorp.com',
      });

      // Should have operation logs
      expect(result.operationLogs).toBeDefined();
      expect(result.operationLogs?.length).toBe(3);

      // Each log should have required fields
      result.operationLogs?.forEach((log) => {
        expect(log.pass).toBeDefined();
        expect(log.startTime).toBeDefined();
        expect(log.endTime).toBeDefined();
        expect(log.duration).toBeGreaterThanOrEqual(0); // May be 0 in tests due to fast execution
        expect(log.apiCallParams).toBeDefined();
        expect(log.responseMetadata).toBeDefined();
      });
    });
  });
});
