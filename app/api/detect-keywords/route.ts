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

    // Use semantic fingerprint-based keyword detection
    const keywords = await semanticFingerprintKeywordDetection(text)
    
        return NextResponse.json({ keywords })

  } catch (error) {
    console.error('Error detecting keywords:', error)
    return NextResponse.json(
      { error: 'Failed to detect keywords' },
      { status: 500 }
    )
  }
}

async function semanticFingerprintKeywordDetection(text: string): Promise<Array<{ word: string; definition: string; context: string; isGPT: boolean }>> {
  const keywords: Array<{ word: string; context: string; score: number }> = []
  const foundTerms = new Set<string>()
  
  // Clean the text to remove non-content sections
  const cleanText = cleanTextForKeywordDetection(text)
  
  // Semantic fingerprint analysis
  const semanticFingerprint = analyzeSemanticFingerprint(cleanText)
  
  // Extract keywords using multiple semantic strategies
  const strategies = [
    () => extractTechnicalTerms(cleanText, semanticFingerprint),
    () => extractFrequentIntegralTerms(cleanText, semanticFingerprint),
    () => extractContextualKeywords(cleanText, semanticFingerprint),
    () => extractDomainSpecificTerms(cleanText, semanticFingerprint),
    () => extractSemanticClusters(cleanText, semanticFingerprint),
    () => extractMultiWordPhrases(cleanText, semanticFingerprint)
  ]
  
  strategies.forEach(strategy => {
    const extractedKeywords = strategy()
    extractedKeywords.forEach(keyword => {
      if (!foundTerms.has(keyword.word.toLowerCase())) {
        foundTerms.add(keyword.word.toLowerCase())
        keywords.push(keyword)
      }
    })
  })
  
  // Remove duplicates and sort by semantic importance score
  const uniqueKeywords = keywords.filter((keyword, index, self) => 
    index === self.findIndex(k => k.word.toLowerCase() === keyword.word.toLowerCase())
  )
  
  // Sort by semantic importance score (higher is better)
  uniqueKeywords.sort((a, b) => b.score - a.score)
  
  // Return top 20 keywords with definitions and context
  const keywordsWithDefinitions = await Promise.all(
    uniqueKeywords.slice(0, 20).map(async k => {
      const definitionResult = await generateDefinition(k.word, cleanText, semanticFingerprint)
      return {
        word: k.word,
        definition: definitionResult.definition,
        context: k.context,
        isGPT: definitionResult.isGPT
      }
    })
  )
  
  return keywordsWithDefinitions
}

function analyzeSemanticFingerprint(text: string) {
  const fingerprint = {
    // Document structure analysis
    sections: extractDocumentSections(text),
    
    // Word frequency analysis
    wordFrequencies: calculateWordFrequencies(text),
    
    // Technical term density
    technicalDensity: calculateTechnicalDensity(text),
    
    // Semantic clusters
    semanticClusters: identifySemanticClusters(text),
    
    // Contextual importance
    contextualImportance: calculateContextualImportance(text),
    
    // Domain indicators
    domainIndicators: identifyDomainIndicators(text)
  }
  
  return fingerprint
}

function extractDocumentSections(text: string) {
  const sections = {
    abstract: extractSection(text, /abstract\s*:?/i),
    introduction: extractSection(text, /introduction\s*:?/i),
    methodology: extractSection(text, /method(?:ology|s)?\s*:?/i),
    results: extractSection(text, /results?\s*:?/i),
    discussion: extractSection(text, /discussion\s*:?/i),
    conclusion: extractSection(text, /conclusion\s*:?/i)
  }
  
  return sections
}

function extractSection(text: string, pattern: RegExp): string {
  const match = text.match(new RegExp(pattern.source + '([\\s\\S]*?)(?=\\n\\n[A-Z]|\\n[A-Z][a-z]+\\s*:?|$)', 'i'))
  return match ? match[1].trim() : ''
}

