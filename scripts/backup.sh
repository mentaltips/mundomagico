#!/bin/bash
# ============================================================
# backup.sh — Backup automático do PostgreSQL
#
# O que faz:
#   1. Executa pg_dump dentro do container postgres
#   2. Comprime o arquivo (.sql.gz)
#   3. Mantém os últimos 30 dias localmente
#   4. (Opcional) Envia para Google Drive via rclone
#   5. Loga tudo em /var/log/mundomagico-backup.log
#
# Instalar no cron da VPS (roda todo dia às 3h):
#   crontab -e
#   0 3 * * * /root/mundomagico/scripts/backup.sh >> /var/log/mundomagico-backup.log 2>&1
# ============================================================
set -euo pipefail

# ─── Configuração ─────────────────────────────────────────────────────────────
BACKUP_DIR="/root/backups/mundomagico"
RETENTION_DAYS=30
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql.gz"
LOG_PREFIX="[Backup $(date '+%Y-%m-%d %H:%M:%S')]"

# Carrega variáveis de ambiente do .env.prod
ENV_FILE="/root/mundomagico/.env.prod"
if [ -f "$ENV_FILE" ]; then
  # shellcheck source=/dev/null
  set -a; source "$ENV_FILE"; set +a
else
  echo "$LOG_PREFIX ❌ Arquivo $ENV_FILE não encontrado. Abortando."
  exit 1
fi

# Verifica variáveis obrigatórias
: "${POSTGRES_USER:?POSTGRES_USER não definido em .env.prod}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD não definido em .env.prod}"
: "${POSTGRES_DB:?POSTGRES_DB não definido em .env.prod}"

# ─── Prepara diretório de backup ──────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"

echo "$LOG_PREFIX ▶ Iniciando backup do banco '$POSTGRES_DB'..."

# ─── Executa pg_dump via Docker ───────────────────────────────────────────────
# Usa o container postgres já rodando (não precisa de porta exposta)
CONTAINER=$(docker ps --filter "name=postgres" --filter "status=running" --format "{{.Names}}" | head -1)

if [ -z "$CONTAINER" ]; then
  echo "$LOG_PREFIX ❌ Container postgres não encontrado ou não está rodando."
  exit 1
fi

docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" "$CONTAINER" \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-password \
  | gzip > "$BACKUP_FILE"

# ─── Verifica se o backup foi gerado corretamente ─────────────────────────────
if [ ! -s "$BACKUP_FILE" ]; then
  echo "$LOG_PREFIX ❌ Backup gerado está vazio! Verifique o container postgres."
  rm -f "$BACKUP_FILE"
  exit 1
fi

SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
echo "$LOG_PREFIX ✅ Backup salvo: $BACKUP_FILE ($SIZE)"

# ─── Remove backups antigos (mantém 30 dias) ──────────────────────────────────
DELETED=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -print -delete | wc -l)
if [ "$DELETED" -gt 0 ]; then
  echo "$LOG_PREFIX 🗑️  $DELETED backup(s) antigo(s) removido(s) (retenção: ${RETENTION_DAYS} dias)"
fi

# ─── (Opcional) Envio para Google Drive via rclone ───────────────────────────
# Para ativar:
#   1. Instale rclone: curl https://rclone.org/install.sh | sudo bash
#   2. Configure: rclone config  (escolha "Google Drive", siga o wizard)
#   3. Descomente as linhas abaixo substituindo "gdrive" pelo nome configurado
#
# RCLONE_REMOTE="gdrive:backups/mundomagico"
# if command -v rclone &>/dev/null; then
#   echo "$LOG_PREFIX ☁️  Enviando para Google Drive..."
#   rclone copy "$BACKUP_FILE" "$RCLONE_REMOTE" --stats-one-line
#   echo "$LOG_PREFIX ✅ Enviado para $RCLONE_REMOTE"
# else
#   echo "$LOG_PREFIX ⚠️  rclone não instalado. Backup apenas local."
# fi

# ─── Lista backups disponíveis ────────────────────────────────────────────────
echo "$LOG_PREFIX 📦 Backups disponíveis:"
find "$BACKUP_DIR" -name "backup_*.sql.gz" -printf "   %TY-%Tm-%Td %TH:%TM  %s bytes  %f\n" | sort -r | head -10

echo "$LOG_PREFIX ✅ Concluído."
