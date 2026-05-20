#!/bin/bash
# ============================================================
# update.sh — Atualiza e reinicia a API direto na VPS
# Execute este script DENTRO da VPS:
#   cd /opt/mundomagico && bash scripts/update.sh
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env.prod"

if [ ! -f .env.prod ]; then
  echo "❌ .env.prod não encontrado em $ROOT"
  echo "   Copie .env.prod.example para .env.prod e preencha os valores."
  exit 1
fi

echo "🚀 Iniciando atualização..."

echo ""
echo "📦 Baixando código mais recente..."
git pull origin main 2>&1 || git pull origin master 2>&1

echo ""
echo "📚 Instalando dependências..."
pnpm install --frozen-lockfile 2>&1 | tail -5

echo ""
echo "🔧 Gerando Prisma Client (necessário antes do build)..."
pnpm --filter @mundo-magico/database exec prisma generate

echo ""
echo "🧱 Compilando pacote de banco..."
pnpm --filter @mundo-magico/database build

echo ""
echo "🔨 Fazendo build da API..."
pnpm --filter @mundo-magico/api build

echo ""
echo "🗄️ Garantindo postgres/redis..."
$COMPOSE up -d postgres redis

echo ""
echo "⏳ Aguardando postgres ficar healthy..."
for i in $(seq 1 30); do
  if $COMPOSE ps postgres 2>/dev/null | grep -q '(healthy)'; then
    echo "   postgres healthy"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "❌ postgres não ficou healthy em 60s"
    echo "   Diagnóstico: $COMPOSE logs --tail=50 postgres"
    exit 1
  fi
  sleep 2
done

echo ""
echo "📦 Aplicando migrações..."
$COMPOSE run --rm --no-deps api pnpm --filter @mundo-magico/database exec prisma migrate deploy

echo ""
echo "🔄 Reiniciando serviços Docker..."
$COMPOSE build --no-cache api worker
$COMPOSE up -d api worker

echo ""
echo "🏥 Testando health da API..."
sleep 5
curl -s http://localhost:3333/health | python3 -m json.tool 2>/dev/null || \
curl -s http://localhost:3333/health || echo "API ainda iniciando..."

echo ""
echo "✅ Atualização concluída!"
echo "   Logs: $COMPOSE logs -f api"
