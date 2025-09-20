import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    // Try OpenAI first for intelligent keyword detection
    try {
             const prompt = `Find keywords from this article that are important to the main idea/purpose of the article or acronyms and hard terms. Focus on:

1. Terms central to the article's main purpose and core concepts
2. Acronyms and abbreviations that need explanation
3. Technical jargon and specialized terminology essential to understanding the topic
4. Complex terms that are key to the article's argument or findings
5. Domain-specific concepts that readers might not understand

Exclude common words, basic vocabulary, and references/bibliography sections. Only include terms that are truly important for understanding the article's main points.

Text: "${text.substring(0, 3000)}"

Return a JSON array of objects with this structure:
[
  {
    "word": "exact term as it appears",
    "definition": "brief definition",
    "context": "relevant context from the document"
  }
]

Limit to 12-15 most important terms that are essential to the article's main purpose.`

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert at analyzing academic and technical documents to identify key terms that need explanation. Return only valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3,
      })

      const response = completion.choices[0]?.message?.content || '[]'
      
      try {
        const keywords = JSON.parse(response)
        return NextResponse.json({ keywords })
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', parseError)
        // Fall back to pattern-based detection
        return NextResponse.json({ 
          keywords: fallbackKeywordDetection(text),
          fallback: true 
        })
      }

    } catch (apiError: any) {
      console.error('OpenAI API Error:', apiError)
      
      // Fall back to pattern-based detection
      return NextResponse.json({ 
        keywords: fallbackKeywordDetection(text),
        fallback: true 
      })
    }

  } catch (error) {
    console.error('Error detecting keywords:', error)
    return NextResponse.json(
      { error: 'Failed to detect keywords' },
      { status: 500 }
    )
  }
}

function fallbackKeywordDetection(text: string) {
  const keywords = []
  const foundTerms = new Set<string>()
  
  // Remove references/bibliography sections
  const cleanText = text.replace(/(references?|bibliography|works cited|sources?)\s*:?.*$/gim, '')
  
  // Enhanced patterns for better detection
  const patterns = [
    // Acronyms (2-6 uppercase letters)
    /\b[A-Z]{2,6}\b/g,
    // Technical terms with common suffixes
    /\b\w*(?:ology|ism|tion|sion|ment|ness|ity|ive|ical|able|ible|graphy|metry|nomy|pathy|phobia|philia|ization|ification)\b/gi,
    // Scientific notation and technical terms with numbers
    /\b\w*\d+\w*\b/g,
    // Compound technical terms
    /\b\w+(?:-|_)\w+\b/g,
    // Domain-specific terms
    /\b(?:algorithm|neural|network|machine|learning|artificial|intelligence|data|analysis|statistical|model|optimization|regression|classification|clustering|deep|reinforcement|supervised|unsupervised|research|study|experiment|method|technique|approach|framework|system|process|function|variable|parameter|coefficient|correlation|hypothesis|theory|concept|principle|application|implementation|evaluation|assessment|measurement|calculation|computation|processing|transformation|extraction|prediction|forecasting|modeling|simulation|minimization|maximization|estimation|approximation|interpolation|extrapolation|validation|verification|testing|benchmarking|comparison|synthesis|integration|decomposition|abstraction|generalization|specialization|efficiency|performance|accuracy|precision|recall|sensitivity|specificity|robustness|scalability|reliability|validity|reproducibility|replicability|methodology|empirical|quantitative|qualitative|longitudinal|cross-sectional|meta-analysis|systematic review|randomized|controlled|placebo|double-blind|cohort|case-control|observational|experimental|correlational|descriptive|inferential|parametric|non-parametric|hypothesis|null hypothesis|alternative hypothesis|p-value|significance|confidence interval|effect size|power analysis|sample size|population|sample|variable|independent|dependent|confounding|bias|validity|reliability|generalizability|replicability)\b/gi
  ]

  // First, try specific patterns
  patterns.forEach(pattern => {
    const matches = cleanText.match(pattern)
    if (matches) {
      matches.forEach(match => {
        if (match.length > 2 && !foundTerms.has(match.toLowerCase())) {
          foundTerms.add(match.toLowerCase())
          keywords.push({
            word: match,
            definition: '',
            context: extractContext(cleanText, match)
          })
        }
      })
    }
  })

  // Remove duplicates and sort by relevance
  const uniqueKeywords = keywords.filter((keyword, index, self) => 
    index === self.findIndex(k => k.word.toLowerCase() === keyword.word.toLowerCase())
  )

  return uniqueKeywords.slice(0, 20)
}

function extractContext(text: string, term: string, contextLength: number = 100): string {
  const index = text.toLowerCase().indexOf(term.toLowerCase())
  if (index === -1) return ''
  
  const start = Math.max(0, index - contextLength)
  const end = Math.min(text.length, index + term.length + contextLength)
  
  return text.substring(start, end).trim()
}
