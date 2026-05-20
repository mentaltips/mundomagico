#!/bin/bash
echo "=== USUARIOS NO BANCO ==="
docker exec mundomagico-postgres-1 psql -U mundomagico -d mundomagico_prod -c 'SELECT name, email, role, active FROM "User" ORDER BY role;'

echo ""
echo "=== REDEFININDO SENHAS ==="
# Gerar hash bcrypt para 'magia2024' e 'equipe123' e 'familia123' usando node no container da API
docker exec mundomagico-api-1 node -e "
const bcrypt = require('bcryptjs');
Promise.all([
  bcrypt.hash('magia2024', 10),
  bcrypt.hash('equipe123', 10),
  bcrypt.hash('familia123', 10),
  bcrypt.hash('suporte123', 10)
]).then(([h1, h2, h3, h4]) => {
  console.log('ADMIN_HASH=' + h1);
  console.log('PROFESSOR_HASH=' + h2);
  console.log('RESPONSAVEL_HASH=' + h3);
  console.log('SUPORTE_HASH=' + h4);
});
"
