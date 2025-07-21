'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: 'Mandarin', flag: '🇨🇳' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'pt', name: 'Portuguese', flag: '🇧🇷' }
]

// Translation Service with Working Fallback
const translateText = async (text: string, from: string, to: string): Promise<string> => {
  try {
    // First try Gemini API
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        sourceLang: from,
        targetLang: to
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.translatedText && data.translatedText !== text) {
        console.log('✅ Gemini translation successful')
        return data.translatedText;
      }
    }
    
    // Fallback to working translation service
    console.log('⚠️ Gemini failed, using fallback translator')
    return await fallbackTranslate(text, from, to);
    
  } catch (error) {
    console.error('Primary translation error:', error);
    return await fallbackTranslate(text, from, to);
  }
}

// Working fallback translator
const fallbackTranslate = async (text: string, from: string, to: string): Promise<string> => {
  try {
    // Use MyMemory API as working backup
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`
    );
    const data = await response.json();
    
    if (data.responseData && data.responseData.translatedText) {
      console.log(`✅ Fallback translation: "${text}" → "${data.responseData.translatedText}"`);
      return data.responseData.translatedText;
    }
    
    // Last resort: Simple phrase mapping
    return getSimpleTranslation(text, to);
  } catch (error) {
    console.error('Fallback translation error:', error);
    return getSimpleTranslation(text, to);
  }
}

// Simple phrase mapping for common words
const getSimpleTranslation = (text: string, targetLang: string): string => {
  const simpleTranslations: Record<string, Record<string, string>> = {
    'hello': {
      'zh': '你好', 'es': 'hola', 'fr': 'bonjour', 'de': 'hallo',
      'ja': 'こんにちは', 'ko': '안녕하세요', 'ar': 'مرحبا', 'hi': 'नमस्ते', 'pt': 'olá'
    },
    'how are you': {
      'zh': '你好吗', 'es': '¿cómo estás?', 'fr': 'comment allez-vous?', 'de': 'wie geht es dir?',
      'ja': '元気ですか', 'ko': '어떻게 지내세요?', 'ar': 'كيف حالك', 'hi': 'आप कैसे हैं?', 'pt': 'como está?'
    },
    'thank you': {
      'zh': '谢谢', 'es': 'gracias', 'fr': 'merci', 'de': 'danke',
      'ja': 'ありがとう', 'ko': '감사합니다', 'ar': 'شكرا لك', 'hi': 'धन्यवाद', 'pt': 'obrigado'
    },
    'good morning': {
      'zh': '早上好', 'es': 'buenos días', 'fr': 'bonjour', 'de': 'guten morgen',
      'ja': 'おはよう', 'ko': '좋은 아침', 'ar': 'صباح الخير', 'hi': 'सुप्रभात', 'pt': 'bom dia'
    },
    'yes': {
      'zh': '是', 'es': 'sí', 'fr': 'oui', 'de': 'ja',
      'ja': 'はい', 'ko': '네', 'ar': 'نعم', 'hi': 'हाँ', 'pt': 'sim'
    },
    'no': {
      'zh': '不', 'es': 'no', 'fr': 'non', 'de': 'nein',
      'ja': 'いいえ', 'ko': '아니요', 'ar': 'لا', 'hi': 'नहीं', 'pt': 'não'
    }
  };
  
  const lowerText = text.toLowerCase().trim();
  const translation = simpleTranslations[lowerText]?.[targetLang];
  
  if (translation) {
    console.log(`✅ Simple translation: "${text}" → "${translation}"`);
    return translation;
  }
  
  console.log(`❌ No translation found for: "${text}"`);
  return text; // Return original if no translation available
}

interface Message {
  id: string
  originalText: string
  translatedText: string
  language: string
  timestamp: Date
  isOwn: boolean
}

export default function RoomPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const roomId = params.roomId as string
  const initialLang = searchParams.get('lang') || 'en'

  const [isListening, setIsListening] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState(initialLang)
  const [messages, setMessages] = useState<Message[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [participants, setParticipants] = useState(1)
  const [currentText, setCurrentText] = useState('')
  
  // Add state to prevent translation loops
  const [lastProcessedText, setLastProcessedText] = useState('')
  const [isTranslating, setIsTranslating] = useState(false)
  const [translationCache, setTranslationCache] = useState<Map<string, string>>(new Map())
  const [aiBackendReady, setAiBackendReady] = useState(false)

  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  // Test AI backend readiness
  useEffect(() => {
    const testAIBackend = async () => {
      try {
        const response = await fetch('/api/translate', {
          method: 'GET'
        })
        if (response.ok) {
          setAiBackendReady(true)
          console.log('✅ AI Backend ready')
        }
      } catch (error) {
        console.log('❌ AI Backend not ready:', error)
        setAiBackendReady(false)
      }
    }
    
    testAIBackend()
  }, [])

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      synthRef.current = window.speechSynthesis

      // Load voices for better language support
      const loadVoices = () => {
        const voices = synthRef.current?.getVoices() || []
        console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`))
      }
      
      if (synthRef.current) {
        loadVoices()
        synthRef.current.onvoiceschanged = loadVoices
      }

      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = true   // Back to continuous for better UX
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = 'en-US'
        recognitionRef.current.maxAlternatives = 1  // Only get the best result

        recognitionRef.current.onstart = () => {
          console.log('🎤 Speech recognition started')
          setIsConnected(true)
        }

        recognitionRef.current.onresult = async (event: any) => {
          let finalTranscript = ''
          let interimTranscript = ''

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript
            } else {
              interimTranscript += transcript
            }
          }

          setCurrentText(interimTranscript)

          if (finalTranscript && finalTranscript.trim()) {
            const cleanedText = finalTranscript.trim()
            
            // Better noise filtering - check for meaningful speech
            if (cleanedText.length < 3 || /^[uh|um|ah|eh|hmm]+$/i.test(cleanedText)) {
              console.log(`🔄 Skipping translation - noise or too short: "${cleanedText}"`)
              return
            }
            
            // Prevent translation loops - check if we just processed this text
            if (cleanedText === lastProcessedText || isTranslating) {
              console.log(`🔄 Skipping translation - already processed: "${cleanedText}"`)
              return
            }

            console.log(`🎤 Original English: "${cleanedText}"`)
            setLastProcessedText(cleanedText)
            setIsTranslating(true)
            
            // Check cache first
            const cacheKey = `${cleanedText}-${currentLanguage}`
            let translatedText = translationCache.get(cacheKey)
            
            if (!translatedText) {
              // Translate the final transcript
              translatedText = await translateText(cleanedText, 'en', currentLanguage)
              
              // Cache the translation
              if (translatedText) {
                setTranslationCache(prev => {
                  const newCache = new Map(prev)
                  newCache.set(cacheKey, translatedText!)
                  // Keep cache size manageable
                  if (newCache.size > 50) {
                    const firstKey = newCache.keys().next().value
                    if (firstKey) {
                      newCache.delete(firstKey)
                    }
                  }
                  return newCache
                })
              }
            } else {
              console.log(`♻️ Using cached translation: "${cleanedText}" → "${translatedText || 'unknown'}"`)
            }
            
            // Ensure we have a valid translation
            const finalTranslatedText = translatedText || cleanedText
            
            console.log(`🔄 Translated to ${currentLanguage}: "${finalTranslatedText}"`)
            
            const newMessage: Message = {
              id: Date.now().toString(),
              originalText: cleanedText,
              translatedText: finalTranslatedText,
              language: currentLanguage,
              timestamp: new Date(),
              isOwn: true
            }

            setMessages(prev => [...prev, newMessage])
            setIsTranslating(false)

            // Speak the translated text with proper voice selection
            if (synthRef.current && currentLanguage !== 'en' && finalTranslatedText && finalTranslatedText !== cleanedText) {
              console.log(`🔊 Speaking translated text: "${finalTranslatedText}"`)
              
              const utterance = new SpeechSynthesisUtterance(finalTranslatedText)
              
              // Set proper language codes and find native voices
              const languageMap: Record<string, string> = {
                'zh': 'zh-CN',
                'es': 'es-ES', 
                'fr': 'fr-FR',
                'de': 'de-DE',
                'ja': 'ja-JP',
                'ko': 'ko-KR',
                'ar': 'ar-SA',
                'hi': 'hi-IN',
                'pt': 'pt-BR'
              }
              
              const targetLang = languageMap[currentLanguage] || currentLanguage
              utterance.lang = targetLang
              
              // Find and select the best native voice
              const voices = synthRef.current.getVoices()
              console.log(`🔍 Available voices for ${targetLang}:`, voices.filter(v => v.lang.startsWith(targetLang.split('-')[0])).map(v => `${v.name} (${v.lang})`))
              
              const nativeVoice = voices.find(voice => 
                voice.lang.startsWith(targetLang.split('-')[0]) && 
                voice.localService === false // Prefer cloud voices for better quality
              ) || voices.find(voice => 
                voice.lang.startsWith(targetLang.split('-')[0])
              )
              
              if (nativeVoice) {
                utterance.voice = nativeVoice
                console.log(`✅ Using voice: ${nativeVoice.name} (${nativeVoice.lang}) for text: "${translatedText}"`)
              } else {
                console.log(`❌ No native voice found for ${targetLang}, using default`)
              }
              
              utterance.rate = 0.8  // Slightly slower for better clarity
              utterance.pitch = 1
              utterance.volume = 0.9
              
              utterance.onstart = () => console.log(`🎵 Started speaking: "${translatedText}"`)
              utterance.onend = () => console.log(`🎵 Finished speaking`)
              utterance.onerror = (e) => console.log(`❌ Speech error:`, e)
              
              synthRef.current.speak(utterance)
            } else if (currentLanguage !== 'en') {
              console.log(`⚠️ Translation failed or same as original. Original: "${finalTranscript}", Translated: "${translatedText}"`)
            }

            setCurrentText('')
          }
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          
          // Handle specific error types
          if (event.error === 'aborted') {
            console.log('🔄 Speech recognition aborted - will restart if still listening')
            return // Don't show error for aborted, it's normal
          }
          
          if (event.error === 'no-speech') {
            console.log('⏸️ No speech detected - continuing to listen')
            return
          }
          
          if (event.error === 'audio-capture') {
            console.error('❌ Microphone access issue')
            setIsListening(false)
            alert('Microphone access failed. Please check permissions.')
            return
          }
          
          if (event.error === 'not-allowed') {
            console.error('❌ Microphone permission denied')
            setIsListening(false)
            alert('Microphone permission denied. Please allow microphone access.')
            return
          }
        }

        recognitionRef.current.onend = () => {
          console.log('🔄 Speech recognition ended')
          
          // Only restart if user is still actively listening
          if (isListening) {
            // Short delay to prevent rapid cycling
            setTimeout(() => {
              if (isListening && recognitionRef.current) {
                try {
                  console.log('🔄 Restarting speech recognition')
                  recognitionRef.current.start()
                } catch (error) {
                  console.error('Error restarting speech recognition:', error)
                  setIsListening(false)
                  setIsConnected(false)
                }
              }
            }, 100) // 100ms delay - quick restart for better UX
          } else {
            setIsConnected(false)
          }
        }
      }
    }

    return () => {
      console.log('🧹 Cleaning up speech recognition')
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        recognitionRef.current = null
      }
    }
  }, [currentLanguage, isListening])

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      alert('Speech recognition not supported in this browser. Please use Chrome or Edge.')
      return
    }

    if (isListening) {
      console.log('🛑 Stopping speech recognition')
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      try {
        console.log('🎤 Starting speech recognition')
        recognitionRef.current.start()
        setIsListening(true)
      } catch (error) {
        console.error('Error starting speech recognition:', error)
        // If already running, stop and restart
        if (error instanceof Error && error.message.includes('already started')) {
          recognitionRef.current.stop()
          setTimeout(() => {
            try {
              recognitionRef.current.start()
              setIsListening(true)
            } catch (retryError) {
              console.error('Retry failed:', retryError)
              alert('Failed to start speech recognition. Please try again.')
            }
          }, 200)
        }
      }
    }
  }, [isListening])

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId)
    alert('Room ID copied to clipboard!')
  }

  const shareRoom = () => {
    const url = `${window.location.origin}/room/${roomId}?lang=${currentLanguage}`
    navigator.clipboard.writeText(url)
    alert('Room link copied to clipboard!')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob" style={{animationDelay: '4s'}}></div>
      </div>
      {/* Enhanced Header */}
      <div className="relative z-10 max-w-6xl mx-auto mb-8">
        <div className="glass rounded-3xl p-6 shadow-2xl border border-white/20 backdrop-blur-xl">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="text-4xl animate-pulse">🌍</div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-xl opacity-30 scale-150"></div>
            </div>
            <div>
              <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                Universal Translator
              </h1>
              <p className="text-slate-300 text-sm font-mono">Room: {roomId.substring(0, 8)}...</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3 glass rounded-full px-4 py-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-white text-sm font-semibold">{participants} participant{participants !== 1 ? 's' : ''}</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={copyRoomId}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-6 py-2 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                📋 Copy ID
              </button>
              
              <button
                onClick={shareRoom}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-2 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                🔗 Share
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-4">
          {/* Language Selection */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4">
            <h3 className="text-white font-semibold mb-3">Your Language</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setCurrentLanguage(lang.code)}
                  className={`w-full flex items-center space-x-2 p-2 rounded-lg transition-all text-sm ${
                    currentLanguage === lang.code
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Microphone Control with Status */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4">
            <button
              onClick={toggleListening}
              className={`w-full p-4 rounded-xl font-bold transition-all transform hover:scale-105 ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 text-white pulse'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isListening ? (
                <>
                  🔴 Stop Speaking
                </>
              ) : (
                <>
                  🎙️ Start Speaking
                </>
              )}
            </button>
            
            {/* Speech Recognition Status */}
            {isConnected && (
              <div className="mt-3 space-y-2">
                <div className="text-center">
                  <div className={`text-sm ${isListening ? 'text-green-400' : 'text-gray-400'}`}>
                    {isListening ? '🟢 Listening...' : '⚪ Ready'}
                  </div>
                </div>
                
                {/* Live Audio Indicator */}
                {isListening && (
                  <div className="flex justify-center space-x-1">
                    <div className="w-2 h-6 bg-green-400 rounded animate-pulse"></div>
                    <div className="w-2 h-4 bg-green-400 rounded animate-pulse delay-75"></div>
                    <div className="w-2 h-8 bg-green-400 rounded animate-pulse delay-150"></div>
                    <div className="w-2 h-3 bg-green-400 rounded animate-pulse delay-200"></div>
                    <div className="w-2 h-6 bg-green-400 rounded animate-pulse delay-300"></div>
                  </div>
                )}
              </div>
            )}
            
            {/* System Status */}
            <div className="mt-2 text-center">
              <div className="flex items-center justify-center space-x-4 text-sm">
                {/* Microphone Status */}
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                  <span className={isConnected ? 'text-green-300' : 'text-red-300'}>
                    {isConnected ? 'Mic Ready' : 'Mic Off'}
                  </span>
                </div>
                
                {/* AI Backend Status */}
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${aiBackendReady ? 'bg-blue-400 animate-pulse' : 'bg-yellow-400'}`}></div>
                  <span className={aiBackendReady ? 'text-blue-300' : 'text-yellow-300'}>
                    {aiBackendReady ? 'AI Ready' : 'AI Loading'}
                  </span>
                </div>
                
                {/* Translation Status */}
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${isTranslating ? 'bg-purple-400 animate-spin' : 'bg-gray-400'}`}></div>
                  <span className={isTranslating ? 'text-purple-300' : 'text-gray-400'}>
                    {isTranslating ? 'Translating' : 'Ready'}
                  </span>
                </div>
              </div>
              
              {!isConnected && !aiBackendReady && (
                <div className="text-blue-200 text-xs mt-2">
                  Click "Start Speaking" and allow microphone permissions
                </div>
              )}
            </div>
          </div>

            {/* Voice Testing Section */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4">
              <h3 className="text-white font-semibold mb-3">Voice Quality</h3>
              <button
                onClick={() => {
                  if (synthRef.current) {
                    const voices = synthRef.current.getVoices()
                    const targetLangCode = currentLanguage === 'zh' ? 'zh-CN' : 
                                         currentLanguage === 'es' ? 'es-ES' :
                                         currentLanguage === 'fr' ? 'fr-FR' :
                                         currentLanguage === 'de' ? 'de-DE' :
                                         currentLanguage === 'ja' ? 'ja-JP' :
                                         currentLanguage === 'ko' ? 'ko-KR' :
                                         currentLanguage === 'ar' ? 'ar-SA' :
                                         currentLanguage === 'hi' ? 'hi-IN' :
                                         currentLanguage === 'pt' ? 'pt-BR' : currentLanguage
                    
                    const testText = currentLanguage === 'zh' ? '你好，这是一个测试' :
                                    currentLanguage === 'es' ? 'Hola, esta es una prueba' :
                                    currentLanguage === 'fr' ? 'Bonjour, ceci est un test' :
                                    currentLanguage === 'de' ? 'Hallo, das ist ein Test' :
                                    currentLanguage === 'ja' ? 'こんにちは、これはテストです' :
                                    currentLanguage === 'ko' ? '안녕하세요, 이것은 테스트입니다' :
                                    currentLanguage === 'ar' ? 'مرحبا، هذا اختبار' :
                                    currentLanguage === 'hi' ? 'नमस्ते, यह एक परीक्षण है' :
                                    currentLanguage === 'pt' ? 'Olá, este é um teste' : 'Hello, this is a test'
                    
                    const utterance = new SpeechSynthesisUtterance(testText)
                    utterance.lang = targetLangCode
                    
                    const nativeVoice = voices.find(voice => 
                      voice.lang.startsWith(targetLangCode.split('-')[0])
                    )
                    
                    if (nativeVoice) {
                      utterance.voice = nativeVoice
                    }
                    
                    utterance.rate = 0.8
                    utterance.pitch = 1
                    utterance.volume = 0.9
                    
                    synthRef.current.speak(utterance)
                  }
                }}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm"
              >
                🔊 Test Voice Quality
              </button>
              <p className="text-blue-200 text-xs mt-2">
                Test how {LANGUAGES.find(l => l.code === currentLanguage)?.name} sounds
              </p>
            </div>
        </div>

        {/* Messages */}
        <div className="lg:col-span-3">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 h-96 overflow-y-auto">
            <h3 className="text-white font-semibold mb-4">Live Translation</h3>
            
            {/* Current Speaking */}
            {currentText && (
              <div className="mb-4 p-3 bg-yellow-500/20 rounded-lg border-l-4 border-yellow-400">
                <div className="text-yellow-200 text-sm">Speaking now...</div>
                <div className="text-white">{currentText}</div>
              </div>
            )}

            {/* Messages */}
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-3 rounded-lg ${
                    message.isOwn
                      ? 'bg-blue-500/20 border-l-4 border-blue-400'
                      : 'bg-purple-500/20 border-l-4 border-purple-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-blue-200 text-sm">
                      {message.isOwn ? 'You' : 'Speaker'} → {LANGUAGES.find(l => l.code === message.language)?.name}
                    </div>
                    <div className="text-blue-300 text-xs">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  
                  <div className="text-gray-300 text-sm mb-1">
                    Original: "{message.originalText}"
                  </div>
                  
                  <div className="text-white font-medium">
                    Translated: "{message.translatedText}"
                  </div>
                </div>
              ))}
            </div>

            {messages.length === 0 && !currentText && (
              <div className="text-center text-gray-400 mt-8">
                <div className="text-4xl mb-2">🎤</div>
                <p>Click "Start Speaking" to begin real-time translation</p>
                <p className="text-sm mt-2">Speak in English, hear in {LANGUAGES.find(l => l.code === currentLanguage)?.name}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="max-w-4xl mx-auto mt-6">
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4">
          <div className="text-center text-blue-200 text-sm">
            <p className="mb-2">
              <strong>How it works:</strong> Speak in English → Automatically translated to your selected language → Spoken aloud
            </p>
            <p>
              <strong>Demo Note:</strong> Using free translation API with rate limits. Production version would use premium services.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 