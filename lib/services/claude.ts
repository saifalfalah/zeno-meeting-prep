/**
 * Claude API Service
 *
 * Provides AI capabilities using Anthropic's Claude API.
 * Used for synthesizing research into structured briefs.
 */

import Anthropic from '@anthropic-ai/sdk'

export interface ResearchBriefInput {
  companyOverview: string
  prospectInfo: string[]
  campaignContext: {
    companyName: string
    companyDescription: string
    offeringTitle: string
    offeringDescription: string
    targetCustomer: string
    keyPainPoints: string[]
  }
}

export interface ResearchBriefOutput {
  confidenceRating: 'HIGH' | 'MEDIUM' | 'LOW'
  confidenceExplanation: string
  companyOverview: string
  painPoints: string
  howWeFit: string
  openingLine: string
  discoveryQuestions: string[]
  successOutcome: string
  watchOuts: string
  recentSignals: string[]
}

/**
 * Generates a research brief using Claude API
 */
export async function generateResearchBrief(
  input: ResearchBriefInput
): Promise<ResearchBriefOutput> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set')
  }

  const client = new Anthropic({
    apiKey,
  })

  const prompt = `You are a sales intelligence assistant. Your task is to synthesize research data into a structured, actionable sales brief.

## Input Data

**Company Research:**
${input.companyOverview}

**Prospect Information:**
${input.prospectInfo.join('\n\n')}

**Our Company:**
${input.campaignContext.companyName} - ${input.campaignContext.companyDescription}

**What We're Selling:**
${input.campaignContext.offeringTitle}
${input.campaignContext.offeringDescription}

**Target Customer:**
${input.campaignContext.targetCustomer}

**Pain Points We Solve:**
${input.campaignContext.keyPainPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

## Task

Generate a sales intelligence brief with the following sections. Return ONLY a JSON object with these exact fields:

{
  "confidenceRating": "HIGH" | "MEDIUM" | "LOW",
  "confidenceExplanation": "Brief explanation of data quality and completeness",
  "companyOverview": "2-3 sentences: What they do, their market position, and current trajectory",
  "painPoints": "2-3 sentences: Likely pain points based on their industry, size, and recent developments that align with what we solve",
  "howWeFit": "2-3 sentences: Specific ways our offering addresses their probable challenges",
  "openingLine": "A personalized conversation starter referencing something specific about their company or role",
  "discoveryQuestions": ["Question 1 to uncover needs", "Question 2 to understand priorities", "Question 3 to identify decision criteria", "Question 4 to gauge timing"],
  "successOutcome": "1-2 sentences: What a successful call looks like - specific next steps or commitments to seek",
  "watchOuts": "1-2 sentences: Potential objections or red flags to be aware of",
  "recentSignals": ["Signal 1: Recent development that creates urgency", "Signal 2: Another relevant trigger event"]
}

**Important Guidelines:**
- Be specific and actionable, not generic
- Reference actual data from the research
- If data is limited, acknowledge it in confidenceRating
- If a prospect has minimal info, focus on company-level insights
- Keep language professional but conversational
- Avoid speculation - use "may" or "might" for inferences

Return ONLY the JSON object, no additional text.`

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude API')
    }

    // Parse JSON response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse Claude response as JSON')
    }

    const parsed = JSON.parse(jsonMatch[0]) as ResearchBriefOutput

    // Validate required fields
    if (!parsed.confidenceRating || !parsed.companyOverview) {
      throw new Error('Claude response missing required fields')
    }

    return parsed
  } catch (error) {
    console.error('Claude API error:', error)
    throw error
  }
}

/**
 * Determines confidence rating based on data availability
 */
export function calculateConfidenceRating(
  hasCompanyData: boolean,
  hasProspectData: boolean,
  hasRecentNews: boolean
): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (hasCompanyData && hasProspectData && hasRecentNews) {
    return 'HIGH'
  } else if (hasCompanyData && (hasProspectData || hasRecentNews)) {
    return 'MEDIUM'
  } else {
    return 'LOW'
  }
}
