/**
 * Perplexity API Service
 *
 * Provides research capabilities using Perplexity's online models.
 * Uses llama-3.1-sonar-large-128k-online for high-quality research with citations.
 */

export interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface PerplexityResponse {
  id: string
  model: string
  choices: Array<{
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface CompanyResearchResult {
  companyName: string
  industry?: string
  employeeCount?: string
  revenue?: string
  fundingStage?: string
  headquarters?: string
  recentNews: string[]
  keyExecutives: string[]
  products: string[]
  marketPosition: string
  growthTrajectory: string
  sources: Array<{ url: string; title: string }>
}

export interface ProspectResearchResult {
  name: string
  title?: string
  location?: string
  background: string
  reportsTo?: string
  teamSize?: string
  recentActivity: string
  linkedinUrl?: string
  sources: Array<{ url: string; title: string }>
}

/**
 * Researches a company using Perplexity API
 */
export async function researchCompany(
  companyName: string,
  companyDomain?: string
): Promise<CompanyResearchResult> {
  const apiKey = process.env.PERPLEXITY_API_KEY
  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY environment variable is not set')
  }

  const searchQuery = companyDomain
    ? `${companyName} (${companyDomain})`
    : companyName

  const messages: PerplexityMessage[] = [
    {
      role: 'system',
      content: 'You are a business research assistant. Provide factual, cited information about companies. Format your response as JSON.',
    },
    {
      role: 'user',
      content: `Research the company "${searchQuery}". Provide:
1. Industry and market position
2. Company size (employee count, revenue if available)
3. Funding stage and investors
4. Recent news and developments (last 6 months)
5. Key executives and leadership
6. Main products/services
7. Growth trajectory and market trends

Return the information as a JSON object with these fields:
- industry (string)
- employeeCount (string, e.g. "50-200")
- revenue (string if available)
- fundingStage (string)
- headquarters (string)
- recentNews (array of strings, max 5 items)
- keyExecutives (array of strings, max 5 names with titles)
- products (array of strings, max 5 items)
- marketPosition (string, 2-3 sentences)
- growthTrajectory (string, 2-3 sentences)

Cite all sources.`,
    },
  ]

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages,
        temperature: 0.2, // Lower = more factual
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Perplexity API error: ${error.error?.message || response.statusText}`)
    }

    const data: PerplexityResponse = await response.json()
    const content = data.choices[0].message.content

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse Perplexity response as JSON')
    }

    const parsed = JSON.parse(jsonMatch[0])

    return {
      companyName,
      industry: parsed.industry,
      employeeCount: parsed.employeeCount,
      revenue: parsed.revenue,
      fundingStage: parsed.fundingStage,
      headquarters: parsed.headquarters,
      recentNews: parsed.recentNews || [],
      keyExecutives: parsed.keyExecutives || [],
      products: parsed.products || [],
      marketPosition: parsed.marketPosition || '',
      growthTrajectory: parsed.growthTrajectory || '',
      sources: [], // TODO: Extract from citations
    }
  } catch (error) {
    console.error('Perplexity API error:', error)
    throw error
  }
}

/**
 * Researches a prospect using Perplexity API
 */
export async function researchProspect(
  prospectName: string,
  prospectEmail?: string,
  companyName?: string
): Promise<ProspectResearchResult> {
  const apiKey = process.env.PERPLEXITY_API_KEY
  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY environment variable is not set')
  }

  const searchQuery = [prospectName, companyName]
    .filter(Boolean)
    .join(' at ')

  const messages: PerplexityMessage[] = [
    {
      role: 'system',
      content: 'You are a business research assistant. Provide factual, cited information about business professionals. Format your response as JSON.',
    },
    {
      role: 'user',
      content: `Research the professional "${searchQuery}". Provide:
1. Current job title and role
2. Professional background and experience
3. Recent activity (LinkedIn posts, articles, speaking engagements)
4. Team size and organizational structure
5. LinkedIn profile URL

Return the information as a JSON object with these fields:
- title (string)
- location (string if available)
- background (string, 2-3 sentences about professional experience)
- reportsTo (string if available, who they report to)
- teamSize (string if available)
- recentActivity (string, summary of recent professional activity)
- linkedinUrl (string if found)

Cite all sources.`,
    },
  ]

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages,
        temperature: 0.2,
        max_tokens: 1500,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Perplexity API error: ${error.error?.message || response.statusText}`)
    }

    const data: PerplexityResponse = await response.json()
    const content = data.choices[0].message.content

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse Perplexity response as JSON')
    }

    const parsed = JSON.parse(jsonMatch[0])

    return {
      name: prospectName,
      title: parsed.title,
      location: parsed.location,
      background: parsed.background || '',
      reportsTo: parsed.reportsTo,
      teamSize: parsed.teamSize,
      recentActivity: parsed.recentActivity || '',
      linkedinUrl: parsed.linkedinUrl,
      sources: [], // TODO: Extract from citations
    }
  } catch (error) {
    console.error('Perplexity API error:', error)
    throw error
  }
}
