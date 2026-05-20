/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  transpilePackages: [
    '@mundo-magico/types',
  ],

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
        hostname: 'api.mundomagicocajamar.com.br',
      },
      {
        protocol: 'https',
        hostname: 'mundomagicocajamar.com.br',
      },
      {
        protocol: 'https',
        hostname: 'www.mundomagicocajamar.com.br',
      },
      {
        protocol: 'https',
        hostname: 'admin.mundomagicocajamar.com.br',
        pathname: '/api/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    unoptimized: false,
  },

}

module.exports = nextConfig
