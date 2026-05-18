/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  transpilePackages: ['@mundo-magico/types'],

  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    }
    return config
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

}

module.exports = nextConfig
