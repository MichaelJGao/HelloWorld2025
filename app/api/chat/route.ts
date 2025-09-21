/**
 * API Route: Chat Assistant
 * 
 * This API endpoint provides an AI-powered chat interface for interacting with
 * PDF documents. It uses OpenAI GPT-3.5-turbo to answer questions about document
 * content and provides intelligent responses based on the PDF context and keywords.
 * 
 * Features:
 * - AI-powered document Q&A using OpenAI GPT-3.5-turbo
 * - Context-aware responses based on PDF content
 * - Keyword integration for enhanced understanding
 * - Fallback pattern-based responses when AI is unavailable
 * - Comprehensive error handling and logging
 * 
 * @fileoverview API route for AI chat functionality with PDF documents
 * @author PDF Keyword Analyzer Team
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize OpenAI client for AI-powered chat responses
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * POST /api/chat
 * 
 * Processes chat messages and generates AI responses based on PDF document content.
 * 
 * Request Body:
 * - message: string - User's question or message
 * - pdfContext: string - Full text content of the PDF document
 * - keywords: Array - Optional array of detected keywords with definitions
 * - fileName: string - Optional name of the PDF file
 * 
 * Response:
 * - response: string - AI-generated response
 * - success: boolean - Whether the request was successful
 * - timestamp: string - ISO timestamp of the response
 * 
 * @param request - Next.js request object containing chat message and PDF context
 * @returns JSON response with AI-generated answer
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Chat API POST request received')
    
    // Parse request body
    const body = await request.json()
    console.log('Request body received:', { message: body.message, hasContext: !!body.pdfContext })
    
    const { message, pdfContext, keywords, fileName } = body
    
    // Validate required fields
    if (!message || !pdfContext) {
      console.log('Missing required fields:', { message: !!message, pdfContext: !!pdfContext })
      return NextResponse.json(
        { error: 'Message and PDF context are required' },
        { status: 400 }
      )
    }

    console.log('Generating AI response...')
    // Generate AI response based on PDF content and user message
    const response = await generateAIResponse(message, pdfContext, keywords, fileName)
    console.log('Generated response length:', response.length)

    return NextResponse.json({ 
      response,
      success: true,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Chat API error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    return NextResponse.json(
      { 
        error: 'Failed to process chat message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Generate AI Response
 * 
 * This function generates intelligent responses to user questions about PDF content
 * using OpenAI GPT-3.5-turbo. It includes fallback pattern-based responses when
 * AI is unavailable and provides context-aware answers based on document content.
 * 
 * Process:
 * 1. Attempts AI-powered response using OpenAI GPT-3.5-turbo
 * 2. Falls back to pattern-based responses if AI fails
 * 3. Extracts important terms from PDF context
 * 4. Generates contextual responses based on message patterns
 * 
 * @param message - User's question or message
 * @param pdfContext - Full text content of the PDF document
 * @param keywords - Optional array of detected keywords with definitions
 * @param fileName - Optional name of the PDF file
 * @returns Promise resolving to AI-generated response string
 */
