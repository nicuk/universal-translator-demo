# Universal Translator Demo

Real-time speech translation web application. Speak in English, hear in any language.

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🎯 Demo Flow

1. **Select Language**: Choose your target language (e.g., Mandarin)
2. **Create Room**: Click "Create New Room" 
3. **Start Speaking**: Click microphone button, speak in English
4. **Real-time Translation**: See text translation + hear audio in selected language

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Audio**: Web Speech API (Chrome/Edge), SpeechSynthesis API
- **Translation**: MyMemory API (free tier for demo)
- **Real-time**: WebRTC audio streaming (room-based)

## 🌍 Supported Languages

English → Mandarin, Spanish, French, German, Japanese, Korean, Arabic, Hindi, Portuguese

## ⚠️ Demo Limitations

- Chrome/Edge browsers only (Web Speech API)
- English input only for speech recognition
- Free translation API with rate limits
- No persistent rooms (demo only)

## 🔧 Production Upgrades

- Premium translation APIs (Google Translate, Azure Cognitive)
- Multi-language speech recognition
- WebSocket backend for real rooms
- Audio quality optimization
- Mobile app versions

## 🎪 Business Model

- **SaaS Tiers**: $29-299/month
- **Per-Minute**: $0.10-0.50 per translated minute  
- **Enterprise**: $10K-50K white-label licenses

*Target: International corporations, educational institutions, conference organizers, government/NGO* 