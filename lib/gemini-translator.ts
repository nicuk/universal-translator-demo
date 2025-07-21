interface GeminiTranslationRequest {
  text: string;
  sourceLang: string;
  targetLang: string;
}

interface GeminiTranslationResponse {
  translatedText: string;
  confidence?: number;
  error?: string;
}

const LANGUAGE_CODES: Record<string, string> = {
  'en': 'English',
  'zh': 'Chinese (Mandarin)',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'ja': 'Japanese',
  'ko': 'Korean',
  'ar': 'Arabic',
  'hi': 'Hindi',
  'pt': 'Portuguese'
}

class GeminiTranslator {
  private apiKey: string;
  private baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async translate({ text, sourceLang, targetLang }: GeminiTranslationRequest): Promise<GeminiTranslationResponse> {
    if (!text.trim()) {
      return { translatedText: '', error: 'Empty text provided' };
    }

    if (sourceLang === targetLang) {
      return { translatedText: text, confidence: 1.0 };
    }

    try {
      const sourceLanguage = LANGUAGE_CODES[sourceLang] || sourceLang;
      const targetLanguage = LANGUAGE_CODES[targetLang] || targetLang;

      const prompt = `Translate the following text from ${sourceLanguage} to ${targetLanguage}. 
      Only return the translated text, nothing else. 
      Maintain the original tone and context.
      
      Text to translate: "${text}"`;

      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 0.8,
            maxOutputTokens: 1000,
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const translatedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!translatedText) {
        throw new Error('No translation received from Gemini API');
      }

      // Clean up any potential formatting from the AI response
      const cleanedText = translatedText
        .replace(/^["']|["']$/g, '') // Remove surrounding quotes
        .replace(/^Translation:\s*/i, '') // Remove "Translation:" prefix
        .trim();

      return {
        translatedText: cleanedText,
        confidence: 0.95 // Gemini typically provides high-quality translations
      };

    } catch (error) {
      console.error('Gemini translation error:', error);
      
      // Fallback to simple error message
      return {
        translatedText: text, // Return original text as fallback
        error: error instanceof Error ? error.message : 'Translation failed'
      };
    }
  }

  // Batch translation for multiple texts
  async translateBatch(requests: GeminiTranslationRequest[]): Promise<GeminiTranslationResponse[]> {
    const translations = await Promise.allSettled(
      requests.map(req => this.translate(req))
    );

    return translations.map(result => 
      result.status === 'fulfilled' 
        ? result.value 
        : { translatedText: '', error: 'Batch translation failed' }
    );
  }

  // Language detection (using Gemini's capabilities)
  async detectLanguage(text: string): Promise<string> {
    try {
      const prompt = `Detect the language of the following text and return only the ISO 639-1 language code (e.g., "en", "zh", "es"). Text: "${text}"`;

      const detectUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
      const response = await fetch(`${detectUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 10,
          }
        })
      });

      if (!response.ok) {
        throw new Error('Language detection failed');
      }

      const data = await response.json();
      const detectedLang = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase();
      
      return detectedLang || 'en'; // Default to English if detection fails
    } catch (error) {
      console.error('Language detection error:', error);
      return 'en'; // Default fallback
    }
  }
}

// Singleton instance
let geminiTranslator: GeminiTranslator | null = null;

export const getGeminiTranslator = (): GeminiTranslator => {
  if (!geminiTranslator) {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY environment variable is required');
    }
    geminiTranslator = new GeminiTranslator(apiKey);
  }
  return geminiTranslator;
};

export default GeminiTranslator; 