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

      expect(result).toEqual({
        name: 'Acme Corp',
        industry: 'Technology',
        employeeCount: '50-200',
        fundingStage: 'Series B',
        recentNews: ['Raised $10M', 'Launched new product'],
        headquarters: 'San Francisco, CA',
      });
    });

    it('should throw RetryAfterError when rate limited (429)', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({ 'retry-after': '60' }),
        json: async () => ({ error: 'Rate limit exceeded' }),
      } as Response);

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
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      } as Response);

      await expect(researchCompany('acmecorp.com')).rejects.toThrow(
        'Server error'
      );
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
