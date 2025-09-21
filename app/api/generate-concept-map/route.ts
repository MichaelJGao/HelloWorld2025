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

    // Create a comprehensive prompt for concept map generation using the entire document
    const prompt = `
Analyze the following academic paper text and generate a comprehensive concept map that shows the relationships between key concepts, methods, keywords, and results. Use the ENTIRE document content to extract meaningful concepts and their relationships.

Paper Text:
${text}

Keywords Found:
${keywords.join(', ')}

Please generate a concept map with the following structure:
1. Identify main concepts (core ideas, theories, frameworks, central themes)
2. Identify methods (research methods, techniques, approaches, methodologies)
3. Identify key results/findings (outcomes, conclusions, discoveries)
4. Identify supporting concepts and keywords (important terms, definitions)
5. Determine meaningful relationships between these elements with descriptive labels

Return the response as a JSON object with the following structure:
{
  "nodes": [
    {
      "id": "unique_id",
      "label": "concept_name",
      "type": "main|method|keyword|concept|result",
      "x": position_x,
      "y": position_y,
      "importance": importance_score_0_to_1,
      "description": "brief_description_of_concept"
    }
  ],
  "links": [
    {
      "source": "source_node_id",
      "target": "target_node_id",
      "label": "descriptive_relationship_label",
      "strength": strength_score_0_to_1
    }
  ]
}

Guidelines:
- Create 10-20 meaningful concept nodes from the entire document
- Extract concepts from all sections: abstract, introduction, methodology, results, discussion, conclusion
- Position nodes strategically to avoid overlaps:
  * Main concepts in center (x: 300-500, y: 200-400)
  * Methods around main concepts (x: 150-650, y: 100-500)
  * Results at edges (x: 100-700, y: 50-550)
  * Keywords scattered throughout (x: 100-700, y: 100-500)
- Create meaningful connections with descriptive labels like:
  * "leads to", "causes", "enables", "requires", "supports", "contradicts"
  * "uses", "implements", "applies", "measures", "analyzes"
  * "results in", "produces", "demonstrates", "shows", "confirms"
- Use importance scores to determine node sizes (0.2-1.0)
- Use strength scores for connection thickness (0.2-1.0)
- Ensure all nodes are connected to form a coherent map
- Focus on the most important concepts from the entire paper
- Include both extracted keywords and additional important concepts you identify
- Space nodes at least 120 pixels apart to prevent visual overlap
- Make connections meaningful and based on actual relationships in the text

Return only the JSON object, no additional text.
`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at analyzing academic papers and creating concept maps. You understand research methodologies, key concepts, and how ideas relate to each other in academic writing.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
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
