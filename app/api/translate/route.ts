import { NextRequest, NextResponse } from 'next/server';
import { getGeminiTranslator } from '@/lib/gemini-translator';

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'ready', 
    service: 'Universal Translator API',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, sourceLang = 'en', targetLang } = body;

    // Validation
    if (!text || !targetLang) {
      return NextResponse.json(
        { error: 'Missing required fields: text and targetLang' },
        { status: 400 }
      );
    }

    if (text.length > 5000) {
      return NextResponse.json(
        { error: 'Text too long. Maximum 5000 characters allowed.' },
        { status: 400 }
      );
    }

    // Initialize translator
    const translator = getGeminiTranslator();
    
    // Get translation
    const result = await translator.translate({ text, sourceLang, targetLang });
    const translatedText = result.translatedText;
    
    if (!translatedText) {
      return NextResponse.json(
        { error: 'Translation failed. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      originalText: text,
      translatedText,
      sourceLang,
      targetLang,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error during translation' },
      { status: 500 }
    );
  }
} 