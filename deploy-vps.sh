#!/bin/bash
# ============================================================
# deploy-vps.sh — Atualiza o código na VPS e reinicia a API
# Rode da sua máquina local: bash deploy-vps.sh
#
# CONFIGURAÇÃO (sem credenciais no código):
#   Crie o arquivo ~/.deploy-vps.env com o conteúdo:
#     VPS_IP=<ip-da-vps>
#     VPS_USER=<usuario-ssh>
#     VPS_KEY=~/.ssh/id_mundomagico   # caminho da chave privada SSH
#
#   Para gerar e instalar a chave SSH na VPS (uma única vez):
#     ssh-keygen -t ed25519 -f ~/.ssh/id_mundomagico -C "deploy-mundomagico"
#     ssh-copy-id -i ~/.ssh/id_mundomagico.pub $VPS_USER@$VPS_IP
#
# FLUXO:
#   1. git pull               — sincroniza o repo
#   2. pnpm install (lock)    — atualiza pnpm-lock.yaml se package.json mudou
#   3. Sobe postgres+redis    — espera healthcheck
#   4. prisma migrate deploy  — aplica migrações pendentes
#   5. docker compose build   — multi-stage faz install/generate/build dentro
#   6. docker compose up      — recria api e worker
#   7. healthcheck            — confirma que /health respondeu 200
#
# NÃO faz mais build local (pnpm install/build na VPS fora do Docker) —
# tudo isso é feito dentro do Dockerfile multi-stage.
# ============================================================
set -euo pipefail

# ── Carrega configuração local (nunca versionada) ──────────────
ENV_FILE="${HOME}/.deploy-vps.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Arquivo de configuração não encontrado: $ENV_FILE"
  echo ""
  echo "Crie o arquivo com:"
  echo "  echo 'VPS_IP=<ip>'      >> ~/.deploy-vps.env"
  echo "  echo 'VPS_USER=<user>'  >> ~/.deploy-vps.env"
  echo "  echo 'VPS_KEY=~/.ssh/id_mundomagico' >> ~/.deploy-vps.env"
  echo "  chmod 600 ~/.deploy-vps.env"
  exit 1
fi

# shellcheck source=/dev/null
source "$ENV_FILE"

if [ -z "${VPS_IP:-}" ] || [ -z "${VPS_USER:-}" ] || [ -z "${VPS_KEY:-}" ]; then
  echo "❌ VPS_IP, VPS_USER e VPS_KEY são obrigatórios em $ENV_FILE"
  exit 1
fi

# Expande ~ no caminho da chave
VPS_KEY="${VPS_KEY/#\~/$HOME}"

SSH="ssh -i $VPS_KEY -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP"
APP_DIR="/opt/mundomagico"
COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env.prod"

echo "🚀 Iniciando deploy na VPS ($VPS_IP)..."

# ── 1. Conectividade ───────────────────────────────────────────
echo ""
echo "📡 Conectando à VPS..."
$SSH "echo '✅ Conectado com sucesso!'"

# ── 2. Garantia: .env.prod existe ──────────────────────────────
echo ""
echo "🔐 Verificando .env.prod na VPS..."
$SSH "test -f $APP_DIR/.env.prod && echo '✅ .env.prod presente' || (echo '❌ .env.prod AUSENTE em $APP_DIR — abortando' && exit 1)"

# ── 3. Atualiza código ─────────────────────────────────────────
echo ""
echo "📦 Atualizando código do repositório..."
$SSH "cd $APP_DIR && git pull origin main 2>&1 || git pull origin master 2>&1"

# ── 4. Sincroniza lockfile (NÃO faz install completo) ──────────
# Necessário caso package.json tenha mudado (ex: nova dep como express-rate-limit).
# --lockfile-only NÃO baixa node_modules — só atualiza pnpm-lock.yaml.
# O Dockerfile multi-stage faz o install real dentro do container.
echo ""
echo "🔗 Sincronizando pnpm-lock.yaml (sem instalar node_modules)..."
$SSH "cd $APP_DIR && pnpm install --lockfile-only 2>&1 | tail -3"

# ── 5. Sobe banco e cache (necessários pra migrate) ────────────
echo ""
echo "🗄️  Subindo postgres e redis..."
$SSH "cd $APP_DIR && $COMPOSE up -d postgres redis"

echo "⏳ Aguardando postgres ficar healthy..."
$SSH "cd $APP_DIR && for i in \$(seq 1 30); do
  if $COMPOSE ps postgres 2>/dev/null | grep -q '(healthy)'; then
    echo '✅ Postgres healthy'; break;
  fi
  sleep 2
done"

# ── 6. Build dos containers (multi-stage faz install/generate/build) ───
echo ""
echo "🔨 Build das imagens api e worker (multi-stage)..."
$SSH "cd $APP_DIR && $COMPOSE build api worker"

# ── 7. Migrações ──────────────────────────────────────────────
# Roda fora do container final, usando a imagem recém-construída.
# --no-deps pra não tentar subir api novamente, --rm pra container efêmero.
echo ""
echo "🧬 Aplicando migrações Prisma (migrate deploy)..."
$SSH "cd $APP_DIR && $COMPOSE run --rm --no-deps api \
  pnpm --filter @mundo-magico/database exec prisma migrate deploy 2>&1 | tail -20"

# ── 8. Sobe api e worker ───────────────────────────────────────
echo ""
echo "🔄 Subindo api e worker..."
$SSH "cd $APP_DIR && $COMPOSE up -d api worker"

# ── 9. Healthcheck ─────────────────────────────────────────────
echo ""
echo "⏳ Aguardando API inicializar..."
sleep 8

echo ""
echo "🩺 Verificando saúde da API..."
# Tenta /health interno primeiro (container), depois público.
HEALTH_OUTPUT=$($SSH "curl -fsS http://127.0.0.1:3333/health 2>/dev/null || \
                       curl -fsS https://api.mundomagicocajamar.com.br/health 2>/dev/null || \
                       echo 'NO_RESPONSE'")

if echo "$HEALTH_OUTPUT" | grep -q '"status":"ok"'; then
  echo "✅ API respondendo: $HEALTH_OUTPUT"
else
  echo "⚠️  API não respondeu ainda — verificando logs:"
  $SSH "cd $APP_DIR && $COMPOSE logs --tail=30 api"
  exit 1
fi

# ── 10. Resumo final ───────────────────────────────────────────
echo ""
echo "📊 Status dos containers:"
$SSH "cd $APP_DIR && $COMPOSE ps"

echo ""
echo "✅ Deploy concluído!"
echo ""
echo "Para acompanhar logs em tempo real:"
echo "  ssh -i $VPS_KEY $VPS_USER@$VPS_IP \"cd $APP_DIR && $COMPOSE logs -f api worker\""
