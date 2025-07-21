import { NextRequest, NextResponse } from 'next/server';
import { getGeminiTranslator } from '@/lib/gemini-translator';

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

    // Get translator instance
    const translator = getGeminiTranslator();

    // Perform translation
    const result = await translator.translate({
      text,
      sourceLang,
      targetLang
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      translatedText: result.translatedText,
      confidence: result.confidence,
      sourceLang,
      targetLang,
      originalText: text
    });

  } catch (error) {
    console.error('Translation API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint for API health check
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'Gemini Translation API',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
} 