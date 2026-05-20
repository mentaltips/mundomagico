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

  async rewrites() {
    return [
      {
        source: '/api/uploads/:path*',
        destination: 'https://api.mundomagicocajamar.com.br/uploads/:path*',
      },
    ]
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
  },

}

module.exports = nextConfig
