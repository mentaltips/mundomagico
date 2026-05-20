#!/bin/bash
# ============================================================
# update.sh — Atualiza e reinicia a API direto na VPS
# Execute este script DENTRO da VPS:
#   cd /opt/mundomagico && bash scripts/update.sh
# ============================================================
set -e

echo "🚀 Iniciando atualização..."

echo ""
echo "📦 Baixando código mais recente..."
git pull origin main 2>&1 || git pull origin master 2>&1

echo ""
echo "📚 Instalando dependências..."
pnpm install --frozen-lockfile 2>&1 | tail -5

echo ""
echo "🔨 Fazendo build da API..."
cd apps/api && pnpm build 2>&1 | tail -10
cd ../..

echo ""
echo "🔄 Reiniciando serviços Docker..."
docker compose -f docker-compose.prod.yml up -d --build api

echo ""
echo "🏥 Testando health da API..."
sleep 5
curl -s http://localhost:3333/health | python3 -m json.tool 2>/dev/null || \
curl -s http://localhost:3333/health || echo "API ainda iniciando..."

echo ""
echo "✅ Atualização concluída!"
echo "   Logs: docker compose -f docker-compose.prod.yml logs -f api"
