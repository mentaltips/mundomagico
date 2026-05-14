#!/bin/bash
# ============================================================
# restore.sh — Restaura um backup do PostgreSQL
#
# Uso:
#   bash scripts/restore.sh                        # lista backups disponíveis
#   bash scripts/restore.sh backup_2026-05-14.sql.gz  # restaura específico
# ============================================================
set -euo pipefail

BACKUP_DIR="/root/backups/mundomagico"
LOG_PREFIX="[Restore $(date '+%Y-%m-%d %H:%M:%S')]"

# Carrega variáveis de ambiente
ENV_FILE="/root/mundomagico/.env.prod"
if [ -f "$ENV_FILE" ]; then
  set -a; source "$ENV_FILE"; set +a
else
  echo "$LOG_PREFIX ❌ Arquivo $ENV_FILE não encontrado."
  exit 1
fi

: "${POSTGRES_USER:?}" "${POSTGRES_PASSWORD:?}" "${POSTGRES_DB:?}"

# ─── Sem argumento: lista os backups disponíveis ──────────────────────────────
if [ -z "${1:-}" ]; then
  echo ""
  echo "📦 Backups disponíveis em $BACKUP_DIR:"
  echo ""
  find "$BACKUP_DIR" -name "backup_*.sql.gz" | sort -r | while read -r f; do
    SIZE=$(du -sh "$f" | cut -f1)
    NAME=$(basename "$f")
    echo "   $SIZE   $NAME"
  done
  echo ""
  echo "Uso: bash scripts/restore.sh <nome-do-arquivo.sql.gz>"
  exit 0
fi

BACKUP_FILE="$BACKUP_DIR/$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "$LOG_PREFIX ❌ Arquivo não encontrado: $BACKUP_FILE"
  exit 1
fi

# ─── Confirmação ──────────────────────────────────────────────────────────────
echo ""
echo "⚠️  ATENÇÃO: Isso vai SUBSTITUIR todos os dados do banco '$POSTGRES_DB'."
echo "   Arquivo: $(basename "$BACKUP_FILE")"
echo ""
read -r -p "   Digite 'sim' para confirmar: " CONFIRM

if [ "$CONFIRM" != "sim" ]; then
  echo "Restauração cancelada."
  exit 0
fi

# ─── Localiza container postgres ──────────────────────────────────────────────
CONTAINER=$(docker ps --filter "name=postgres" --filter "status=running" --format "{{.Names}}" | head -1)

if [ -z "$CONTAINER" ]; then
  echo "$LOG_PREFIX ❌ Container postgres não está rodando."
  exit 1
fi

echo "$LOG_PREFIX ▶ Restaurando $1..."

# Drop e recria o banco, depois restaura
gunzip -c "$BACKUP_FILE" | docker exec -i \
  -e PGPASSWORD="$POSTGRES_PASSWORD" \
  "$CONTAINER" \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

echo "$LOG_PREFIX ✅ Banco restaurado com sucesso a partir de $1"
