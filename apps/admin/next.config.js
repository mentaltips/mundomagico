/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  // Permite que o Next.js transpile pacotes do monorepo que
  // exportam TypeScript diretamente (sem compilar antes)
  transpilePackages: [
    '@mundo-magico/types',
  ],

  // Resolve o alias @/ explicitamente via webpack
  // Garante que funciona mesmo sem baseUrl no tsconfig
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    }
    return config
  },

  // Imagens externas permitidas
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Silencia avisos de build desnecessários no Vercel
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },

  // Proxy para a API no VPS (Exceto Auth que roda no Next.js)
  /* async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: '/api/auth/:path*', // Mantém local
      },
      {
        source: '/api/:path*',
        destination: 'https://api.mundomagicocajamar.com.br/api/:path*',
      },
    ]
  }, */
}

module.exports = nextConfig
