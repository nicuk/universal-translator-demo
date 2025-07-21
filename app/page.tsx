'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'

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

export default function Home() {
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [roomId, setRoomId] = useState('')
  const router = useRouter()

  const createRoom = () => {
    const newRoomId = uuidv4()
    router.push(`/room/${newRoomId}?lang=${selectedLanguage}`)
  }

  const joinRoom = () => {
    if (roomId.trim()) {
      router.push(`/room/${roomId}?lang=${selectedLanguage}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" style={{animationDelay: '4s'}}></div>
      </div>
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-lg w-full space-y-8">
          {/* Header with Enhanced Design */}
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="text-8xl mb-6 animate-pulse">🌍</div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-3xl opacity-30 transform scale-150"></div>
            </div>
            <div className="space-y-4">
              <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-4">
                Universal Translator
              </h1>
              <p className="text-xl text-slate-300 leading-relaxed">
                Real-time AI translation powered by Google Gemini
              </p>
              <div className="flex items-center justify-center space-x-6 text-sm text-slate-400">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Live Translation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span>10+ Languages</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  <span>Enterprise Ready</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Language Selection */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Select Your Language</h2>
            <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto custom-scrollbar">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setSelectedLanguage(lang.code)}
                  className={`group relative flex items-center space-x-3 p-4 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                    selectedLanguage === lang.code
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-xl scale-105'
                      : 'bg-white/10 text-slate-200 hover:bg-white/20 hover:shadow-lg'
                  }`}
                >
                  <span className="text-2xl group-hover:animate-bounce">{lang.flag}</span>
                  <span className="text-sm font-semibold">{lang.name}</span>
                  {selectedLanguage === lang.code && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Enhanced Room Actions */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl space-y-6">
            <button
              onClick={createRoom}
              className="group w-full bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 hover:from-emerald-600 hover:via-blue-600 hover:to-purple-600 text-white font-bold py-5 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center space-x-3">
                <span className="text-2xl group-hover:animate-pulse">🎙️</span>
                <span className="text-lg">Create New Room</span>
              </div>
            </button>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl"></div>
              <div className="relative flex space-x-3">
                <input
                  type="text"
                  placeholder="Enter Room ID..."
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="flex-1 bg-white/10 backdrop-blur-sm text-white placeholder-slate-400 border border-white/20 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300"
                />
                <button
                  onClick={joinRoom}
                  disabled={!roomId.trim()}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Join
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced Features */}
          <div className="text-center space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300">
                <div className="text-3xl mb-2">⚡</div>
                <div className="text-sm font-semibold text-white">Real-time</div>
                <div className="text-xs text-slate-400">Sub-second latency</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300">
                <div className="text-3xl mb-2">🔒</div>
                <div className="text-sm font-semibold text-white">Secure</div>
                <div className="text-xs text-slate-400">Enterprise-grade</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300">
                <div className="text-3xl mb-2">🌐</div>
                <div className="text-sm font-semibold text-white">Global</div>
                <div className="text-xs text-slate-400">10+ languages</div>
              </div>
            </div>
            
            <div className="text-center text-slate-400 text-sm">
              Powered by Google Gemini AI • Enterprise Ready • Production Scale
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 