function calculateWordFrequencies(text: string): { [key: string]: number } {
  const words = text.toLowerCase().match(/\b[a-zA-Z]{3,}\b/g) || []
  const frequencies: { [key: string]: number } = {}
  
  words.forEach(word => {
    frequencies[word] = (frequencies[word] || 0) + 1
  })
  
  return frequencies
}

function calculateTechnicalDensity(text: string): number {
  const technicalPatterns = [
    /\b\w*(?:ology|ism|tion|sion|ment|ness|ity|ive|ical|able|ible|graphy|metry|nomy|pathy|phobia|philia|ization|ification)\b/gi,
    /\b[A-Z]{2,6}\b/g,
    /\b\w*\d+\w*\b/g
  ]
  
  let technicalCount = 0
  technicalPatterns.forEach(pattern => {
    const matches = text.match(pattern)
    if (matches) technicalCount += matches.length
  })
  
  const totalWords = (text.match(/\b\w+\b/g) || []).length
  return totalWords > 0 ? technicalCount / totalWords : 0
}

function identifySemanticClusters(text: string): string[][] {
  // Group related terms based on co-occurrence and semantic patterns
  const clusters: string[][] = []
  
  // Common semantic clusters in academic papers
  const clusterPatterns = [
    // Research methodology cluster
    ['research', 'study', 'experiment', 'method', 'analysis', 'data', 'results', 'findings'],
    // Technical implementation cluster
    ['algorithm', 'model', 'system', 'framework', 'approach', 'technique', 'methodology'],
    // Statistical analysis cluster
    ['statistical', 'correlation', 'regression', 'significance', 'hypothesis', 'p-value', 'confidence'],
    // Machine learning cluster
    ['machine', 'learning', 'neural', 'network', 'artificial', 'intelligence', 'algorithm', 'model'],
    // Performance evaluation cluster
    ['performance', 'accuracy', 'efficiency', 'evaluation', 'assessment', 'measurement', 'benchmark']
  ]
  
  clusterPatterns.forEach(cluster => {
    const foundTerms = cluster.filter(term => 
      new RegExp(`\\b${term}\\b`, 'i').test(text)
    )
    if (foundTerms.length >= 2) {
      clusters.push(foundTerms)
    }
  })
  
  return clusters
}

function calculateContextualImportance(text: string): { [key: string]: number } {
  const importance: { [key: string]: number } = {}
  
  // Terms that appear in multiple sections are more important
  const sections = extractDocumentSections(text)
  const allSectionText = Object.values(sections).join(' ')
  
  // Calculate importance based on section presence and frequency
  const words = allSectionText.toLowerCase().match(/\b[a-zA-Z]{4,}\b/g) || []
  const wordCounts: { [key: string]: number } = {}
  
  words.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1
  })
  
  Object.entries(wordCounts).forEach(([word, count]) => {
    // Importance score based on frequency and section diversity
    let score = count
    Object.values(sections).forEach(section => {
      if (section.toLowerCase().includes(word)) {
        score += 1
      }
    })
    importance[word] = score
  })
  
  return importance
}

function identifyDomainIndicators(text: string): string[] {
  const domainPatterns = [
    // Computer Science
    /\b(?:algorithm|programming|software|hardware|database|network|security|artificial|intelligence|machine|learning)\b/gi,
    // Medicine/Biology
    /\b(?:patient|clinical|medical|biological|genetic|protein|cell|disease|treatment|therapy)\b/gi,
    // Psychology
    /\b(?:psychological|behavior|cognitive|mental|therapy|counseling|assessment|personality)\b/gi,
    // Economics
    /\b(?:economic|financial|market|investment|revenue|profit|cost|price|demand|supply)\b/gi,
    // Physics
    /\b(?:quantum|particle|energy|force|motion|wave|field|electromagnetic|nuclear|atomic)\b/gi
  ]
  
  const domains: string[] = []
  domainPatterns.forEach((pattern, index) => {
    const matches = text.match(pattern)
    if (matches && matches.length > 3) {
      const domainNames = ['Computer Science', 'Medicine/Biology', 'Psychology', 'Economics', 'Physics']
      domains.push(domainNames[index])
    }
  })
  
  return domains
}

