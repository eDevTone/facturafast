import type { NextConfig } from 'next'

const config: NextConfig = {
  // pdf-parse and the canvas it needs on the server stay out of the bundle (see lib/csf/pdf-wrapper.ts)
  serverExternalPackages: ['pdf-parse', '@napi-rs/canvas'],
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
