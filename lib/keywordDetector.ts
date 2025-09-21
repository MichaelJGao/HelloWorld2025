/**
 * Keyword Detection Utility
 * 
 * This module provides functionality for detecting and extracting keywords from
 * text content using pattern matching and domain-specific term recognition.
 * It serves as a fallback when AI-powered keyword detection is unavailable.
 * 
 * Features:
 * - Pattern-based keyword detection using regex
 * - Domain-specific technical term recognition
 * - Context extraction for detected keywords
 * - Duplicate removal and relevance sorting
 * - Fallback to common important words
 * - Configurable context length
 * 
 * @fileoverview Local keyword detection utility with pattern matching
 * @author PDF Keyword Analyzer Team
 * @version 1.0.0
 */

/**
 * Interface for keyword data structure
 */
interface Keyword {
  word: string
  definition: string
  context: string
}

/**
 * Detects keywords in text using pattern matching and domain-specific recognition
 * 
 * This function analyzes text content to identify important terms, technical
 * concepts, and domain-specific vocabulary. It uses multiple detection strategies
 * including regex patterns, acronym detection, and predefined word lists.
 * 
 * Detection Strategies:
 * 1. Acronyms (2-6 uppercase letters)
 * 2. Technical terms with common suffixes
 * 3. Scientific notation and numbered terms
 * 4. Compound technical terms
 * 5. Domain-specific vocabulary
 * 6. Fallback to common important words
 * 
 * @param text - Text content to analyze for keywords
 * @returns Array of detected keywords with context
 */
export function detectKeywords(text: string): Keyword[] {
  const keywords: Keyword[] = []
  const foundTerms = new Set<string>()
  
  // Define regex patterns for different types of technical terms
  const patterns = [
    // Acronyms (2-6 uppercase letters)
    /\b[A-Z]{2,6}\b/g,
    // Technical terms with common suffixes
    /\b\w*(?:ology|ism|tion|sion|ment|ness|ity|ive|ical|able|ible|graphy|metry|nomy|pathy|phobia|philia)\b/gi,
    // Scientific notation and technical terms with numbers
    /\b\w*\d+\w*\b/g,
    // Compound technical terms
    /\b\w+(?:-|_)\w+\b/g,
    // Domain-specific terms (comprehensive list)
    /\b(?:algorithm|neural|network|machine|learning|artificial|intelligence|data|analysis|statistical|model|optimization|regression|classification|clustering|deep|reinforcement|supervised|unsupervised|research|study|experiment|method|technique|approach|framework|system|process|function|variable|parameter|coefficient|correlation|hypothesis|theory|concept|principle|application|implementation|evaluation|assessment|measurement|calculation|computation|processing|transformation|extraction|classification|prediction|forecasting|modeling|simulation|optimization|minimization|maximization|estimation|approximation|interpolation|extrapolation|validation|verification|testing|benchmarking|comparison|analysis|synthesis|integration|decomposition|abstraction|generalization|specialization|optimization|efficiency|performance|accuracy|precision|recall|sensitivity|specificity|robustness|scalability|reliability|validity|reproducibility|replicability)\b/gi
  ]

  // Apply pattern-based detection
  patterns.forEach(pattern => {
    const matches = text.match(pattern)
    if (matches) {
      matches.forEach(match => {
        if (match.length > 2 && !foundTerms.has(match.toLowerCase())) {
          foundTerms.add(match.toLowerCase())
          keywords.push({
            word: match,
            definition: '', // Will be filled by AI-powered definition generation
            context: extractContext(text, match)
          })
        }
      })
    }
  })

  // Fallback to common important words if no patterns match
  if (keywords.length === 0) {
    const commonImportantWords = [
      'research', 'study', 'analysis', 'method', 'approach', 'technique', 'system',
      'process', 'function', 'variable', 'parameter', 'model', 'theory', 'concept',
      'principle', 'application', 'implementation', 'evaluation', 'assessment',
      'measurement', 'calculation', 'computation', 'processing', 'transformation',
      'extraction', 'classification', 'prediction', 'forecasting', 'modeling',
      'simulation', 'optimization', 'minimization', 'maximization', 'estimation',
      'approximation', 'interpolation', 'extrapolation', 'validation', 'verification',
      'testing', 'benchmarking', 'comparison', 'synthesis', 'integration',
      'decomposition', 'abstraction', 'generalization', 'specialization',
      'efficiency', 'performance', 'accuracy', 'precision', 'recall', 'sensitivity',
      'specificity', 'robustness', 'scalability', 'reliability', 'validity',
      'reproducibility', 'replicability', 'algorithm', 'neural', 'network',
      'machine', 'learning', 'artificial', 'intelligence', 'data', 'statistical',
      'regression', 'clustering', 'deep', 'reinforcement', 'supervised', 'unsupervised'
    ]

    commonImportantWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi')
      const matches = text.match(regex)
      if (matches && matches.length > 0 && !foundTerms.has(word.toLowerCase())) {
        foundTerms.add(word.toLowerCase())
        keywords.push({
          word: word,
          definition: '', // Will be filled by AI-powered definition generation
          context: extractContext(text, word)
        })
      }
    })
  }

  // Remove duplicates and limit results
  const uniqueKeywords = keywords.filter((keyword, index, self) => 
    index === self.findIndex(k => k.word.toLowerCase() === keyword.word.toLowerCase())
  )

  return uniqueKeywords.slice(0, 50) // Limit to top 50 keywords
}

/**
 * Extracts context around a specific term in the text
 * 
 * This function finds a term within the text and extracts surrounding context
 * to provide meaningful information about how the term is used.
 * 
 * @param text - Full text content
 * @param term - Term to find context for
 * @param contextLength - Number of characters to include before and after the term
 * @returns Context string around the term
 */
function extractContext(text: string, term: string, contextLength: number = 100): string {
  const index = text.toLowerCase().indexOf(term.toLowerCase())
  if (index === -1) return ''
  
  const start = Math.max(0, index - contextLength)
  const end = Math.min(text.length, index + term.length + contextLength)
  
  return text.substring(start, end).trim()
}
