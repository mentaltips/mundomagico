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
# ============================================================
set -e

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

if [ -z "$VPS_IP" ] || [ -z "$VPS_USER" ] || [ -z "$VPS_KEY" ]; then
  echo "❌ VPS_IP, VPS_USER e VPS_KEY são obrigatórios em $ENV_FILE"
  exit 1
fi

# Expande ~ no caminho da chave
VPS_KEY="${VPS_KEY/#\~/$HOME}"

SSH="ssh -i $VPS_KEY -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP"

echo "🚀 Iniciando deploy na VPS ($VPS_IP)..."

echo ""
echo "📡 Conectando à VPS..."
$SSH "echo '✅ Conectado com sucesso!'"

echo ""
echo "📦 Atualizando código do repositório..."
$SSH "cd /root/mundomagico && git pull origin main 2>&1 || git pull origin master 2>&1"

echo ""
echo "📚 Instalando dependências..."
$SSH "cd /root/mundomagico && pnpm install --frozen-lockfile 2>&1 | tail -5"

echo ""
echo "🔨 Fazendo build da API..."
$SSH "cd /root/mundomagico/apps/api && pnpm build 2>&1 | tail -10"

echo ""
echo "🔄 Reiniciando containers Docker..."
$SSH "cd /root/mundomagico && docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build api 2>&1 | tail -10"

echo ""
echo "⏳ Aguardando API inicializar..."
sleep 5

echo ""
echo "🩺 Verificando saúde da API..."
$SSH "curl -s https://api.mundomagicocajamar.com.br/health | python3 -m json.tool 2>/dev/null || echo 'API ainda iniciando...'"

echo ""
echo "✅ Deploy concluído!"
