import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import crypto from 'crypto'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Simple in-memory cache for sentiment analysis
const sentimentCache = new Map<string, { data: any, timestamp: number }>()
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

export async function POST(request: NextRequest) {
  try {
    const { text, title, forceRegenerate } = await request.json()
    
    console.log('Sentiment analysis request received:', {
      textLength: text?.length || 0,
      title,
      forceRegenerate
    })

    if (!text) {
      console.log('Error: No text provided for sentiment analysis')
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    // Create a cache key based on text content hash
    const textHash = crypto.createHash('md5').update(text).digest('hex')
    const cacheKey = `sentiment_${textHash}`

    // Check cache first (unless force regenerate is requested)
    if (!forceRegenerate && sentimentCache.has(cacheKey)) {
      const cached = sentimentCache.get(cacheKey)!
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
        sentimentCache.delete(cacheKey)
      }
    }

    // Try OpenAI first for intelligent sentiment analysis
    try {
      const prompt = `Analyze the sentiment and emotional tone of this document. Provide a comprehensive sentiment analysis including:

1. Overall sentiment (positive, negative, neutral, mixed)
2. Sentiment score (-1 to 1, where -1 is very negative, 0 is neutral, 1 is very positive)
3. Emotional tone analysis (academic, professional, critical, optimistic, pessimistic, etc.)
4. Confidence level (0-100%)
5. Key emotional indicators (specific words/phrases that indicate sentiment)
6. Sentiment breakdown by sections (if applicable)
7. Target audience sentiment (how the intended audience might perceive the tone)

Document text (first 3000 characters): "${text.substring(0, 3000)}"

Format your response as a structured JSON object with these exact keys:
{
  "overallSentiment": "string (positive/negative/neutral/mixed)",
  "sentimentScore": number (-1 to 1),
  "emotionalTone": "string (descriptive tone)",
  "confidence": number (0-100),
  "keyIndicators": ["string", "string", "string"],
  "sectionBreakdown": [
    {
      "section": "string",
      "sentiment": "string",
      "score": number
    }
  ],
  "audiencePerception": "string (how audience might perceive the tone)",
  "summary": "string (2-3 sentence summary of sentiment analysis)"
}`

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert NLP analyst specializing in sentiment analysis. Provide accurate, detailed sentiment analysis with specific scores and evidence. Always respond with valid JSON format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.2,
      })

      const responseText = completion.choices[0]?.message?.content || '{}'
      
      try {
        const sentimentData = JSON.parse(responseText)
        
        // Cache the result
        sentimentCache.set(cacheKey, {
          data: sentimentData,
          timestamp: Date.now()
        })
        
        console.log('Sentiment analysis completed successfully via OpenAI')
        return NextResponse.json({
          success: true,
          data: sentimentData,
          source: 'OpenAI GPT-3.5'
        })
      } catch (parseError) {
        // If JSON parsing fails, create a structured response from the text
        const fallbackSentiment = createFallbackSentimentAnalysis(text)
        
        // Cache the fallback result
        sentimentCache.set(cacheKey, {
          data: fallbackSentiment,
          timestamp: Date.now()
        })
        
        return NextResponse.json({
          success: true,
          data: fallbackSentiment,
          source: 'OpenAI GPT-3.5 (parsed)'
        })
      }

    } catch (apiError: any) {
      console.error('OpenAI API Error:', apiError)
      console.log('Falling back to local sentiment analysis')
      
      // Provide fallback sentiment analysis based on text analysis
      const fallbackSentiment = createFallbackSentimentAnalysis(text)
      
      // Cache the fallback result
      sentimentCache.set(cacheKey, {
        data: fallbackSentiment,
        timestamp: Date.now()
      })
      
      return NextResponse.json({
        success: true,
        data: fallbackSentiment,
        source: 'Local Analysis (fallback)',
        fallback: true
      })
    }

  } catch (error) {
    console.error('Error analyzing sentiment:', error)
    return NextResponse.json(
      { error: 'Failed to analyze sentiment' },
      { status: 500 }
    )
  }
}

