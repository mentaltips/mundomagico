# 🌟 Mundo Mágico — Sistema de Gestão

Sistema completo para **escolas, creches, berçários, maternais, espaços infantis** e instituições híbridas.

## Estrutura do Monorepo

```
mundo-magico/
├── apps/
│   ├── admin/          # Painel administrativo (Next.js, porta 3000)
│   ├── web/            # Portal dos responsáveis (Next.js, porta 3001)
│   └── api/            # Serviços auxiliares (WhatsApp, Email)
│
├── packages/
│   ├── database/       # Schema Prisma + client compartilhado
│   └── types/          # Tipos, enums e DTOs compartilhados
│
└── turbo.json          # Configuração Turborepo
```

## ⚡ Início Rápido

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Edite o .env com suas configurações
```

### 3. Criar e popular o banco de dados

```bash
npm run db:push     # Cria as tabelas
npm run db:seed     # Popula com dados de exemplo
```

### 4. Iniciar em desenvolvimento

```bash
npm run dev
```

- **Admin**: http://localhost:3000
- **Portal pais**: http://localhost:3001

**Login padrão:**  
Email: `admin@mundomagico.com.br`  
Senha: `admin123`

---

## 📋 Módulos

### Admin (`apps/admin`)

| Rota | Módulo |
|------|--------|
| `/admin/dashboard` | Dashboard com métricas em tempo real |
| `/admin/children` | Cadastro e gestão de crianças |
| `/admin/children/new` | Formulário completo de cadastro |
| `/admin/daily-routine` | Lista de rotinas por dia |
| `/admin/daily-routine/[childId]` | Diário individual da criança |
| `/admin/check-in-out` | Controle de entrada e saída |
| `/admin/medications` | Gestão de medicações |
| `/admin/child-items` | Controle de itens (fraldas, etc.) |
| `/admin/child-photos` | Fotos e álbuns do dia |
| `/admin/development-reports` | Relatórios de desenvolvimento |
| `/admin/authorized-pickup` | Pessoas autorizadas a buscar |
| `/admin/settings/institution-type` | Configuração do tipo de instituição |

### Portal dos Responsáveis (`apps/web`)

| Rota | Conteúdo |
|------|----------|
| `/portal/[childId]` | Diário completo do dia |

---

## 🏫 Tipos de Instituição

O sistema se adapta automaticamente ao tipo selecionado:

| Tipo | Terminologia | Módulos |
|------|-------------|---------|
| **Escola** | Aluno, Professor, Turma, Nota, Boletim | Notas, Frequência, Disciplinas |
| **Creche** | Criança, Educador, Grupo | Rotina diária, Entrada/saída, Medicações |
| **Berçário** | Criança, Cuidador, Sala | Todos de creche |
| **Maternal** | Criança, Monitor, Grupo | Todos de creche |
| **Espaço Infantil** | Criança, Educador, Grupo | Todos de creche |
| **Híbrido** | Configurável | Todos (personalizável) |

---

## 💬 Integração WhatsApp

Configure no `.env`:

```
WHATSAPP_API_TOKEN=seu_token_aqui
WHATSAPP_PHONE_NUMBER_ID=seu_phone_id
```

O sistema envia automaticamente:
- ✅ Notificação de entrada da criança
- 👋 Notificação de saída
- 📋 Diário do dia (alimentação, sono, humor, atividades)
- 📦 Solicitação de reposição de itens
- ⚠️ Alertas importantes

---

## 📊 Banco de Dados

Entidades principais:
- `School` — Instituição
- `Child` — Criança (creche/berçário)
- `Student` — Aluno (escola formal)
- `Group` — Grupo/Turma/Sala
- `Guardian` — Responsável
- `ChildDailyReport` — Diário diário
- `DailyMeal`, `DailySleep`, `DailyHygiene`, `DailyHealth`, `DailyMood`, `DailyActivity`
- `ChildCheckInOut` — Entrada e saída
- `AuthorizedPickupPerson` — Pessoas autorizadas a buscar
- `Medication`, `MedicationAdministration` — Medicações
- `ChildItem`, `ChildItemUsage` — Itens
- `ChildPhoto` — Fotos
- `DevelopmentReport` — Relatórios de desenvolvimento

---

## ✅ Critérios de Aceite

- [x] Admin configura instituição como creche/berçário/espaço infantil
- [x] Sistema muda linguagem de "aluno" para "criança"
- [x] Admin cadastra crianças com dados completos de saúde e rotina
- [x] Admin vincula responsáveis
- [x] Admin cadastra pessoas autorizadas a buscar
- [x] Equipe lança rotina diária (alimentação, sono, higiene, humor, atividades)
- [x] Equipe envia resumo do dia por WhatsApp
- [x] Responsável vê diário da criança no portal
- [x] Sistema controla entrada e saída com alerta de pessoa não autorizada
- [x] Sistema registra medicação com autorização obrigatória
- [x] Sistema solicita reposição de itens
- [x] Sistema respeita autorização de imagem para fotos
