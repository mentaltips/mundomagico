FROM node:20-slim

# Instala pnpm e dependências necessárias para o Prisma
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

# Gera o Prisma Client
RUN pnpm --filter @mundo-magico/database exec prisma generate

# Compila o pacote compartilhado antes da API consumir o export em dist/
RUN pnpm --filter @mundo-magico/database build

RUN pnpm --filter @mundo-magico/api build

# Cria usuário não-root com pasta home e permissões
RUN groupadd -r appgroup && useradd -r -m -g appgroup appuser
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 3333

# Usa pnpm exec para resolver os binários do workspace corretamente
CMD ["pnpm", "--filter", "@mundo-magico/api", "start"]
