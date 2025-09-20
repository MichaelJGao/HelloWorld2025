import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { term, context, searchOnline } = await request.json()

    if (!term) {
      return NextResponse.json({ error: 'Term is required' }, { status: 400 })
    }

    // Try OpenAI first, but provide fallback if quota exceeded
    try {
             const prompt = searchOnline
               ? `Provide a concise definition for "${term}". Aim for 2-3 sentences. Include the essential meaning and key information.`
               : `Based on the document context, give a concise definition for "${term}". 

IMPORTANT: 
- If "${term}" is an acronym, find its definition within the document context first
- Focus on how it's used specifically in this document
- Keep it to 2-3 sentences
- Make it relevant to this specific document's context

Document context: "${context}"`

             const completion = await openai.chat.completions.create({
               model: "gpt-3.5-turbo",
               messages: [
                 {
                   role: "system",
                   content: "You are a helpful assistant that provides concise, accurate definitions. Keep responses to 2-3 sentences. Focus on essential meaning and document-specific context."
                 },
                 {
                   role: "user",
                   content: prompt
                 }
               ],
               max_tokens: 150,
               temperature: 0.2,
             })

             const summary = completion.choices[0]?.message?.content || 'No summary available.'
             
             // Search for an image related to the term
             let imageUrl = ''
             let imageAlt = ''
             let source = ''
             let wikipediaUrl = ''
             let description = ''
             let imageMessage = ''
             
             try {
               const imageResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/search-image`, {
                 method: 'POST',
                 headers: {
                   'Content-Type': 'application/json',
                 },
                 body: JSON.stringify({ term, context }),
               })
               
               if (imageResponse.ok) {
                 const imageData = await imageResponse.json()
                 imageUrl = imageData.imageUrl || ''
                 imageAlt = imageData.imageAlt || ''
                 source = imageData.source || ''
                 wikipediaUrl = imageData.wikipediaUrl || ''
                 description = imageData.description || ''
                 imageMessage = imageData.message || ''
               }
             } catch (imageError) {
               console.error('Error fetching image:', imageError)
               // Continue without image
             }

             return NextResponse.json({
               summary,
               imageUrl,
               imageAlt,
               source,
               wikipediaUrl,
               description,
               imageMessage
             })

    } catch (apiError: any) {
      console.error('OpenAI API Error:', apiError)
      
      // Provide fallback summary based on common knowledge
      const fallbackSummary = generateFallbackSummary(term, context, searchOnline)
      
      // Try to get an image even for fallback summaries
      let imageUrl = ''
      let imageAlt = ''
      let source = ''
      let wikipediaUrl = ''
      let description = ''
      let imageMessage = ''
      
      try {
        const imageResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/search-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ term, context }),
        })
        
        if (imageResponse.ok) {
          const imageData = await imageResponse.json()
          imageUrl = imageData.imageUrl || ''
          imageAlt = imageData.imageAlt || ''
          source = imageData.source || ''
          wikipediaUrl = imageData.wikipediaUrl || ''
          description = imageData.description || ''
          imageMessage = imageData.message || ''
        }
      } catch (imageError) {
        console.error('Error fetching image for fallback:', imageError)
        // Continue without image
      }
      
      return NextResponse.json({
        summary: fallbackSummary,
        imageUrl,
        imageAlt,
        source,
        wikipediaUrl,
        description,
        imageMessage,
        fallback: true
      })
    }

  } catch (error) {
    console.error('Error generating summary:', error)
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    )
  }
}

function generateFallbackSummary(term: string, context: string, searchOnline: boolean): string {
  // Check if term is an acronym (2-6 uppercase letters)
  const isAcronym = /^[A-Z]{2,6}$/.test(term)
  
  const commonDefinitions: { [key: string]: string } = {
    'research': '**Research** is a systematic investigation to establish facts or principles. It involves gathering information, analyzing data, and drawing conclusions to advance knowledge in a particular field.',
    'analysis': '**Analysis** is the detailed examination of the elements or structure of something. It involves breaking down complex information into smaller parts to understand how they work together.',
    'method': '**Method** refers to a particular procedure for accomplishing something. In research, it describes the systematic approach used to conduct studies and gather data.',
    'algorithm': '**Algorithm** is a step-by-step procedure for solving a problem or completing a task. In computer science, algorithms are fundamental to programming and data processing.',
    'neural network': '**Neural Network** is a computing system inspired by biological neural networks. It consists of interconnected nodes that process information and can learn from data.',
    'machine learning': '**Machine Learning** is a subset of artificial intelligence that focuses on algorithms that can learn and improve from experience without being explicitly programmed.',
    'artificial intelligence': '**Artificial Intelligence (AI)** refers to the simulation of human intelligence in machines. It encompasses various techniques including machine learning, natural language processing, and computer vision.',
    'data': '**Data** refers to facts, statistics, or information used for analysis or reasoning. In research, data is collected through various methods and analyzed to draw conclusions.',
    'model': '**Model** is a simplified representation of a system or process. In research, models help explain complex phenomena and make predictions.',
    'statistical': '**Statistical** relates to statistics, which is the science of collecting, analyzing, and interpreting numerical data to make informed decisions.',
    'classification': '**Classification** is the process of organizing data into categories or groups based on shared characteristics. It\'s commonly used in machine learning and data analysis.',
    'optimization': '**Optimization** is the process of finding the best solution or making something as effective as possible. It involves maximizing or minimizing specific objectives.',
    'experiment': '**Experiment** is a scientific procedure undertaken to test a hypothesis or demonstrate a known fact. It involves controlled conditions and systematic observation.',
    'hypothesis': '**Hypothesis** is a proposed explanation for a phenomenon that can be tested through experimentation or observation.',
    'theory': '**Theory** is a well-substantiated explanation of some aspect of the natural world that has been repeatedly tested and confirmed through observation and experimentation.',
    'methodology': '**Methodology** refers to the systematic approach used to conduct research. It includes the methods, techniques, and procedures employed in a study.',
    'evaluation': '**Evaluation** is the systematic assessment of the value, worth, or quality of something. It involves gathering evidence and making judgments.',
    'performance': '**Performance** refers to how well something functions or operates. In research, it often relates to the effectiveness of algorithms, systems, or methods.',
    'accuracy': '**Accuracy** is the degree to which a measurement, calculation, or specification conforms to the correct value or standard.',
    'precision': '**Precision** refers to the degree of exactness or refinement in measurement or calculation. It indicates how consistent results are when repeated.'
  }

  const lowerTerm = term.toLowerCase()
  
  // Check for exact matches first
  if (commonDefinitions[lowerTerm]) {
    return commonDefinitions[lowerTerm]
  }
  
  // Check for partial matches
  for (const [key, definition] of Object.entries(commonDefinitions)) {
    if (lowerTerm.includes(key) || key.includes(lowerTerm)) {
      return definition
    }
  }
  
  // Special handling for acronyms
  if (isAcronym && context && context.length > 50) {
    return `**${term}** is an acronym that appears in this document. Based on the context: "${context.substring(0, 200)}...", this term is used in relation to the document's main topic. The full expansion of this acronym may be defined elsewhere in the document.`
  }

  // Generic fallback
  if (context && context.length > 50) {
    return `**${term}** appears to be an important concept in this document. Based on the context: "${context.substring(0, 200)}...", this term likely relates to the main topic being discussed. For a more detailed definition, consider consulting a specialized dictionary or academic resource.`
  }
  
  if (isAcronym) {
    return `**${term}** is an acronym that appears in this document. The full expansion and definition may be provided elsewhere in the text. Look for the first occurrence of this acronym, as it's often defined when first introduced.`
  }
  
  return `**${term}** is a term that appears in this document. While we don't have a specific definition available, it seems to be relevant to the document's content. Consider looking up this term in a dictionary or academic resource for more information.`
}
