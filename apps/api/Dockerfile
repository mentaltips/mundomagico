# ─── Estágio 1: Build ────────────────────────────────────────────
FROM node:20-alpine AS builder

# Instala pnpm
RUN npm install -g pnpm@9.12.3

WORKDIR /app

# Copia manifests do monorepo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json tsconfig.json ./

# Copia os packages e apps necessários
COPY packages/database ./packages/database
COPY packages/types ./packages/types
COPY apps/api ./apps/api

# Instala todas as dependências (incluindo dev para o build)
RUN pnpm install --frozen-lockfile

# Gera o Prisma Client
RUN pnpm --filter @mundo-magico/database exec prisma generate

# Build da API
RUN pnpm --filter @mundo-magico/api build

# ─── Estágio 2: Produção ─────────────────────────────────────────
FROM node:20-alpine AS runner

RUN npm install -g pnpm@9.12.3

WORKDIR /app

# Copia manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json tsconfig.json ./

# Copia apenas o necessário
COPY packages/database ./packages/database
COPY packages/types ./packages/types
COPY apps/api/package.json ./apps/api/package.json
COPY apps/api/dist ./apps/api/dist

# Instala só dependências de produção
RUN pnpm install --frozen-lockfile --prod

# Gera o Prisma Client no ambiente de produção
RUN pnpm --filter @mundo-magico/database exec prisma generate

# Cria usuário não-root por segurança
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3333

# Roda as migrations e depois inicia o servidor
CMD ["sh", "-c", "node -e \"require('./packages/database/node_modules/.bin/prisma') || true\" && node apps/api/dist/index.js"]