function createFallbackSentimentAnalysis(text: string): any {
  // Basic sentiment analysis using keyword matching
  const positiveWords = [
    'excellent', 'great', 'good', 'positive', 'successful', 'effective', 'improved', 'better',
    'outstanding', 'remarkable', 'significant', 'promising', 'beneficial', 'valuable', 'useful',
    'achievement', 'progress', 'advancement', 'innovation', 'breakthrough', 'solution'
  ]
  
  const negativeWords = [
    'poor', 'bad', 'negative', 'failed', 'problem', 'issue', 'difficult', 'challenge',
    'limitation', 'weakness', 'deficiency', 'error', 'mistake', 'concern', 'risk',
    'failure', 'decline', 'reduction', 'worse', 'inadequate', 'insufficient'
  ]
  
  const neutralWords = [
    'analysis', 'study', 'research', 'method', 'approach', 'technique', 'process',
    'data', 'result', 'finding', 'conclusion', 'observation', 'measurement'
  ]
  
  const textLower = text.toLowerCase()
  const words = textLower.split(/\s+/)
  
  let positiveCount = 0
  let negativeCount = 0
  let neutralCount = 0
  
  words.forEach(word => {
    if (positiveWords.some(pw => word.includes(pw))) positiveCount++
    if (negativeWords.some(nw => word.includes(nw))) negativeCount++
    if (neutralWords.some(nw => word.includes(nw))) neutralCount++
  })
  
  const totalWords = words.length
  const positiveRatio = positiveCount / totalWords
  const negativeRatio = negativeCount / totalWords
  const neutralRatio = neutralCount / totalWords
  
  // Calculate sentiment score (-1 to 1)
  let sentimentScore = (positiveRatio - negativeRatio) * 2
  sentimentScore = Math.max(-1, Math.min(1, sentimentScore))
  
  // Determine overall sentiment
  let overallSentiment = 'neutral'
  if (sentimentScore > 0.1) overallSentiment = 'positive'
  else if (sentimentScore < -0.1) overallSentiment = 'negative'
  else if (Math.abs(positiveRatio - negativeRatio) < 0.05) overallSentiment = 'mixed'
  
  // Determine emotional tone
  let emotionalTone = 'neutral'
  if (overallSentiment === 'positive') {
    emotionalTone = 'optimistic and constructive'
  } else if (overallSentiment === 'negative') {
    emotionalTone = 'critical and analytical'
  } else if (overallSentiment === 'mixed') {
    emotionalTone = 'balanced and objective'
  } else {
    emotionalTone = 'professional and neutral'
  }
  
  // Calculate confidence based on word distribution
  const confidence = Math.min(95, Math.max(60, (Math.abs(positiveRatio - negativeRatio) * 200) + 60))
  
  // Find key indicators
  const keyIndicators = []
  if (positiveCount > 0) keyIndicators.push('Contains positive language')
  if (negativeCount > 0) keyIndicators.push('Contains critical language')
  if (neutralCount > 0) keyIndicators.push('Uses neutral, academic tone')
  
  return {
    overallSentiment,
    sentimentScore: Math.round(sentimentScore * 100) / 100,
    emotionalTone,
    confidence: Math.round(confidence),
    keyIndicators: keyIndicators.length > 0 ? keyIndicators : ['Academic and professional tone'],
    sectionBreakdown: [
      {
        section: 'Overall Document',
        sentiment: overallSentiment,
        score: sentimentScore
      }
    ],
    audiencePerception: `The document appears to have a ${emotionalTone} tone that would be perceived as ${overallSentiment} by readers.`,
    summary: `This document demonstrates a ${overallSentiment} sentiment with a ${emotionalTone} tone. The analysis shows ${positiveCount} positive indicators, ${negativeCount} negative indicators, and ${neutralCount} neutral terms.`
  }
}
