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

  // Proxy para a API (Porta 3002)
  async rewrites() {
    return {
      // afterFiles garante que o Next.js tente as rotas em src/app/api/ primeiro.
      // Se não houver uma rota definida lá, ele cai no proxy genérico abaixo.
      afterFiles: [
        {
          source: '/api/:path((?!auth).*)', // Tudo exceto auth
          destination: 'http://localhost:3002/api/:path*',
        },
      ]
    }
  },
}

module.exports = nextConfig
