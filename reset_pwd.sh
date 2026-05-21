cat << 'EOF' > /opt/mundomagico/reset_pwd.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
bcrypt.hash('magia2024', 10).then(h => {
  return prisma.user.update({
    where: { email: 'diretoria@mundomagico.com.br' },
    data: { password: h }
  });
}).then(() => console.log('PASSWORD_RESET_OK')).catch(console.error);
EOF
docker exec mundomagico-api-1 sh -c "cd /app/packages/database && mv /opt/mundomagico/reset_pwd.js . && npx tsx reset_pwd.js"
