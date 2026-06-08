# MundoMagico — QA Test Suite Implementation Plan

> **Goal:** Implantar uma suite de testes profissionais (QA) no MundoMagico, começando pelos testes unitários dos módulos críticos (auth, children, payments).

**Arquitetura:** Pirâmide de testes padrão QA — Unitários (vitest) → Integração (supertest) → E2E (Playwright). Começamos pela base: unitários com vitest + mocks.

**Tech Stack:** Vitest, TypeScript, Zod schemas, Express middleware, Prisma (mockado)

**Status:** Em execução — Fase 1 (unitários)

---

## Fase 1 — Infraestrutura de Testes

### T1: Instalar vitest e configurar test runner
- **Files:** `apps/api/package.json`, `apps/api/vitest.config.ts`
- Adicionar `vitest` e `@vitest/coverage-v8` como devDependencies
- Criar vitest.config.ts com path aliases compatíveis

### T2: Criar `src/__tests__/` com estrutura de diretórios
- **Files:** `src/__tests__/schemas/`, `src/__tests__/middleware/`, `src/__tests__/services/`, `src/__tests__/shared/`

---

## Fase 2 — Testes Unitários (base da pirâmide)

### T3: Schemas de autenticação (Zod validation)
- **Files:** `src/__tests__/schemas/auth.schema.test.ts`
- Testar: `loginSchema`, `refreshTokenSchema`, `changePasswordSchema`
- Validar emails inválidos, senhas curtas, campos obrigatórios

### T4: Middleware de autenticação
- **Files:** `src/__tests__/middleware/auth.middleware.test.ts`
- Testar: token ausente, token inválido, token expirado, token válido
- Mock do `jsonwebtoken` + req/res/next do Express

### T5: AppError e error codes
- **Files:** `src/__tests__/shared/AppError.test.ts`
- Testar: criação de AppError, status codes, error codes, mensagens

### T6: Auth Service — função `login`
- **Files:** `src/__tests__/services/auth.service.test.ts`
- Mock do `authRepository`
- Testar: login válido, email não encontrado, senha incorreta, usuário inativo

### T7: Auth Service — função `refresh`
- **Files:** `src/__tests__/services/auth.service.test.ts`
- Testar: refresh válido, token expirado, token revogado, familyId inválido

### T8: Auth Service — função `changePassword`
- **Files:** `src/__tests__/services/auth.service.test.ts`
- Testar: troca válida, senha atual incorreta, usuário não encontrado

---

## Fase 3 — Schemas dos módulos principais

### T9: Children schema
- **Files:** `src/__tests__/schemas/children.schema.test.ts`

### T10: Payment/Webhook schema
- **Files:** `src/__tests__/schemas/webhooks.schema.test.ts`

---

## Fase 4 — Integração (após unitários OK)

### T11: Setup supertest + test database
### T12: Fluxo completo de autenticação
### T13: CRUD de crianças com tenant isolation

---

## Fase 5 — CI Pipeline

### T14: GitHub Actions rodando testes a cada push
