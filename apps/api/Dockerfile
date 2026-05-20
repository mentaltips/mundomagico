# syntax=docker/dockerfile:1.6
# ──────────────────────────────────────────────────────────────────────────────
# Dockerfile multi-stage da API + Worker (Mundo Mágico)
#
# Stages:
#   1. base    — imagem base com pnpm + libs nativas (openssl pro Prisma)
#   2. deps    — instala node_modules cacheado por manifests
#   3. build   — gera Prisma Client, compila @mundo-magico/database e @mundo-magico/api
#   4. runtime — só com node_modules de produção + dist + Prisma engine
#
# Resultado: imagem ~250-350MB (antes era >1.5GB) e cache de install
# que só invalida quando algum package.json/lockfile muda.
# ──────────────────────────────────────────────────────────────────────────────

# ─── 1. base ──────────────────────────────────────────────────────────────────
FROM node:20-slim AS base

RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@9.12.3

WORKDIR /app

# ─── 2. deps (cacheável) ──────────────────────────────────────────────────────
# Copia APENAS os manifests para maximizar o cache do `pnpm install`.
# Mudanças em código não invalidam essa layer.
FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

# Manifests de cada workspace
# (packages/ui não tem package.json, é só uma pasta src/ não usada pela API)
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/

RUN pnpm install --frozen-lockfile

# ─── 3. build ─────────────────────────────────────────────────────────────────
FROM base AS build

# Reaproveita node_modules do stage anterior
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=deps /app/packages/types/node_modules ./packages/types/node_modules

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc turbo.json tsconfig.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Gera Prisma Client (necessário antes de compilar @mundo-magico/database)
RUN pnpm --filter @mundo-magico/database exec prisma generate

# Compila pacote compartilhado primeiro (API depende do dist/)
RUN pnpm --filter @mundo-magico/database build

# Compila types
RUN pnpm --filter @mundo-magico/types build

# Compila API
RUN pnpm --filter @mundo-magico/api build

# Remove devDependencies para deixar node_modules enxuto pro runtime
RUN pnpm install --prod --frozen-lockfile

# ─── 4. runtime ───────────────────────────────────────────────────────────────
FROM base AS runtime

ENV NODE_ENV=production

# Copia somente o estritamente necessário pra rodar
COPY --from=build /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=build /app/node_modules ./node_modules

# Database package (com Prisma Client gerado em dist/ ou via prisma generate)
COPY --from=build /app/packages/database/package.json ./packages/database/package.json
COPY --from=build /app/packages/database/dist ./packages/database/dist
COPY --from=build /app/packages/database/prisma ./packages/database/prisma
COPY --from=build /app/packages/database/node_modules ./packages/database/node_modules

# Types
COPY --from=build /app/packages/types/package.json ./packages/types/package.json
COPY --from=build /app/packages/types/dist ./packages/types/dist

# API compilada
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules

# Cria pasta uploads (mount-point) e ajusta ownership
RUN mkdir -p /app/uploads /app/whatsapp-auth \
 && groupadd -r appgroup \
 && useradd -r -m -g appgroup appuser \
 && chown -R appuser:appgroup /app

USER appuser

EXPOSE 3333

# Healthcheck — bate em /health (já implementado em app.ts)
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3333)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Comando padrão: API. O worker é iniciado pelo docker-compose com `command:` override.
CMD ["node", "apps/api/dist/index.js"]
