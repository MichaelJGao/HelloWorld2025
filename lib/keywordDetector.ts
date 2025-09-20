interface Keyword {
  word: string
  definition: string
  context: string
}

export function detectKeywords(text: string): Keyword[] {
  const keywords: Keyword[] = []
  const foundTerms = new Set<string>()
  
  // Common technical terms and patterns
  const patterns = [
    // Acronyms (2-6 uppercase letters)
    /\b[A-Z]{2,6}\b/g,
    // Technical terms with common suffixes
    /\b\w*(?:ology|ism|tion|sion|ment|ness|ity|ive|ical|able|ible|graphy|metry|nomy|pathy|phobia|philia)\b/gi,
    // Scientific notation and technical terms with numbers
    /\b\w*\d+\w*\b/g,
    // Compound technical terms
    /\b\w+(?:-|_)\w+\b/g,
    // Domain-specific terms
    /\b(?:algorithm|neural|network|machine|learning|artificial|intelligence|data|analysis|statistical|model|optimization|regression|classification|clustering|deep|reinforcement|supervised|unsupervised|research|study|experiment|method|technique|approach|framework|system|process|function|variable|parameter|coefficient|correlation|hypothesis|theory|concept|principle|application|implementation|evaluation|assessment|measurement|calculation|computation|processing|transformation|extraction|classification|prediction|forecasting|modeling|simulation|optimization|minimization|maximization|estimation|approximation|interpolation|extrapolation|validation|verification|testing|benchmarking|comparison|analysis|synthesis|integration|decomposition|abstraction|generalization|specialization|optimization|efficiency|performance|accuracy|precision|recall|sensitivity|specificity|robustness|scalability|reliability|validity|reproducibility|replicability)\b/gi
  ]

  // First, try specific patterns
  patterns.forEach(pattern => {
    const matches = text.match(pattern)
    if (matches) {
      matches.forEach(match => {
        if (match.length > 2 && !foundTerms.has(match.toLowerCase())) {
          foundTerms.add(match.toLowerCase())
          keywords.push({
            word: match,
            definition: '', // Will be filled by OpenAI
            context: extractContext(text, match)
          })
        }
      })
    }
  })

  // If no keywords found with patterns, fallback to common important words
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
          definition: '', // Will be filled by OpenAI
          context: extractContext(text, word)
        })
      }
    })
  }

  // Remove duplicates and sort by relevance
  const uniqueKeywords = keywords.filter((keyword, index, self) => 
    index === self.findIndex(k => k.word.toLowerCase() === keyword.word.toLowerCase())
  )

  return uniqueKeywords.slice(0, 50) // Limit to top 50 keywords
}

function extractContext(text: string, term: string, contextLength: number = 100): string {
  const index = text.toLowerCase().indexOf(term.toLowerCase())
  if (index === -1) return ''
  
  const start = Math.max(0, index - contextLength)
  const end = Math.min(text.length, index + term.length + contextLength)
  
  return text.substring(start, end).trim()
}
