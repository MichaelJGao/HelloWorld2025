import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { text, keywords, fileName } = await request.json()

    if (!text || !keywords || keywords.length === 0) {
      return NextResponse.json(
        { error: 'Text and keywords are required' },
        { status: 400 }
      )
    }

    // Create an optimized prompt for faster concept map generation
    const prompt = `
Analyze this document and create a concept map showing key relationships. Focus on the most important concepts.

Document: ${text.substring(0, 3000)}${text.length > 3000 ? '...' : ''}

Keywords: ${keywords.slice(0, 10).join(', ')}

Generate a JSON concept map with 8-12 nodes maximum:
{
  "nodes": [
    {
      "id": "unique_id",
      "label": "concept_name", 
      "type": "main|method|keyword|concept|result",
      "x": position_x,
      "y": position_y,
      "importance": 0.2_to_1.0,
      "description": "brief_description"
    }
  ],
  "links": [
    {
      "source": "source_id",
      "target": "target_id", 
      "label": "relationship",
      "strength": 0.2_to_1.0
    }
  ]
}

Guidelines:
- 8-12 nodes max for faster processing
- Position nodes: main concepts (300-500, 200-400), methods (150-650, 100-500), results (100-700, 50-550)
- Use descriptive relationship labels: "leads to", "uses", "produces", "supports", "enables"
- Space nodes 120px apart minimum
- Connect all nodes meaningfully
- Focus on document's core concepts

Return only JSON, no extra text.
`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at creating concept maps. Generate concise, accurate JSON responses quickly.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 1200,
    })

    const response = completion.choices[0]?.message?.content

    if (!response) {
      throw new Error('No response from OpenAI')
    }

    // Parse the JSON response
    let conceptMapData
    try {
      // Clean the response to extract JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        conceptMapData = JSON.parse(jsonMatch[0])
      } else {
        conceptMapData = JSON.parse(response)
      }
    } catch (parseError) {
      console.error('Error parsing concept map response:', parseError)
      console.error('Raw response:', response)
      
      // Fallback: create a simple concept map from keywords with better positioning
      const fallbackNodes = keywords.slice(0, 8).map((keyword: string, index: number) => {
        // Create a grid-like layout to avoid overlaps
        const cols = 3
        const spacing = 180
        const startX = 150
        const startY = 150
        
        const x = startX + (index % cols) * spacing
        const y = startY + Math.floor(index / cols) * spacing
        
        return {
          id: `keyword_${index}`,
          label: keyword,
          type: 'keyword',
          x: Math.min(x, 700), // Keep within bounds
          y: Math.min(y, 500), // Keep within bounds
          importance: 0.6,
          description: `Key concept: ${keyword}`
        }
      })

      // Add some connections between adjacent nodes
      const fallbackLinks = []
      for (let i = 0; i < fallbackNodes.length - 1; i++) {
        if (Math.random() > 0.5) {
          fallbackLinks.push({
            source: fallbackNodes[i].id,
            target: fallbackNodes[i + 1].id,
            label: 'related to',
            strength: 0.5
          })
        }
      }

      conceptMapData = {
        nodes: fallbackNodes,
        links: fallbackLinks
      }
    }

    // Validate and clean the concept map
    const validatedNodes = []
    const validatedLinks = []
    
    // Process nodes
    for (let index = 0; index < conceptMapData.nodes.length; index++) {
      const node = conceptMapData.nodes[index]
      
      // Ensure minimum spacing between nodes
      let x = typeof node.x === 'number' ? Math.max(60, Math.min(740, node.x)) : 150 + (index % 3) * 180
      let y = typeof node.y === 'number' ? Math.max(60, Math.min(540, node.y)) : 150 + Math.floor(index / 3) * 180
      
      // Check for overlaps and adjust if necessary
      for (let i = 0; i < index; i++) {
        const otherNode = validatedNodes[i]
        const distance = Math.sqrt((x - otherNode.x) ** 2 + (y - otherNode.y) ** 2)
        
        if (distance < 120) {
          // Adjust position to avoid overlap
          const angle = Math.random() * 2 * Math.PI
          x = otherNode.x + Math.cos(angle) * 120
          y = otherNode.y + Math.sin(angle) * 120
          
          // Keep within bounds
          x = Math.max(60, Math.min(740, x))
          y = Math.max(60, Math.min(540, y))
        }
      }
      
      validatedNodes.push({
        id: node.id || `node_${index}`,
        label: node.label || 'Unknown Concept',
        type: ['main', 'method', 'keyword', 'concept', 'result'].includes(node.type) ? node.type : 'concept',
        x: x,
        y: y,
        importance: typeof node.importance === 'number' ? Math.max(0.2, Math.min(1.0, node.importance)) : 0.6,
        description: node.description || `Concept: ${node.label || 'Unknown'}`
      })
    }

    // Process links
    if (conceptMapData.links && Array.isArray(conceptMapData.links)) {
      for (const link of conceptMapData.links) {
        // Validate that both source and target nodes exist
        const sourceExists = validatedNodes.some(node => node.id === link.source)
        const targetExists = validatedNodes.some(node => node.id === link.target)
        
        if (sourceExists && targetExists) {
          validatedLinks.push({
            source: link.source,
            target: link.target,
            label: link.label || 'related to',
            strength: typeof link.strength === 'number' ? Math.max(0.2, Math.min(1.0, link.strength)) : 0.5
          })
        }
      }
    }

    return NextResponse.json({
      nodes: validatedNodes,
      links: validatedLinks,
      success: true
    })

  } catch (error) {
    console.error('Error generating concept map:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate concept map',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}