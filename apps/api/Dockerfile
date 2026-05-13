FROM node:20-slim

# Instala pnpm e dependências necessárias para o Prisma no Debian
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@9.12.3

WORKDIR /app

# Copia manifests do monorepo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./

# Copia packages compartilhados e a API
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Instala todas as dependências
RUN pnpm install --frozen-lockfile

# Gera o Prisma Client (agora em ambiente Debian-slim)
RUN pnpm --filter @mundo-magico/database exec prisma generate

# Cria usuário não-root
RUN groupadd -r appgroup && useradd -r -g appgroup appuser
USER appuser

EXPOSE 3333

# Roda com npx tsx
CMD ["npx", "tsx", "apps/api/src/index.ts"]
