#!/bin/bash
# ============================================================
# deploy-vps.sh — Atualiza o código na VPS e reinicia a API
# Rode da sua máquina local: bash deploy-vps.sh
# ============================================================
set -e

VPS_IP="108.165.230.44"
VPS_USER="root"
VPS_PASS="P3jb6EBPaV"

echo "🚀 Iniciando deploy na VPS..."

# Verifica se sshpass está disponível
if ! command -v sshpass &>/dev/null; then
  echo "❌ sshpass não encontrado. Instale com:"
  echo "   macOS: brew install hudochenkov/sshpass/sshpass"
  echo "   Ubuntu: sudo apt install sshpass"
  exit 1
fi

SSH="sshpass -p $VPS_PASS ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP"
SCP="sshpass -p $VPS_PASS scp -o StrictHostKeyChecking=no"

echo ""
echo "📡 Conectando à VPS ($VPS_IP)..."
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
echo "   Verifique os logs com: ssh root@$VPS_IP 'pm2 logs api --lines 20'"
