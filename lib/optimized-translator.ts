import { createHash } from 'crypto'

interface CachedTranslation {
  text: string
  timestamp: number
  confidence: number
  usage: number
}

interface RegionalConfig {
  geminiEndpoint: string
  azureEndpoint: string
  elevenlabsEndpoint: string
  latency: number
}

class OptimizedTranslator {
  private cache = new Map<string, CachedTranslation>()
  private commonPhrases = new Map<string, Map<string, string>>()
  private regionalConfig: RegionalConfig
  
  constructor(region: 'us-east' | 'eu-west' | 'asia-pacific' = 'us-east') {
    this.regionalConfig = this.getRegionalConfig(region)
    this.preloadCommonPhrases()
  }

  private getRegionalConfig(region: string): RegionalConfig {
    const configs: Record<string, RegionalConfig> = {
      'us-east': {
        geminiEndpoint: 'https://us-central1-aiplatform.googleapis.com',
        azureEndpoint: 'https://eastus.api.cognitive.microsoft.com',
        elevenlabsEndpoint: 'https://api.elevenlabs.io',
        latency: 50
      },
      'eu-west': {
        geminiEndpoint: 'https://europe-west4-aiplatform.googleapis.com',
        azureEndpoint: 'https://westeurope.api.cognitive.microsoft.com', 
        elevenlabsEndpoint: 'https://eu.api.elevenlabs.io',
        latency: 30
      },
      'asia-pacific': {
        geminiEndpoint: 'https://asia-southeast1-aiplatform.googleapis.com',
        azureEndpoint: 'https://southeastasia.api.cognitive.microsoft.com',
        elevenlabsEndpoint: 'https://asia.api.elevenlabs.io',
        latency: 40
      }
    }
    return configs[region] || configs['us-east']
  }

  private preloadCommonPhrases() {
    // Pre-load most common business/conference phrases
    const commonEN = [
      'Hello', 'Thank you', 'Please', 'Yes', 'No', 'Excuse me',
      'How are you?', 'Nice to meet you', 'I understand',
      'Could you repeat that?', 'What is your name?',
      'Where is the bathroom?', 'How much does it cost?',
      'I would like to order', 'The meeting is starting',
      'Let me think about it', 'I agree', 'I disagree'
    ]

    // Pre-translated in major languages for instant lookup
    commonEN.forEach(phrase => {
      this.commonPhrases.set(phrase, new Map([
        ['zh', this.getPreTranslated(phrase, 'zh')],
        ['es', this.getPreTranslated(phrase, 'es')],
        ['fr', this.getPreTranslated(phrase, 'fr')],
        ['de', this.getPreTranslated(phrase, 'de')],
        ['ja', this.getPreTranslated(phrase, 'ja')],
        ['ko', this.getPreTranslated(phrase, 'ko')],
        ['ar', this.getPreTranslated(phrase, 'ar')],
        ['hi', this.getPreTranslated(phrase, 'hi')],
        ['pt', this.getPreTranslated(phrase, 'pt')]
      ]))
    })
  }

  private getPreTranslated(phrase: string, lang: string): string {
    // Pre-computed high-quality translations for common phrases
    const translations: Record<string, Record<string, string>> = {
      'Hello': {
        'zh': '你好', 'es': 'Hola', 'fr': 'Bonjour', 'de': 'Hallo',
        'ja': 'こんにちは', 'ko': '안녕하세요', 'ar': 'مرحبا', 'hi': 'नमस्ते', 'pt': 'Olá'
      },
      'Thank you': {
        'zh': '谢谢', 'es': 'Gracias', 'fr': 'Merci', 'de': 'Danke',
        'ja': 'ありがとう', 'ko': '감사합니다', 'ar': 'شكرا لك', 'hi': 'धन्यवाद', 'pt': 'Obrigado'
      },
      'How are you?': {
        'zh': '你好吗？', 'es': '¿Cómo estás?', 'fr': 'Comment allez-vous?', 'de': 'Wie geht es Ihnen?',
        'ja': '元気ですか？', 'ko': '어떻게 지내세요?', 'ar': 'كيف حالك؟', 'hi': 'आप कैसे हैं?', 'pt': 'Como está?'
      }
      // ... more pre-translations
    }
    return translations[phrase]?.[lang] || phrase
  }

  private getCacheKey(text: string, sourceLang: string, targetLang: string): string {
    return createHash('md5').update(`${text}-${sourceLang}-${targetLang}`).digest('hex')
  }

  async translateOptimized(text: string, sourceLang: string, targetLang: string): Promise<{
    translatedText: string
    latency: number
    source: 'cache' | 'common' | 'ai'
    confidence: number
  }> {
    const startTime = Date.now()

    // 1. Check for exact common phrase match (0ms latency)
    if (this.commonPhrases.has(text)) {
      const translation = this.commonPhrases.get(text)?.get(targetLang)
      if (translation) {
        return {
          translatedText: translation,
          latency: Date.now() - startTime,
          source: 'common',
          confidence: 1.0
        }
      }
    }

    // 2. Check translation cache (~1ms latency)
    const cacheKey = this.getCacheKey(text, sourceLang, targetLang)
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hour cache
      cached.usage++
      return {
        translatedText: cached.text,
        latency: Date.now() - startTime,
        source: 'cache',
        confidence: cached.confidence
      }
    }

    // 3. AI Translation with regional optimization
    try {
      const translation = await this.callRegionalAI(text, sourceLang, targetLang)
      
      // Cache the result
      this.cache.set(cacheKey, {
        text: translation.text,
        timestamp: Date.now(),
        confidence: translation.confidence,
        usage: 1
      })

      return {
        translatedText: translation.text,
        latency: Date.now() - startTime,
        source: 'ai',
        confidence: translation.confidence
      }
    } catch (error) {
      // Fallback to common phrase approximation
      const approximate = this.findApproximateTranslation(text, targetLang)
      return {
        translatedText: approximate,
        latency: Date.now() - startTime,
        source: 'cache',
        confidence: 0.5
      }
    }
  }

  private async callRegionalAI(text: string, sourceLang: string, targetLang: string) {
    // Parallel calls to multiple AI services for fastest response
    const promises = [
      this.callGemini(text, sourceLang, targetLang),
      this.callAzure(text, sourceLang, targetLang)
    ]

    // Return the first successful response
    const result = await Promise.race(promises)
    return result
  }

  private async callGemini(text: string, sourceLang: string, targetLang: string) {
    const response = await fetch(`/api/translate/gemini`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, sourceLang, targetLang })
    })
    return await response.json()
  }

  private async callAzure(text: string, sourceLang: string, targetLang: string) {
    const response = await fetch(`/api/translate/azure`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, sourceLang, targetLang })
    })
    return await response.json()
  }

  private findApproximateTranslation(text: string, targetLang: string): string {
    // Find closest common phrase match using fuzzy matching
    const words = text.toLowerCase().split(' ')
    for (const [phrase, translations] of Array.from(this.commonPhrases.entries())) {
      if (words.some(word => phrase.toLowerCase().includes(word))) {
        return translations.get(targetLang) || text
      }
    }
    return text // Return original if no approximation found
  }

  // Analytics for optimization
  getCacheStats() {
    const cacheHits = Array.from(this.cache.values()).reduce((sum, item) => sum + item.usage, 0)
    const commonHits = this.commonPhrases.size
    return {
      cacheSize: this.cache.size,
      cacheHits,
      commonPhrasesLoaded: commonHits,
      avgConfidence: Array.from(this.cache.values()).reduce((sum, item) => sum + item.confidence, 0) / this.cache.size
    }
  }
}

export default OptimizedTranslator 