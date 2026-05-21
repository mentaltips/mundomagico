# Changelog

## v1.2.2 - 2026-05-21

### Financeiro

- Corrigido o total de `Recebido` para somar somente valores efetivamente pagos dentro do periodo selecionado.
- Adicionados filtros de periodo no resumo financeiro: hoje, semana, mes e tudo.
- Ajustado o calculo de recebidos para considerar a data de pagamento quando disponivel, mantendo vencimento para pendentes e vencidos.
- Corrigida a listagem de faturas para nao exibir cobrancas canceladas na aba `Todas`.
- Adicionada exibicao de data e horario das transacoes financeiras na tabela.
- Melhorado o seletor de aluno/crianca na criacao de fatura com campo de pesquisa para facilitar uso com muitos cadastros.

### Itens das criancas / estoque

- Adicionado botao para excluir item individual do estoque da crianca.
- Adicionada acao para remover uma crianca da tela de `Itens das Criancas` sem apagar o cadastro principal da crianca.
- Ajustada a remocao para preservar historico e marcar itens como inativos em vez de apagar fisicamente.
- Criado proxy explicito no admin para `DELETE /api/child-items/:id`, evitando erro 404 quando a chamada passa pelo frontend.
- Tornada a exclusao de item idempotente: se o item ja estava removido, o backend considera a operacao concluida.
- Corrigida a tela para remover imediatamente itens e criancas do cache local apos exclusao.
- Adicionada protecao para impedir que itens/criancas removidos reaparecam depois de um refetch do React Query.
- Ajustada a listagem da API para retornar apenas itens ativos de criancas nao arquivadas e com status operacional.
- Ajustada a validacao de crianca ao criar item para ignorar criancas arquivadas/inativas.

### Criancas, turmas e rotina diaria

- Corrigida a rotina diaria para listar apenas criancas ativas, em adaptacao ou pendentes de pagamento, ignorando arquivadas/inativas.
- Corrigida validacao ao registrar rotina diaria para bloquear criancas arquivadas/inativas.
- Corrigido o total de alunos em `Gestao de Turmas` para contar apenas criancas/alunos ativos e nao arquivados.
- Corrigida a ocupacao exibida no card de turma para somar corretamente criancas e alunos ativos.

### Notificacoes

- Ajustado o sininho de notificacoes para marcar notificacoes como lidas ao clicar.
- Adicionada acao para marcar notificacoes como lidas.
- Persistida localmente a leitura de notificacoes para evitar que o contador continue mostrando itens ja lidos na mesma instalacao do navegador.

### Uploads e imagens

- Ajustado o proxy `/api/uploads/...` do admin para retornar um placeholder quando uma imagem antiga nao existir mais no backend.
- Reduzido o impacto visual de fotos ausentes, evitando imagem quebrada na interface.

### Deploy e validacao

- Publicados os commits `ba3038d`, `2a4e95a`, `0dd38eb` e `16fcf13` em `origin/main`.
- Executado deploy na VPS Ubuntu via SSH para atualizar API e worker.
- Confirmado `migrate deploy` do Prisma sem migrations pendentes.
- Confirmado healthcheck da API em producao respondendo `ok`.
- Validado build da API com `pnpm.cmd --filter @mundo-magico/api build`.
- Validado build do admin com `pnpm.cmd --filter @mundo-magico/admin build`.
- Observacao: `deploy-vps.sh` atualiza API e worker; alteracoes do `apps/admin` dependem do deploy do frontend/admin pegar o commit mais recente.

## v1.2.1 - 2026-05-19

### Seguranca multi-tenant