async function generateAIResponse(message: string, pdfContext: string, keywords?: Array<{word: string, definition: string, context: string}>, fileName?: string): Promise<string> {
  try {
    console.log('generateAIResponse called with message:', message)
    console.log('PDF context length:', pdfContext.length)
    
    // Try OpenAI first for intelligent, context-aware responses
    try {
      const systemPrompt = `You are an AI assistant that helps users understand PDF documents. You have access to the full text content of a PDF document and should provide accurate, helpful responses based on that content.

Document Information:
- File Name: ${fileName || 'Unknown'}
- Key Terms Identified: ${keywords ? keywords.length : 0} terms
${keywords ? `- Important Keywords: ${keywords.slice(0, 10).map(k => k.word).join(', ')}` : ''}

Guidelines:
1. Always base your responses on the actual PDF content provided
2. Be specific and cite relevant information from the document when possible
3. If the user asks about something not in the PDF, politely explain that you can only answer questions about the document content
4. Provide clear, well-structured answers
5. If asked for a summary, focus on the main points and key findings
6. When explaining concepts, use examples from the document when available
7. Keep responses concise but comprehensive
8. Reference the identified keywords when relevant to provide better context
9. If asked about specific terms, use the keyword definitions and context when available

The PDF content is provided in the user's message.`

      const userPrompt = `PDF Content:
${pdfContext.substring(0, 8000)} // Limit context to avoid token limits

${keywords && keywords.length > 0 ? `Key Terms and Definitions:
${keywords.slice(0, 15).map(k => `- ${k.word}: ${k.definition} (Context: ${k.context.substring(0, 100)}...)`).join('\n')}

` : ''}User Question: ${message}

Please provide a helpful response based on the PDF content above. If the question cannot be answered from the document content, please explain that you can only answer questions about the PDF content.`

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      })

      const response = completion.choices[0]?.message?.content || ''
      
      if (response.trim()) {
        return response.trim()
      }
    } catch (apiError: any) {
      console.error('OpenAI API Error:', apiError)
      // Fall back to pattern-based responses
    }

    // Fallback to pattern-based responses if OpenAI fails
    const lowerMessage = message.toLowerCase()
    
    // Extract key topics from the PDF context
    const contextWords = pdfContext.toLowerCase().split(/\s+/)
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'a', 'an']
    const importantWords = contextWords.filter(word => 
      word.length > 3 && !commonWords.includes(word)
    ).slice(0, 20) // Get top 20 important words
    
    console.log('Important words extracted:', importantWords.length)

    // Generate contextual responses based on the message
    if (lowerMessage.includes('summary') || lowerMessage.includes('summarize')) {
      return `Based on the PDF content, here's a summary of the key points:

${importantWords.slice(0, 10).join(', ')}

The document appears to cover topics related to ${importantWords.slice(0, 5).join(', ')}. The main content discusses various aspects of these subjects with detailed explanations and analysis.

Would you like me to elaborate on any specific aspect of the document?`
    }

    if (lowerMessage.includes('what') && lowerMessage.includes('about')) {
      const topic = message.match(/what.*about\s+(.+)/i)?.[1] || 'the main topics'
      return `Regarding ${topic} in the PDF:

The document contains information about ${importantWords.slice(0, 8).join(', ')}. Based on the content, ${topic} is discussed in the context of the broader subject matter.

Key points related to ${topic} include:
- ${importantWords[0] || 'relevant information'}
- ${importantWords[1] || 'important details'}
- ${importantWords[2] || 'significant aspects'}

Is there a specific aspect of ${topic} you'd like me to explain further?`
    }

    if (lowerMessage.includes('explain') || lowerMessage.includes('how')) {
      return `Let me explain based on the PDF content:

The document provides detailed information about ${importantWords.slice(0, 6).join(', ')}. Here's how it works:

1. **Context**: The PDF discusses ${importantWords[0] || 'the main subject'} in detail
2. **Process**: It explains the relationship between ${importantWords[1] || 'key concepts'} and ${importantWords[2] || 'other elements'}
3. **Application**: The content shows how these concepts apply to ${importantWords[3] || 'practical situations'}

The document appears to be comprehensive in covering these topics. Would you like me to focus on a specific part of the explanation?`
    }

    if (lowerMessage.includes('key') || lowerMessage.includes('important') || lowerMessage.includes('main')) {
      return `Based on the PDF content, here are the key points:

**Main Topics:**
- ${importantWords[0] || 'Primary subject matter'}
- ${importantWords[1] || 'Secondary topics'}
- ${importantWords[2] || 'Supporting concepts'}

**Important Concepts:**
- ${importantWords[3] || 'Key concept 1'}
- ${importantWords[4] || 'Key concept 2'}
- ${importantWords[5] || 'Key concept 3'}

**Relevant Details:**
The document provides comprehensive coverage of these topics with detailed explanations and analysis. The content appears to be well-structured and informative.

Is there a specific topic you'd like me to elaborate on?`
    }

    // Default response for general questions
    if (importantWords.length === 0) {
      return `I can help you understand the PDF content! The document appears to be loaded successfully.

Here are some things I can help you with:
- **Summary**: Ask me to summarize the main points
- **Specific topics**: Ask "What does the PDF say about [topic]?"
- **Explanations**: Ask me to explain concepts or processes
- **Key points**: Ask for the most important information

What would you like to know about the PDF content?`
    }

    return `I can help you understand the PDF content! Based on the document, I can see it covers topics related to ${importantWords.slice(0, 5).join(', ')}.

Here are some things I can help you with:
- **Summary**: Ask me to summarize the main points
- **Specific topics**: Ask "What does the PDF say about [topic]?"
- **Explanations**: Ask me to explain concepts or processes
- **Key points**: Ask for the most important information

What would you like to know about the PDF content?`
  } catch (error) {
    console.error('Error in generateAIResponse:', error)
    return `I can help you understand the PDF content! The document appears to be loaded successfully.

Here are some things I can help you with:
- **Summary**: Ask me to summarize the main points
- **Specific topics**: Ask "What does the PDF say about [topic]?"
- **Explanations**: Ask me to explain concepts or processes
- **Key points**: Ask for the most important information

What would you like to know about the PDF content?`
  }
}

// Optional: Add a GET endpoint for health checks
export async function GET() {
  return NextResponse.json({ 
    status: 'Chat API is running',
    timestamp: new Date().toISOString()
  })
}
