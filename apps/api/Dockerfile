FROM node:20-alpine

# Instala pnpm
RUN npm install -g pnpm@9.12.3

WORKDIR /app

# Copia manifests do monorepo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./

# Copia packages compartilhados e a API
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Instala todas as dependências
RUN pnpm install --frozen-lockfile

# Gera o Prisma Client
RUN pnpm --filter @mundo-magico/database exec prisma generate

# Cria usuário não-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3333

# Roda com npx tsx para garantir que o binário seja encontrado no monorepo
CMD ["npx", "tsx", "apps/api/src/index.ts"]
