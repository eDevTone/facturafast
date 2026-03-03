/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize pdf-parse to use Node.js require
      config.externals.push({
        'pdf-parse': 'commonjs pdf-parse',
      });
    }
    return config;
  },
};

export default nextConfig;
