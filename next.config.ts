import type { NextConfig } from 'next'

const config: NextConfig = {
  // Externalize pdf-parse (CommonJS module)
  serverExternalPackages: ['pdf-parse'],
}

export default config
