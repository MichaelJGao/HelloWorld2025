import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import crypto from 'crypto'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Simple in-memory cache for summaries (in production, use Redis or database)
const summaryCache = new Map<string, { data: any, timestamp: number }>()
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

export async function POST(request: NextRequest) {
  try {
    const { text, title, keywords, forceRegenerate } = await request.json()
    
    console.log('Document summary request received:', {
      textLength: text?.length || 0,
      title,
      keywordsCount: keywords?.length || 0,
      forceRegenerate
    })

    if (!text) {
      console.log('Error: No text provided')
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    // Create a cache key based on text content hash
    const textHash = crypto.createHash('md5').update(text).digest('hex')
    const cacheKey = `summary_${textHash}`

    // Check cache first (unless force regenerate is requested)
    if (!forceRegenerate && summaryCache.has(cacheKey)) {
      const cached = summaryCache.get(cacheKey)!
      const now = Date.now()
      
      // Check if cache is still valid
      if (now - cached.timestamp < CACHE_DURATION) {
        return NextResponse.json({
          success: true,
          data: cached.data,
          source: 'Cache',
          cached: true
        })
      } else {
        // Remove expired cache entry
        summaryCache.delete(cacheKey)
      }
    }

    // Try OpenAI first for intelligent document summarization
    try {
      const prompt = `Analyze this document and provide a comprehensive summary. The document appears to be about: ${keywords ? keywords.map((k: any) => k.word).join(', ') : 'various topics'}.

Please provide:

1. **Main Topic**: What is this document primarily about?
2. **Key Findings**: What are the main conclusions or results?
3. **Methodology**: How was the research/analysis conducted?
4. **Important Concepts**: List 5-7 key concepts or terms that are central to understanding this document
5. **Target Audience**: Who would benefit from reading this document?
6. **Practical Applications**: How can the information be applied?
7. **Document Type**: What type of document is this (research paper, technical manual, academic article, etc.)?

Document text (first 4000 characters): "${text.substring(0, 4000)}"

Format your response as a structured JSON object with these exact keys:
{
  "mainTopic": "string",
  "keyFindings": ["string", "string", "string"],
  "methodology": "string",
  "importantConcepts": ["string", "string", "string", "string", "string"],
  "targetAudience": "string",
  "practicalApplications": ["string", "string", "string"],
  "documentType": "string",
  "summary": "string (2-3 paragraph executive summary)",
  "readingTime": "string (estimated reading time)",
  "complexity": "string (beginner/intermediate/advanced)"
}`

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert document analyst. Provide accurate, structured summaries that help readers quickly understand complex documents. Always respond with valid JSON format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3,
      })

      const responseText = completion.choices[0]?.message?.content || '{}'
      
      try {
        const summaryData = JSON.parse(responseText)
        
        // Cache the result
        summaryCache.set(cacheKey, {
          data: summaryData,
          timestamp: Date.now()
        })
        
        console.log('Summary generated successfully via OpenAI')
        return NextResponse.json({
          success: true,
          data: summaryData,
          source: 'OpenAI GPT-3.5'
        })
      } catch (parseError) {
        // If JSON parsing fails, create a structured response from the text
        const fallbackSummary = createFallbackSummary(text, keywords)
        
        // Cache the fallback result
        summaryCache.set(cacheKey, {
          data: fallbackSummary,
          timestamp: Date.now()
        })
        
        return NextResponse.json({
          success: true,
          data: fallbackSummary,
          source: 'OpenAI GPT-3.5 (parsed)'
        })
      }

    } catch (apiError: any) {
      console.error('OpenAI API Error:', apiError)
      console.log('Falling back to local analysis')
      
      // Provide fallback summary based on text analysis
      const fallbackSummary = createFallbackSummary(text, keywords)
      
      // Cache the fallback result
      summaryCache.set(cacheKey, {
        data: fallbackSummary,
        timestamp: Date.now()
      })
      
      return NextResponse.json({
        success: true,
        data: fallbackSummary,
        source: 'Local Analysis (fallback)',
        fallback: true
      })
    }

  } catch (error) {
    console.error('Error generating document summary:', error)
    return NextResponse.json(
      { error: 'Failed to generate document summary' },
      { status: 500 }
    )
  }
}

function createFallbackSummary(text: string, keywords?: Array<{word: string, definition: string, context: string}>): any {
  // Basic text analysis
  const wordCount = text.split(' ').length
  const sentenceCount = text.split(/[.!?]+/).length
  const paragraphCount = text.split(/\n\s*\n/).length
  
  // Estimate reading time (average 200 words per minute)
  const readingTimeMinutes = Math.ceil(wordCount / 200)
  
  // Extract key concepts from keywords if available
  const keyConcepts = keywords ? keywords.slice(0, 5).map(k => k.word) : []
  
  // Determine document type based on content patterns
  let documentType = 'Document'
  if (text.toLowerCase().includes('abstract') && text.toLowerCase().includes('methodology')) {
    documentType = 'Research Paper'
  } else if (text.toLowerCase().includes('introduction') && text.toLowerCase().includes('conclusion')) {
    documentType = 'Academic Article'
  } else if (text.toLowerCase().includes('step') && text.toLowerCase().includes('procedure')) {
    documentType = 'Technical Manual'
  } else if (text.toLowerCase().includes('analysis') && text.toLowerCase().includes('data')) {
    documentType = 'Analytical Report'
  }
  
  // Determine complexity based on word count and technical terms
  let complexity = 'intermediate'
  if (wordCount < 500) complexity = 'beginner'
  else if (wordCount > 2000 || (keywords && keywords.length > 10)) complexity = 'advanced'
  
  // Create basic summary
  const firstParagraph = text.split('\n\n')[0] || text.substring(0, 300)
  const summary = `This ${documentType.toLowerCase()} contains ${wordCount} words across ${paragraphCount} paragraphs. ${firstParagraph.substring(0, 200)}...`
  
  return {
    mainTopic: keyConcepts.length > 0 ? keyConcepts.join(', ') : 'General topic',
    keyFindings: [
      `Document contains ${wordCount} words of content`,
      `Identified ${keywords?.length || 0} key terms and concepts`,
      `Structured in ${paragraphCount} main sections`
    ],
    methodology: 'Text analysis and keyword extraction',
    importantConcepts: keyConcepts.length > 0 ? keyConcepts : ['Content analysis', 'Text processing', 'Document review'],
    targetAudience: complexity === 'beginner' ? 'General readers' : complexity === 'advanced' ? 'Specialists and researchers' : 'Professionals and students',
    practicalApplications: [
      'Research and analysis',
      'Educational purposes',
      'Professional reference'
    ],
    documentType,
    summary,
    readingTime: `${readingTimeMinutes} minute${readingTimeMinutes !== 1 ? 's' : ''}`,
    complexity
  }
}
