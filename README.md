# Mundo Mágico - Sistema de Gestão

Versão atual: **v1.2.0**  
Data da entrega: **19/05/2026**

Sistema completo para escolas, creches, berçários, maternais, espaços infantis e instituições híbridas.

## Status da Versão

- Build de produção validado com `pnpm.cmd build`.
- Lint validado nos módulos `admin`, `web` e `api`.
- Admin operando na porta `3001`.
- Portal dos responsáveis operando na porta `3000`.
- API preparada para controle de acesso por perfil.

## Estrutura do Monorepo

```text
mundo-magico/
├── apps/
│   ├── admin/          # Painel administrativo (Next.js, porta 3001)
│   ├── web/            # Portal dos responsáveis (Next.js, porta 3000)
│   └── api/            # API e serviços auxiliares
│
├── packages/
│   ├── database/       # Schema Prisma + client compartilhado
│   └── types/          # Tipos, enums e DTOs compartilhados
│
└── turbo.json          # Configuração Turborepo
```

## Arquitetura Modular (Megaoperação)

O sistema foi completamente reestruturado de forma totalmente modular e desacoplada:

- **Separação estrita de Responsabilidades**: Os pacotes compartilhados sob o diretório `packages/` centralizam o acesso a dados (`packages/database` com Prisma Client) e regras de tipos/enums (`packages/types`), servindo como fonte única da verdade para todos os sub-aplicativos (`apps/`).
- **Nacionalização linguística (PT-BR) de Cargos**: Todas as roles e estruturas de visualização de perfis de equipe e responsáveis foram padronizadas e traduzidas do inglês para o português de ponta a ponta (ex: `RESPONSAVEL`, `PROFESSOR`, `DIRETOR`, `FUNCIONARIO`).
- **Rotas e API Desacopladas**: O roteamento do frontend (`/responsavel`, `/professor`) e da API (`/api/responsavel`, `/api/professor`) opera de forma independente e isolada, com middlewares de permissões e controle de acesso estrito.


## Início Rápido

### 1. Instalar dependências

```bash
pnpm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Edite o .env com suas configurações
```

### 3. Criar e popular o banco de dados

```bash
pnpm db:push
pnpm --filter @mundo-magico/database db:seed
```

### 4. Iniciar em desenvolvimento

```bash
pnpm dev
```

- **Admin**: http://localhost:3001
- **Portal dos responsáveis**: http://localhost:3000

Login padrão:

- Email: `admin@mundomagico.com.br`
- Senha: `admin123`

## Módulos Implementados

### Administração

- Dashboard administrativo com indicadores e dados operacionais.
- Cadastro e gestão de crianças.
- Cadastro e gestão de responsáveis.
- Vínculo entre crianças, responsáveis e pessoas autorizadas.
- Gestão de usuários e perfis.
- Configuração do tipo de instituição.
- Controle de grupos, turmas e salas.
- Controle de entrada e saída.
- Relatório mensal de check-in/check-out.
- Gestão de rotina diária.
- Gestão de medicamentos e administração de doses.
- Controle de itens da criança.
- Upload e gerenciamento de fotos.
- Relatórios de desenvolvimento.
- Financeiro com faturas, pagamentos e telas de impressão.
- Pagamentos de equipe.
- Configurações gerais e políticas internas.

### Portal dos Responsáveis

- Visualização de informações da criança.
- Acompanhamento de rotina, fotos, pagamentos e comunicados.
- Feed para responsáveis com dados autorizados.
- Isolamento de dados por criança e responsável.

### Área do Professor

- Dashboard do professor.
- Listagem de turmas/classes atribuídas.
- Registro e consulta de presença.
- Rotinas e relatórios diários relacionados aos grupos permitidos.
- Restrição para que professores acessem somente crianças dos grupos atribuídos.

### API e Segurança

- Proteção de rotas por perfil.
- `/api/staff` restrita a administradores e diretores.
- `/api/teacher` bloqueada para responsáveis.
- Controle interno para impedir vazamento de presença entre grupos.
- Rotas de pagamentos ordenadas antes de rotas parametrizadas para evitar colisão.
- Proxy de API do Next.js configurado como dinâmico quando usa cookies/cabeçalhos.
- Validações de build, TypeScript e ESLint reativadas.

### Qualidade e Build

- Build offline corrigido sem dependência de Google Fonts remotas.
- Lint configurado para `admin`, `web` e `api`.
- Warnings de React Hooks corrigidos.
- Imagens convertidas para `next/image` onde aplicável.
- Configurações de portas alinhadas entre código e documentação.

## Comandos de Validação

```bash
pnpm.cmd --filter @mundo-magico/admin lint
pnpm.cmd --filter @mundo-magico/web lint
pnpm.cmd --filter @mundo-magico/api lint
pnpm.cmd build
```

## Histórico de Versões

- **v1.2.0** - Tradução de todos os cargos e caminhos de rotas do inglês para o português (`RESPONSAVEL`, `PROFESSOR`, etc), script automatizado de migração de cargos e correção de tipos do seed.
- **v1.1.0** - Hardening de segurança, ajustes de build/lint, correção de rotas, melhorias no portal/admin/professor e documentação de entrega.
- **v1.0.0** - Base inicial do sistema Mundo Mágico.
