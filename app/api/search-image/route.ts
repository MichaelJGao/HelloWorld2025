import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { term, context } = await request.json()

    if (!term) {
      return NextResponse.json({ error: 'Term is required' }, { status: 400 })
    }

    try {
      // Search Wikipedia for the term
      const searchQuery = term.replace(/[^a-zA-Z0-9\s]/g, '').trim()
      const encodedQuery = encodeURIComponent(searchQuery)
      
      // First, search for Wikipedia articles
      const searchResponse = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedQuery}`,
        {
          headers: {
            'User-Agent': 'PDF-Keyword-Analyzer/1.0 (Educational Purpose)',
          },
        }
      )

      if (searchResponse.ok) {
        const pageData = await searchResponse.json()
        
        if (pageData.thumbnail && pageData.thumbnail.source) {
          // Get the full-size image URL
          const thumbnailUrl = pageData.thumbnail.source
          const fullImageUrl = thumbnailUrl.replace(/\/\d+px-/, '/800px-')
          
          return NextResponse.json({
            imageUrl: fullImageUrl,
            imageAlt: pageData.description || `Wikipedia image for ${term}`,
            source: 'Wikipedia',
            wikipediaUrl: pageData.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodedQuery}`,
            description: pageData.extract || ''
          })
        }
      }

      // If no Wikipedia image found, try alternative search terms
      const alternativeTerms = generateAlternativeTerms(term, context)
      
      for (const altTerm of alternativeTerms) {
        const altEncodedQuery = encodeURIComponent(altTerm)
        const altResponse = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${altEncodedQuery}`,
          {
            headers: {
              'User-Agent': 'PDF-Keyword-Analyzer/1.0 (Educational Purpose)',
            },
          }
        )

        if (altResponse.ok) {
          const altPageData = await altResponse.json()
          
          if (altPageData.thumbnail && altPageData.thumbnail.source) {
            const thumbnailUrl = altPageData.thumbnail.source
            const fullImageUrl = thumbnailUrl.replace(/\/\d+px-/, '/800px-')
            
            return NextResponse.json({
              imageUrl: fullImageUrl,
              imageAlt: altPageData.description || `Wikipedia image for ${altTerm}`,
              source: 'Wikipedia',
              wikipediaUrl: altPageData.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${altEncodedQuery}`,
              description: altPageData.extract || ''
            })
          }
        }
      }

      // Fallback if no Wikipedia images found
      return NextResponse.json({ 
        imageUrl: getFallbackImageUrl(term),
        fallback: true,
        source: 'Placeholder'
      })

    } catch (apiError: any) {
      console.error('Wikipedia API Error:', apiError)
      
      // Fallback to placeholder image
      return NextResponse.json({ 
        imageUrl: getFallbackImageUrl(term),
        fallback: true,
        source: 'Placeholder'
      })
    }

  } catch (error) {
    console.error('Error searching for image:', error)
    return NextResponse.json(
      { error: 'Failed to search for image' },
      { status: 500 }
    )
  }
}

function generateAlternativeTerms(term: string, context?: string): string[] {
  const alternatives = []
  
  // Remove common suffixes and try base terms
  const baseTerm = term.replace(/(s|es|ing|ed|tion|sion|ity|ness|ment)$/i, '')
  if (baseTerm !== term && baseTerm.length > 2) {
    alternatives.push(baseTerm)
  }
  
  // Try singular/plural forms
  if (term.endsWith('s') && term.length > 3) {
    alternatives.push(term.slice(0, -1))
  } else if (!term.endsWith('s')) {
    alternatives.push(term + 's')
  }
  
  // Extract key terms from context
  if (context) {
    const contextWords = context.split(' ')
      .filter(word => word.length > 3)
      .filter(word => !['the', 'and', 'for', 'with', 'this', 'that', 'from', 'they', 'have', 'been', 'were', 'said', 'each', 'which', 'their', 'time', 'will', 'about', 'there', 'could', 'other', 'after', 'first', 'well', 'also', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us'].includes(word.toLowerCase()))
      .slice(0, 3)
    
    alternatives.push(...contextWords)
  }
  
  return alternatives.slice(0, 5) // Limit to 5 alternatives
}

function getFallbackImageUrl(term: string): string {
  // Use a placeholder service with the term as text
  const encodedTerm = encodeURIComponent(term)
  return `https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=${encodedTerm}`
}
