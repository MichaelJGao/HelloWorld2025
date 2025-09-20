import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('Chat API POST request received')
    
    const body = await request.json()
    console.log('Request body received:', { message: body.message, hasContext: !!body.pdfContext })
    
    const { message, pdfContext } = body
    
    if (!message || !pdfContext) {
      console.log('Missing required fields:', { message: !!message, pdfContext: !!pdfContext })
      return NextResponse.json(
        { error: 'Message and PDF context are required' },
        { status: 400 }
      )
    }

    console.log('Generating AI response...')
    const response = await generateAIResponse(message, pdfContext)
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

async function generateAIResponse(message: string, pdfContext: string): Promise<string> {
  try {
    console.log('generateAIResponse called with message:', message)
    console.log('PDF context length:', pdfContext.length)
    
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