function extractTechnicalTerms(text: string, fingerprint: any): Array<{ word: string; context: string; score: number }> {
  const keywords: Array<{ word: string; context: string; score: number }> = []
  
  const technicalPatterns = [
    // Acronyms
    { pattern: /\b[A-Z]{2,6}\b/g, weight: 0.9 },
    // Technical suffixes
    { pattern: /\b\w*(?:ology|ism|tion|sion|ment|ness|ity|ive|ical|able|ible|graphy|metry|nomy|pathy|phobia|philia|ization|ification)\b/gi, weight: 0.8 },
    // Scientific notation
    { pattern: /\b\w*\d+\w*\b/g, weight: 0.7 },
    // Compound terms
    { pattern: /\b\w+(?:-|_)\w+\b/g, weight: 0.6 }
  ]
  
  technicalPatterns.forEach(({ pattern, weight }) => {
    const matches = text.match(pattern)
    if (matches) {
      matches.forEach(match => {
        if (match.length > 2 && !isCommonWord(match)) {
          keywords.push({
            word: match,
            context: extractContext(text, match),
            score: weight * (fingerprint.wordFrequencies[match.toLowerCase()] || 1)
          })
        }
      })
    }
  })
  
  return keywords
}

function extractFrequentIntegralTerms(text: string, fingerprint: any): Array<{ word: string; context: string; score: number }> {
  const keywords: Array<{ word: string; context: string; score: number }> = []
  
  Object.entries(fingerprint.wordFrequencies).forEach(([word, count]) => {
    const frequency = count as number
    if (frequency >= 3 && word.length > 3 && !isCommonWord(word)) {
      const contextualScore = fingerprint.contextualImportance[word] || frequency
      keywords.push({
        word: word.charAt(0).toUpperCase() + word.slice(1),
        context: extractContext(text, word),
        score: contextualScore * 0.5
      })
    }
  })
  
  return keywords
}

function extractContextualKeywords(text: string, fingerprint: any): Array<{ word: string; context: string; score: number }> {
  const keywords: Array<{ word: string; context: string; score: number }> = []
  
  // Extract terms that appear in multiple sections
  const sectionTerms: { [key: string]: number } = {}
  
  Object.entries(fingerprint.sections).forEach(([sectionName, sectionText]) => {
    if (sectionText && typeof sectionText === 'string') {
      const words = sectionText.toLowerCase().match(/\b[a-zA-Z]{4,}\b/g) || []
      words.forEach((word: string) => {
        if (!isCommonWord(word)) {
          sectionTerms[word] = (sectionTerms[word] || 0) + 1
        }
      })
    }
  })
  
  Object.entries(sectionTerms).forEach(([word, sectionCount]) => {
    if (sectionCount >= 2) {
      keywords.push({
        word: word.charAt(0).toUpperCase() + word.slice(1),
        context: extractContext(text, word),
        score: sectionCount * 0.7
      })
    }
  })
  
  return keywords
}

function extractDomainSpecificTerms(text: string, fingerprint: any): Array<{ word: string; context: string; score: number }> {
  const keywords: Array<{ word: string; context: string; score: number }> = []
  
  // Domain-specific term patterns
  const domainTerms = [
    // Research terms
    'hypothesis', 'methodology', 'empirical', 'quantitative', 'qualitative', 'longitudinal', 'cross-sectional',
    // Statistical terms
    'correlation', 'regression', 'significance', 'p-value', 'confidence', 'interval', 'effect', 'size',
    // Technical terms
    'algorithm', 'optimization', 'implementation', 'evaluation', 'benchmark', 'performance', 'accuracy',
    // Scientific terms
    'experiment', 'observation', 'measurement', 'analysis', 'synthesis', 'validation', 'verification'
  ]
  
  domainTerms.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi')
    const matches = text.match(regex)
    if (matches && matches.length > 0) {
      keywords.push({
        word: term.charAt(0).toUpperCase() + term.slice(1),
        context: extractContext(text, term),
        score: matches.length * 0.6
      })
    }
  })
  
  return keywords
}

