import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { text, context } = await request.json()

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key') {
      console.log('OpenAI API key not configured, using fallback semantic analysis')
      const summary = generateSemanticSummary(text, context)
      return NextResponse.json({ 
        summary,
        success: true,
        fallback: true
      })
    }

    // Use GPT to generate intelligent text summary
    const summary = await generateGPTTextSummary(text, context)
    
    return NextResponse.json({ 
      summary,
      success: true,
      fallback: false
    })

  } catch (error) {
    console.error('Error generating text summary:', error)
    
    // Fallback to semantic analysis if GPT fails
    try {
      const { text, context } = await request.json()
      const summary = generateSemanticSummary(text, context)
      return NextResponse.json({ 
        summary,
        success: true,
        fallback: true
      })
    } catch (fallbackError) {
      return NextResponse.json(
        { error: 'Failed to generate text summary' },
        { status: 500 }
      )
    }
  }
}

async function generateGPTTextSummary(text: string, context?: string): Promise<string> {
  const prompt = `
Analyze the following highlighted text and provide a clear, concise summary that explains what it means in simple terms. Focus on:

1. What the text is describing or explaining
2. Key concepts or ideas mentioned
3. The main purpose or significance
4. Any important details that would help someone understand it better

Keep the summary informative but accessible, around 2-3 sentences.

Highlighted text: "${text}"

${context ? `Context: ${context}` : ''}

Provide a clear, helpful summary:`

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that provides clear, concise explanations of text content. Focus on making complex concepts accessible and understandable."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 200,
      temperature: 0.7,
    })

    const summary = response.choices[0]?.message?.content?.trim()
    return summary || generateSemanticSummary(text, context)
  } catch (error) {
    console.error('GPT text summary generation failed:', error)
    throw error
  }
}

function generateSemanticSummary(text: string, context?: string): string {
  // Clean the text
  const cleanText = text.trim()
  
  // Analyze the text structure and content
  const analysis = analyzeTextContent(cleanText, context)
  
  // Generate summary based on analysis
  return createContextualSummary(analysis)
}

function analyzeTextContent(text: string, context?: string) {
  const analysis = {
    // Basic properties
    wordCount: text.split(/\s+/).length,
    sentenceCount: text.split(/[.!?]+/).filter(s => s.trim().length > 0).length,
    
    // Content analysis
    hasNumbers: /\d/.test(text),
    hasTechnicalTerms: /[A-Z]{2,}|-ology|-ism|-tion|-sion|-ment|-ness|-ity|-ive|-ical|-able|-ible|-graphy|-metry|-nomy|-pathy|-phobia|-philia|-ization|-ification/i.test(text),
    hasAcronyms: /\b[A-Z]{2,6}\b/.test(text),
    hasScientificNotation: /\b\w*\d+\w*\b/.test(text),
    
    // Semantic analysis
    isDefinition: /(?:is|are|refers to|means|denotes|represents|defined as)/i.test(text),
    isExplanation: /(?:because|since|therefore|thus|hence|consequently|as a result)/i.test(text),
    isComparison: /(?:compared to|versus|vs|unlike|similar to|different from)/i.test(text),
    isProcess: /(?:first|then|next|finally|step|process|procedure|method)/i.test(text),
    isResult: /(?:result|outcome|finding|conclusion|shows|demonstrates|indicates)/i.test(text),
    
    // Context analysis
    contextDomain: context ? identifyDomain(context) : 'general',
    contextType: context ? identifyContextType(context) : 'general'
  }
  
  return analysis
}

function identifyDomain(text: string): string {
  const domainPatterns = [
    { pattern: /\b(?:algorithm|programming|software|hardware|database|network|security|artificial|intelligence|machine|learning)\b/gi, domain: 'Computer Science' },
    { pattern: /\b(?:patient|clinical|medical|biological|genetic|protein|cell|disease|treatment|therapy)\b/gi, domain: 'Medicine/Biology' },
    { pattern: /\b(?:psychological|behavior|cognitive|mental|therapy|counseling|assessment|personality)\b/gi, domain: 'Psychology' },
    { pattern: /\b(?:economic|financial|market|investment|revenue|profit|cost|price|demand|supply)\b/gi, domain: 'Economics' },
    { pattern: /\b(?:quantum|particle|energy|force|motion|wave|field|electromagnetic|nuclear|atomic)\b/gi, domain: 'Physics' },
    { pattern: /\b(?:research|study|experiment|method|analysis|data|results|findings|hypothesis|statistical)\b/gi, domain: 'Research' }
  ]
  
  for (const { pattern, domain } of domainPatterns) {
    if (pattern.test(text)) {
      return domain
    }
  }
  
  return 'General'
}

function identifyContextType(text: string): string {
  if (/abstract|introduction|background/i.test(text)) return 'introduction'
  if (/method|procedure|technique|approach/i.test(text)) return 'methodology'
  if (/result|finding|outcome|data/i.test(text)) return 'results'
  if (/discussion|analysis|interpretation/i.test(text)) return 'discussion'
  if (/conclusion|summary|implication/i.test(text)) return 'conclusion'
  return 'general'
}

function createContextualSummary(analysis: any): string {
  const { wordCount, sentenceCount, hasNumbers, hasTechnicalTerms, hasAcronyms, hasScientificNotation, isDefinition, isExplanation, isComparison, isProcess, isResult, contextDomain, contextType } = analysis
  
  // Start with basic description
  let summary = ''
  
  // Add domain context
  if (contextDomain !== 'General') {
    summary += `This ${contextDomain.toLowerCase()} content `
  } else {
    summary += 'This text '
  }
  
  // Add content type description
  if (isDefinition) {
    summary += 'provides a definition or explanation of a concept. '
  } else if (isExplanation) {
    summary += 'explains the reasoning or cause behind something. '
  } else if (isComparison) {
    summary += 'compares different concepts, methods, or results. '
  } else if (isProcess) {
    summary += 'describes a process, procedure, or methodology. '
  } else if (isResult) {
    summary += 'presents findings, results, or conclusions. '
  } else {
    summary += 'contains information about a topic. '
  }
  
  // Add technical content indicators
  const technicalIndicators = []
  if (hasTechnicalTerms) technicalIndicators.push('technical terminology')
  if (hasAcronyms) technicalIndicators.push('acronyms')
  if (hasScientificNotation) technicalIndicators.push('scientific notation')
  if (hasNumbers) technicalIndicators.push('numerical data')
  
  if (technicalIndicators.length > 0) {
    summary += `It includes ${technicalIndicators.join(', ')}. `
  }
  
  // Add length context
  if (wordCount > 50) {
    summary += 'This is a detailed explanation. '
  } else if (wordCount > 20) {
    summary += 'This is a moderate-length explanation. '
  } else {
    summary += 'This is a brief explanation. '
  }
  
  // Add context type information
  if (contextType !== 'general') {
    summary += `The content appears to be from the ${contextType} section of a document. `
  }
  
  // Add practical implications
  if (isProcess || isResult) {
    summary += 'This information may be useful for understanding procedures or outcomes. '
  } else if (isDefinition || isExplanation) {
    summary += 'This information helps clarify concepts and terminology. '
  } else if (isComparison) {
    summary += 'This information helps distinguish between different approaches or results. '
  }
  
  return summary.trim()
}
