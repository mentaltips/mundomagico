#!/bin/bash
echo "=== ATUALIZANDO SENHAS NO BANCO ==="

docker exec mundomagico-postgres-1 psql -U mundomagico -d mundomagico_prod << 'ENDSQL'
UPDATE "User" SET password = '$2a$10$w8AKSVt4FS0QBGvDsNNXG.N61bf4IXxVWjazDLYHctDLy.AURnNBG' WHERE email = 'diretoria@mundomagico.com.br';
UPDATE "User" SET password = '$2a$10$1ea.qhBi9vql6iLaT0YLqOGfbRlrjaUk2ej9WtXauPiSR8S.z.vcm' WHERE email = 'suporte@mundomagico.com.br';
UPDATE "User" SET password = '$2a$10$xX1CRpzJDNFzxaoUwngXIOCKhN.ZIOj4lx60Mo81RCWPgu0TvbKF.' WHERE email = 'profa.fernanda@mundomagico.com.br';
UPDATE "User" SET password = '$2a$10$xX1CRpzJDNFzxaoUwngXIOCKhN.ZIOj4lx60Mo81RCWPgu0TvbKF.' WHERE email = 'teacher@mundomagico.com.br';
UPDATE "User" SET password = '$2a$10$WUDCcDWjoK8abx9FVErxcOHYqnj2/QjWfZHvvfqR4u2quJp1lisCW' WHERE email = 'ana.santos@email.com';
UPDATE "User" SET password = '$2a$10$WUDCcDWjoK8abx9FVErxcOHYqnj2/QjWfZHvvfqR4u2quJp1lisCW' WHERE email = 'maria@email.com';
SELECT email, role FROM "User" ORDER BY role;
ENDSQL

echo "=== CONCLUIDO ==="
