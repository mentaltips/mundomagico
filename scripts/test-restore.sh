#!/bin/bash
# ============================================================
# test-restore.sh — Teste automatizado de restauração e integridade
#
# Uso:
#   bash scripts/test-restore.sh <nome-do-arquivo.sql.gz>
# ============================================================
set -euo pipefail

BACKUP_DIR="/root/backups/mundomagico"
LOG_PREFIX="[Restore-Test $(date '+%Y-%m-%d %H:%M:%S')]"
TEST_DB="mundomagico_test"

# Carrega variáveis de ambiente
ENV_FILE="/root/mundomagico/.env.prod"
if [ -f "$ENV_FILE" ]; then
  set -a; source "$ENV_FILE"; set +a
else
  echo "$LOG_PREFIX ❌ Arquivo $ENV_FILE não encontrado."
  exit 1
fi

: "${POSTGRES_USER:?}" "${POSTGRES_PASSWORD:?}"

if [ -z "${1:-}" ]; then
  echo "Uso: bash scripts/test-restore.sh <nome-do-arquivo.sql.gz>"
  exit 1
fi

BACKUP_FILE="$BACKUP_DIR/$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "$LOG_PREFIX ❌ Arquivo de backup não encontrado: $BACKUP_FILE"
  exit 1
fi

# ─── Localiza container postgres ──────────────────────────────────────────────
CONTAINER=$(docker ps --filter "name=postgres" --filter "status=running" --format "{{.Names}}" | head -1)

if [ -z "$CONTAINER" ]; then
  echo "$LOG_PREFIX ❌ Container postgres não está rodando."
  exit 1
fi

echo "$LOG_PREFIX ▶ Iniciando teste de restauração isolado no banco '$TEST_DB'..."

# 1. Garante que o banco de teste anterior foi limpo e recriado
echo "$LOG_PREFIX 🧹 Recriando banco de teste '$TEST_DB'..."
docker exec -i -e PGPASSWORD="$POSTGRES_PASSWORD" "$CONTAINER" psql -U "$POSTGRES_USER" -d postgres -c "DROP DATABASE IF EXISTS $TEST_DB;"
docker exec -i -e PGPASSWORD="$POSTGRES_PASSWORD" "$CONTAINER" psql -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE $TEST_DB;"

# 2. Executa a restauração no banco de teste
echo "$LOG_PREFIX 📥 Restaurando dados no banco de teste..."
gunzip -c "$BACKUP_FILE" | docker exec -i \
  -e PGPASSWORD="$POSTGRES_PASSWORD" \
  "$CONTAINER" \
  psql -U "$POSTGRES_USER" -d "$TEST_DB" > /dev/null

echo "$LOG_PREFIX ✅ Restauração concluída com sucesso."

# 3. Executa as validações de integridade do Schema e Dados
echo "$LOG_PREFIX 📊 Executando validação de integridade e contagem de registros..."

run_query() {
  docker exec -i -e PGPASSWORD="$POSTGRES_PASSWORD" "$CONTAINER" psql -U "$POSTGRES_USER" -d "$TEST_DB" -t -A -c "$1"
}

# Verifica se a tabela principal existe e conta registros
USER_COUNT=$(run_query "SELECT count(*) FROM \"User\";")
SCHOOL_COUNT=$(run_query "SELECT count(*) FROM \"School\";")
CHILD_COUNT=$(run_query "SELECT count(*) FROM \"Child\";")
BILLING_COUNT=$(run_query "SELECT count(*) FROM \"BillingConfig\";")

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "                RELATÓRIO DE INTEGRIDADE DO BACKUP              "
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  [✓] Banco de Teste:     $TEST_DB"
echo "  [✓] Arquivo Restaurado: $(basename "$BACKUP_FILE")"
echo "  [✓] Total de Escolas:   $SCHOOL_COUNT"
echo "  [✓] Total de Usuários:  $USER_COUNT"
echo "  [✓] Total de Alunos:    $CHILD_COUNT"
echo "  [✓] Config Financeira:  $BILLING_COUNT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$USER_COUNT" -gt 0 ] && [ "$SCHOOL_COUNT" -gt 0 ]; then
  echo "$LOG_PREFIX 🎉 SUCESSO: O backup está íntegro e todas as contagens principais foram validadas!"
else
  echo "$LOG_PREFIX ❌ ERRO: Falha na validação de dados básicos. Verifique o arquivo."
  exit 1
fi

# 4. Limpa o banco de teste após validação bem-sucedida
echo "$LOG_PREFIX 🧹 Removendo banco de teste temporário..."
docker exec -i -e PGPASSWORD="$POSTGRES_PASSWORD" "$CONTAINER" psql -U "$POSTGRES_USER" -d postgres -c "DROP DATABASE IF EXISTS $TEST_DB;"

echo "$LOG_PREFIX ✨ Teste concluído com sucesso absoluta!"