function extractSemanticClusters(text: string, fingerprint: any): Array<{ word: string; context: string; score: number }> {
  const keywords: Array<{ word: string; context: string; score: number }> = []
  
  fingerprint.semanticClusters.forEach((cluster: string[]) => {
    cluster.forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi')
      const matches = text.match(regex)
      if (matches && matches.length > 0) {
        keywords.push({
          word: term.charAt(0).toUpperCase() + term.slice(1),
          context: extractContext(text, term),
          score: matches.length * 0.4
        })
      }
    })
  })
  
  return keywords
}

function extractMultiWordPhrases(text: string, fingerprint: any): Array<{ word: string; context: string; score: number }> {
  const keywords: Array<{ word: string; context: string; score: number }> = []
  
  // Common multi-word technical phrases
  const phrasePatterns = [
    // Scientific phrases
    { pattern: /\b(?:deep sea|cell death|protein synthesis|DNA replication|gene expression|cell division|immune response|neural network|machine learning|artificial intelligence|data analysis|statistical significance|control group|experimental design)\b/gi, weight: 0.9 },
    // Medical/Biological phrases
    { pattern: /\b(?:blood pressure|heart rate|brain function|muscle contraction|enzyme activity|hormone levels|immune system|nervous system|cardiovascular system|respiratory system)\b/gi, weight: 0.9 },
    // Technical phrases
    { pattern: /\b(?:user interface|database management|network security|software development|hardware configuration|data processing|algorithm design|system architecture|cloud computing|mobile application)\b/gi, weight: 0.8 },
    // Academic phrases
    { pattern: /\b(?:research methodology|literature review|data collection|statistical analysis|hypothesis testing|peer review|academic writing|theoretical framework|empirical evidence|qualitative research|quantitative research)\b/gi, weight: 0.8 },
    // General compound terms
    { pattern: /\b(?:high school|middle school|elementary school|university level|graduate level|undergraduate level|post graduate|doctoral degree|master's degree|bachelor's degree)\b/gi, weight: 0.7 },
    // Time-related phrases
    { pattern: /\b(?:long term|short term|medium term|real time|over time|in time|on time|at the time|for the time|during the time)\b/gi, weight: 0.6 },
    // Location phrases
    { pattern: /\b(?:north america|south america|european union|middle east|far east|central asia|southeast asia|sub saharan|latin america|north africa)\b/gi, weight: 0.6 }
  ]
  
  phrasePatterns.forEach(({ pattern, weight }) => {
    const matches = text.match(pattern)
    if (matches) {
      matches.forEach(match => {
        const phrase = match.trim()
        if (phrase.length > 3 && !isCommonPhrase(phrase)) {
          keywords.push({
            word: phrase,
            context: extractContext(text, phrase),
            score: weight * (fingerprint.wordFrequencies[phrase.toLowerCase()] || 1)
          })
        }
      })
    }
  })

  // Extract custom phrases from the document (2-4 word combinations that appear frequently)
  const words = text.toLowerCase().match(/\b[a-zA-Z]{3,}\b/g) || []
  const phraseCounts: { [key: string]: number } = {}
  
  // Look for 2-word phrases
  for (let i = 0; i < words.length - 1; i++) {
    const phrase = `${words[i]} ${words[i + 1]}`
    if (!isCommonPhrase(phrase)) {
      phraseCounts[phrase] = (phraseCounts[phrase] || 0) + 1
    }
  }
  
  // Look for 3-word phrases
  for (let i = 0; i < words.length - 2; i++) {
    const phrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`
    if (!isCommonPhrase(phrase)) {
      phraseCounts[phrase] = (phraseCounts[phrase] || 0) + 1
    }
  }
  
  // Add frequent custom phrases
  Object.entries(phraseCounts).forEach(([phrase, count]) => {
    if (count >= 2 && phrase.length > 5) {
      keywords.push({
        word: phrase.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        context: extractContext(text, phrase),
        score: count * 0.5
      })
    }
  })
  
  return keywords
}

function isCommonPhrase(phrase: string): boolean {
  const commonPhrases = [
    'the same', 'in the', 'on the', 'at the', 'for the', 'with the', 'to the', 'of the', 'and the', 'or the',
    'this is', 'that is', 'there is', 'there are', 'it is', 'it was', 'it has', 'it will', 'it can', 'it may',
    'as well', 'as well as', 'such as', 'for example', 'for instance', 'in addition', 'in fact', 'in order',
    'at least', 'at most', 'at all', 'at once', 'at first', 'at last', 'at best', 'at worst',
    'on the other hand', 'on the contrary', 'on average', 'on purpose', 'on time', 'on schedule',
    'in general', 'in particular', 'in detail', 'in summary', 'in conclusion', 'in other words',
    'for the most part', 'for the time being', 'for the sake of', 'for the purpose of',
    'as a result', 'as a matter of fact', 'as a whole', 'as a rule', 'as a consequence',
    'due to', 'because of', 'in spite of', 'instead of', 'rather than', 'more than', 'less than',
    'up to', 'down to', 'over to', 'under to', 'through to', 'across to', 'around to',
    'deep sea', 'cell death', 'protein synthesis', 'DNA replication', 'gene expression'
  ]
  
  return commonPhrases.includes(phrase.toLowerCase())
}

async function generateDefinition(word: string, text: string, fingerprint: any): Promise<{ definition: string; isGPT: boolean }> {
  // Check if OpenAI API key is configured
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key') {
    console.log('OpenAI API key not configured, using fallback semantic analysis for:', word)
    return Promise.resolve({ definition: generateSemanticDefinition(word, text, fingerprint), isGPT: false })
  }

  try {
    // Use GPT to generate intelligent keyword definition
    const context = extractContext(text, word, 200)
    const domains = fingerprint.domainIndicators.join(', ') || 'general'
    
    const prompt = `
Analyze the following keyword and provide a clear, concise definition based on its usage in the document context. Focus on:

1. What the term means in this specific context
2. Its role or function in the document
3. Any technical or domain-specific meaning
4. Keep the definition informative but accessible

Keyword: "${word}"
Document Context: "${context}"
Domain: ${domains}

Provide a clear, helpful definition in 1-2 sentences:`

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that provides clear, concise definitions of technical terms based on their usage in documents. Focus on making complex concepts accessible and understandable."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 150,
      temperature: 0.7,
    })

    const definition = response.choices[0]?.message?.content?.trim()
    return Promise.resolve({ 
      definition: definition || generateSemanticDefinition(word, text, fingerprint), 
      isGPT: !!definition 
    })
  } catch (error) {
    console.error('GPT keyword definition generation failed for:', word, error)
    return Promise.resolve({ definition: generateSemanticDefinition(word, text, fingerprint), isGPT: false })
  }
}

function generateSemanticDefinition(word: string, text: string, fingerprint: any): string {
  // Generate contextual definition based on usage patterns
  const context = extractContext(text, word, 200)
  
  // Look for definition patterns
  const definitionPatterns = [
    new RegExp(`${word}\\s*(?:is|are|refers to|means|denotes|represents)\\s*([^.]{10,100})`, 'i'),
    new RegExp(`(?:is|are|refers to|means|denotes|represents)\\s*${word}\\s*([^.]{10,100})`, 'i'),
    new RegExp(`${word}\\s*\\(([^)]{10,100})\\)`, 'i')
  ]
  
  for (const pattern of definitionPatterns) {
    const match = context.match(pattern)
    if (match) {
      return match[1].trim()
    }
  }
  
  // Fallback: generate definition based on domain and context
  const domains = fingerprint.domainIndicators
  if (domains.length > 0) {
    return `A ${domains[0].toLowerCase()} term referring to ${word.toLowerCase()}`
  }
  
  return `A technical term used in this context`
}

function isCommonWord(word: string): boolean {
  const commonWords = new Set([
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out',
    'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy',
    'did', 'man', 'men', 'put', 'say', 'she', 'too', 'use', 'way', 'will', 'with', 'this', 'that', 'they',
    'have', 'been', 'were', 'said', 'each', 'which', 'their', 'time', 'about', 'there', 'could', 'other',
    'after', 'first', 'well', 'also', 'where', 'much', 'some', 'these', 'than', 'would', 'like', 'into',
    'more', 'come', 'made', 'many', 'most', 'over', 'such', 'take', 'than', 'them', 'very', 'when', 'work',
    'year', 'your', 'good', 'know', 'just', 'long', 'make', 'right', 'same', 'seem', 'tell', 'turn', 'want',
    'went', 'were', 'what', 'when', 'will', 'with', 'work', 'year', 'your', 'here', 'there', 'where', 'why',
    'how', 'what', 'when', 'where', 'why', 'how', 'what', 'when', 'where', 'why', 'how', 'what', 'when'
  ])
  
  return commonWords.has(word.toLowerCase())
}

function extractContext(text: string, term: string, contextLength: number = 100): string {
  const index = text.toLowerCase().indexOf(term.toLowerCase())
  if (index === -1) return ''
  
  const start = Math.max(0, index - contextLength)
  const end = Math.min(text.length, index + term.length + contextLength)
  
  return text.substring(start, end).trim()
}

function cleanTextForKeywordDetection(text: string): string {
  let cleanedText = text
  
  // Remove references/bibliography sections
  cleanedText = cleanedText.replace(/(references?|bibliography|works cited|sources?)\s*:?.*$/gim, '')
  
  // Remove Creative Commons and copyright information
  cleanedText = cleanedText.replace(/creative commons.*?$/gim, '')
  cleanedText = cleanedText.replace(/copyright.*?$/gim, '')
  cleanedText = cleanedText.replace(/©.*?$/gim, '')
  cleanedText = cleanedText.replace(/all rights reserved.*?$/gim, '')
  
  // Remove author affiliations and acknowledgments
  cleanedText = cleanedText.replace(/acknowledgments?.*?$/gim, '')
  cleanedText = cleanedText.replace(/funding.*?$/gim, '')
  cleanedText = cleanedText.replace(/author affiliations?.*?$/gim, '')
  
  // Remove abstract and metadata sections
  cleanedText = cleanedText.replace(/abstract\s*:?.*?(?=\n\n|\n[A-Z]|$)/gim, '')
  cleanedText = cleanedText.replace(/keywords?\s*:?.*?(?=\n\n|\n[A-Z]|$)/gim, '')
  
  // Remove page numbers and headers/footers
  cleanedText = cleanedText.replace(/^\s*\d+\s*$/gm, '') // Standalone page numbers
  cleanedText = cleanedText.replace(/^page \d+.*$/gim, '') // "Page X" headers
  
  // Remove legal disclaimers and boilerplate
  cleanedText = cleanedText.replace(/disclaimer.*?$/gim, '')
  cleanedText = cleanedText.replace(/terms of use.*?$/gim, '')
  cleanedText = cleanedText.replace(/privacy policy.*?$/gim, '')
  
  // Remove excessive whitespace and normalize
  cleanedText = cleanedText.replace(/\n\s*\n\s*\n/g, '\n\n') // Multiple newlines to double
  cleanedText = cleanedText.replace(/^\s+|\s+$/gm, '') // Trim each line
  cleanedText = cleanedText.trim()
  
  return cleanedText
}
