/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove deprecated experimental option
  output: 'standalone',
  
  // Optimize for static generation where possible
  trailingSlash: false,
  
  // Image optimization
  images: {
    unoptimized: true, // For Netlify compatibility
  },
  
  // Environment variables
  env: {
    GOOGLE_GEMINI_API_KEY: process.env.GOOGLE_GEMINI_API_KEY,
  },
  
  // Performance optimizations
  compress: true,
  
  // Webpack optimizations
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },
}

module.exports = nextConfig 