- Reforcado o isolamento por `schoolId` nas rotas do portal do responsavel (`/api/parent` e `/api/responsavel`).
- Corrigidas consultas de responsavel, criancas vinculadas, check-in/out, relatorios, fotos, faturas e feed para respeitar a escola autenticada.
- Ajustada a permissao interna do modulo de professor para reconhecer tambem roles em PT-BR (`ADMIN_ESCOLA`, `DIRETOR`) nos fluxos administrativos.
- Reforcadas as rotas de rotina diaria e relatorios diarios (`/api/daily-routine` e `/api/daily-reports`) com permissao `canManageStudents`.
- Validado `childId` contra `schoolId` antes de criar ou atualizar relatorios diarios, evitando upsert em criancas de outra escola.
- Reforcado o modulo de saude (`/api/health`) com permissao `canManageStudents`.
- Validado `childId` contra `schoolId` antes de criar ou mover medicacoes, e ignorado `schoolId` recebido pelo body em atualizacoes.
- Reforcados os modulos de calendario e comunicados (`/api/calendar` e `/api/announcements`) com permissao `canManageStudents`.
- Validado `groupId` contra `schoolId` antes de criar ou atualizar eventos e comunicados.
- Ajustado envio de WhatsApp de comunicados para respeitar `groupId` quando o comunicado for direcionado a uma turma.
- Reforcado o modulo de equipe e folha (`/api/staff`) com permissoes finas para equipe (`canManageStaff`) e folha (`canViewPayroll`, `canManagePayroll`).
- Validado `userId`, `staffId` e `groupId` contra `schoolId` antes de vincular usuarios, funcionarios e turmas.
- Ajustados calculos de bonus e descontos para considerar apenas registros do mesmo `schoolId`.
- Reforcados os modulos de fotos, documentos e itens da crianca (`/api/photos`, `/api/documents`, `/api/child-items`) com permissao `canManageStudents`.
- Validado `childId` e `groupId` contra `schoolId` antes de criar fotos e itens da crianca.
- Ignorado `schoolId` recebido pelo body em fotos e itens da crianca, mantendo o tenant vindo da autenticacao.
- Reforcados os modulos de relatorios de desenvolvimento e entrada/saida (`/api/development-reports` e `/api/check-in-out`) com permissao `canManageStudents`.
- Validado `childId` contra `schoolId` antes de criar, atualizar ou registrar presenca/entrada-saida.
- Validado `groupId` contra `schoolId` nos filtros de chamada e relatorio mensal de presenca.
- Reforcados os modulos de metricas, relatorios, analytics e notificacoes (`/api/stats`, `/api/reports`, `/api/analytics`, `/api/notifications`).
- Protegido `/api/analytics` com autenticacao e tenant obrigatorios.
- Adicionada permissao `canViewReports` para metricas/exportacoes e `canViewFinance` para exportacao financeira.
- Ajustadas notificacoes para exibir alertas de estoque e financeiro apenas para perfis com permissao correspondente.
- Reforcado upload de imagens (`/api/upload`) com permissao `canManageStudents`, validacao de MIME + extensao e nomes seguros para exclusao.
- Endurecida a entrega de `/uploads` com bloqueio de dotfiles, `nosniff`, cache controlado e opcao `PUBLIC_UPLOADS_ENABLED=false` para exigir autenticacao/tenant na leitura.
- Reforcado fluxo de webhooks Mercado Pago para registrar `PaymentWebhookEvent` antes de qualquer decisao de processamento.
- Eventos duplicados, sem `paymentId` ou de tipo nao suportado agora ficam auditados como `IGNORED`/`FAILED`, sem duplicar `Payment`.
- Atualizacao de status Mercado Pago da fatura agora respeita `invoiceId + schoolId`.
- Substituida exclusao fisica de crianca por arquivamento com `status = INATIVO` e `archivedAt`, preservando historico escolar, financeiro e documentos.
- Substituida exclusao fisica de fatura por cancelamento logico (`CANCELADO`) com filtro por `schoolId`.
- Endurecida atualizacao de fatura para usar `id + schoolId` em vez de mutacao por `id` isolado.
- Substituida exclusao fisica de responsavel/usuario por arquivamento do responsavel e desativacao segura do usuario vinculado quando nao houver outros vinculos.
- Listagens e buscas principais de criancas/responsaveis agora ignoram registros arquivados.
- Substituida exclusao fisica de turma por desativacao (`active = false`), preservando historico de vinculos, eventos e comunicados.
- Listagens e buscas principais de alunos agora ignoram registros arquivados.

### Validacao

- Validado build da API com `pnpm.cmd --filter @mundo-magico/api build`.
- Validado harness de seguranca com `pnpm.cmd --filter @mundo-magico/api test:security`.

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
