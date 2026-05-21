const fetch = require('node-fetch');

async function test(email, password) {
  const res = await fetch('https://api.mundomagicocajamar.com.br/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    headers: { 'Content-Type': 'application/json' }
  });
  
  const text = await res.text();
  console.log(`Login ${email}:`, res.status, text);
}

test('ana.santos@email.com', 'familia123');
test('diretoria@mundomagico.com.br', 'magia2024');
test('profa.fernanda@mundomagico.com.br', 'equipe123');
