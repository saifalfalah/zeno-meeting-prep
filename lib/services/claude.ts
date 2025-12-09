import Anthropic from '@anthropic-ai/sdk';
import { NonRetriableError, RetryAfterError } from 'inngest';
import type { CompanyResearchData, ProspectResearchData } from './perplexity';

export interface ResearchBriefData {
  confidenceRating: 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceExplanation: string;
  companyOverview?: string;
  painPoints?: string;
  howWeFit?: string;
  openingLine?: string;
  discoveryQuestions?: string[];
  successOutcome?: string;
  watchOuts?: string;
  recentSignals?: string[];
}

export interface CampaignContext {
  companyName: string;
  companyDescription?: string;
  offeringTitle: string;
  offeringDescription: string;
  targetCustomer?: string;
  keyPainPoints?: string[];
}

/**
 * Generate a research brief using Claude API
 * @param input - Campaign context, company research, and prospect research
 * @returns Structured research brief data
 * @throws NonRetriableError when API key is missing or invalid
 * @throws RetryAfterError when rate limited
 * @throws Error for server errors (retryable)
 */
export async function generateResearchBrief(input: {
  campaignContext: CampaignContext;
  companyResearch: CompanyResearchData;
  prospectResearch: ProspectResearchData[];
}): Promise<ResearchBriefData> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new NonRetriableError('ANTHROPIC_API_KEY is not configured');
  }

  const anthropic = new Anthropic({ apiKey });

  const systemPrompt = `You are an expert sales intelligence analyst. Your job is to synthesize research data into actionable intelligence for sales calls.

You will receive:
1. Campaign context (what we're selling and to whom)
2. Company research data
3. Prospect research data (people attending the meeting)

Your task is to generate a comprehensive research brief in JSON format with these fields:

- confidenceRating: "HIGH" | "MEDIUM" | "LOW" based on data availability
- confidenceExplanation: Brief explanation of the confidence rating
- companyOverview: What the company does, their market position (2-3 sentences)
- painPoints: Likely pain points based on company stage, industry, recent news
- howWeFit: How our offering specifically addresses their needs
- openingLine: Personalized conversation starter referencing recent news or background
- discoveryQuestions: Array of 3-5 specific questions to ask on the call
- successOutcome: What a successful call looks like
- watchOuts: Potential objections or red flags to be aware of
- recentSignals: Array of recent company developments (funding, product launches, hires)

Guidelines:
- Be specific and actionable
- Reference actual data points from the research
- If data is limited, acknowledge it in confidence rating and provide general guidance
- Keep language concise and professional
- Focus on what's relevant for THIS specific call

Return ONLY valid JSON, no markdown formatting or additional text.`;

  const userPrompt = `Campaign Context:
- Our Company: ${input.campaignContext.companyName}
- Our Offering: ${input.campaignContext.offeringTitle}
- Description: ${input.campaignContext.offeringDescription}
${input.campaignContext.targetCustomer ? `- Target Customer: ${input.campaignContext.targetCustomer}` : ''}
${input.campaignContext.keyPainPoints?.length ? `- Key Pain Points We Solve: ${input.campaignContext.keyPainPoints.join(', ')}` : ''}

Company Research:
${JSON.stringify(input.companyResearch, null, 2)}

Prospect Research:
${JSON.stringify(input.prospectResearch, null, 2)}

Generate a comprehensive research brief in JSON format.`;

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4000,
        temperature: 0.3,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      // Extract text content
      const textContent = message.content.find((block) => block.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text content in Claude response');
      }

      let jsonText = textContent.text.trim();

      // Remove markdown code blocks if present
      const codeBlockMatch = jsonText.match(/```json\n([\s\S]*?)\n```/);
      if (codeBlockMatch) {
        jsonText = codeBlockMatch[1];
      }

      // Parse JSON
      const parsed = JSON.parse(jsonText);

      // Validate required fields
      if (!parsed.confidenceRating || !parsed.confidenceExplanation) {
        throw new Error('Missing required fields in Claude response');
      }

      return parsed as ResearchBriefData;
    } catch (error) {
      // Handle rate limiting
      if (
        error instanceof Anthropic.RateLimitError ||
        (error as { status?: number }).status === 429
      ) {
        throw new RetryAfterError(
          'Rate limited by Claude API',
          '30s'
        );
      }

      // Handle authentication errors (don't retry)
      if (
        error instanceof Anthropic.AuthenticationError ||
        (error as { status?: number }).status === 401
      ) {
        throw new NonRetriableError('Invalid Anthropic API key');
      }

      // Handle other 4xx errors (don't retry)
      if ((error as { status?: number }).status && (error as { status?: number }).status! >= 400 && (error as { status?: number }).status! < 500) {
        throw new NonRetriableError(`Claude API error: ${(error as Error).message}`);
      }

      // For JSON parsing errors or 5xx errors, retry
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        // Wait before retrying (exponential backoff)
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
        continue;
      }
    }
  }

  // All retries failed
  throw new Error(
    `Failed to get valid JSON response from Claude after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`
  );
}
