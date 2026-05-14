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
echo "🔄 Reiniciando serviço da API..."
$SSH "
  # Tenta pm2 primeiro, depois systemctl, depois docker
  if command -v pm2 &>/dev/null; then
    pm2 restart api 2>/dev/null || pm2 restart all 2>/dev/null || echo 'pm2: sem processo chamado api'
    pm2 list
  elif systemctl is-active --quiet mundomagico-api 2>/dev/null; then
    systemctl restart mundomagico-api
    echo 'systemctl: reiniciado'
  else
    echo 'Verificando docker...'
    docker ps --format 'table {{.Names}}\t{{.Status}}' 2>/dev/null || echo 'docker não encontrado'
  fi
"

echo ""
echo "🏥 Testando health da API..."
sleep 3
$SSH "curl -s http://localhost:3002/health || curl -s http://localhost:3333/health || echo 'API não respondeu em localhost'"

echo ""
echo "✅ Deploy concluído!"
echo "   Verifique os logs com: ssh -i $VPS_KEY $VPS_USER@$VPS_IP 'pm2 logs api --lines 20'"
