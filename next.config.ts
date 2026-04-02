import type { NextConfig } from 'next'

const config: NextConfig = {
  // Externalize pdf-parse (CommonJS module)
  serverExternalPackages: ['pdf-parse'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
      },
    ],
  },
}

export default config
