# Changelog

## v1.2.0 - 2026-05-19

### Internacionalização e Tradução (PT-BR)

- Traduzidos todos os cargos e perfis de usuário do inglês para o português:
  - `ADMIN` $\rightarrow$ `ADMIN` (Administrador Geral)
  - `SCHOOL_ADMIN` $\rightarrow$ `ADMIN_ESCOLA` (Administrador da Escola)
  - `DIRECTOR` $\rightarrow$ `DIRETOR` (Diretor)
  - `COORDINATOR` $\rightarrow$ `COORDENADOR` (Coordenador)
  - `TEACHER` $\rightarrow$ `PROFESSOR` (Professor)
  - `MONITOR` $\rightarrow$ `MONITOR` (Monitor)
  - `CAREGIVER` $\rightarrow$ `CUIDADOR` (Cuidador)
  - `GUARDIAN` $\rightarrow$ `RESPONSAVEL` (Responsável)
  - `FINANCE` $\rightarrow$ `FINANCEIRO` (Financeiro)
  - `STAFF` $\rightarrow$ `FUNCIONARIO` (Funcionário)
- Renomeados todos os caminhos de rotas físicas no frontend:
  - `/parent` $\rightarrow$ `/responsavel`
  - `/teacher` $\rightarrow$ `/professor`
- Renomeados todos os endpoints e rotas de proxies da API Next.js:
  - `/api/parent` $\rightarrow$ `/api/responsavel`
  - `/api/teacher` $\rightarrow$ `/api/professor`
- Atualizado o middleware do NextAuth para controle dinâmico dos novos caminhos traduzidos.
- Atualizado o mapeamento de equipe e modais administrativos para exibição de cargos em português.

### Banco de Dados e Migração

- Criado script de migração automática `migrar-cargos.ts` para converter chaves legadas de cargos no banco de dados local/produção de forma segura.
- Atualizado o script de sementes (`seed.ts`) com a nova role `RESPONSAVEL` e relações válidas no Prisma Client.

## v1.1.0 - 2026-05-18

### Segurança

- Reforçado o controle de acesso por perfil nas rotas de equipe e professores.
- Restrito `/api/staff` para administradores e diretores.
- Bloqueado acesso de responsáveis às rotas `/api/teacher`.
- Adicionadas checagens de grupo para impedir que professores consultem ou registrem presença de crianças fora de suas turmas atribuídas.

### Backend e Rotas

- Ajustada a ordem das rotas de pagamentos de equipe para evitar colisão com rotas parametrizadas.
- Incluída rota dedicada de equipe no módulo API.
- Ajustados pontos de autenticação, usuários e relatórios relacionados a perfis e operação diária.

### Admin e Portal

- Mantidas e organizadas telas administrativas de check-in/check-out, financeiro, grupos, medicamentos, fotos, configurações e usuários.
- Adicionadas ou ajustadas telas da área do professor para classes, presença e relatórios diários.
- Ajustados componentes de imagem para usar `next/image`.
- Corrigidos warnings de React Hooks.

### Build e Qualidade

- Reativadas validações de TypeScript e ESLint nos builds do Next.js.
- Adicionadas configurações de lint para `admin`, `web` e `api`.
- Corrigido build offline removendo dependência de carregamento remoto de Google Fonts.
- Rotas API do admin marcadas como dinâmicas quando dependem de cookies/cabeçalhos.
- Validado build completo do monorepo com `pnpm.cmd build`.

### Documentação

- Corrigidas portas oficiais do projeto: Admin `3001` e Portal dos responsáveis `3000`.
- Atualizado README com versão atual, status, módulos implementados e comandos de validação.
- Criado resumo de entrega para envio ao cliente.
