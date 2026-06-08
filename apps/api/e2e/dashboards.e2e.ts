/**
 * E2E Dashboard Tests — Admin / Professor / Responsável
 *
 * Testa os dashboards reais via navegador Playwright.
 * Requer: admin rodando em http://localhost:3001
 *         web rodando em http://localhost:3000
 *
 * Run: npx playwright test --config=playwright.config.ts --project=browser
 */

import { test, expect } from '@playwright/test'

// ═══════════════════════════════════════════════════════════
// ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════
test.describe('Dashboard Admin', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/login')
  })

  test('Página de login carrega formulário', async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('Login com campos vazios mostra validação', async ({ page }) => {
    await page.locator('button[type="submit"]').click()
    // Deve mostrar erro de validação
    await expect(page.locator('text=email')).toBeVisible()
  })

  test('Login com credenciais inválidas mostra erro', async ({ page }) => {
    await page.fill('input[type="email"]', 'admin@test.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.locator('button[type="submit"]').click()
    // Espera mensagem de erro (401)
    await expect(page.locator('text=Credenciais')).toBeVisible({ timeout: 10000 })
  })

  test('Layout do admin carrega sem erros de console', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.goto('http://localhost:3001')
    // Aguarda página carregar completamente
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
    expect(errors.filter(e => !e.includes('favicon')).length).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════
// PROFESSOR / WEB DASHBOARD
// ═══════════════════════════════════════════════════════════
test.describe('Dashboard Professor/Web', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login')
  })

  test('Página de login do web carrega', async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('Formulário de login tem campos obrigatórios', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')
    await expect(emailInput).toHaveAttribute('required')
    await expect(passwordInput).toHaveAttribute('required')
  })

  test('Layout carrega sem erros de console', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
    expect(errors.filter(e => !e.includes('favicon')).length).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════
// RESPONSÁVEL (PAIS) DASHBOARD
// ═══════════════════════════════════════════════════════════
test.describe('Dashboard Responsável (Pais)', () => {
  test('Página de login para responsável carrega', async ({ page }) => {
    await page.goto('http://localhost:3000/login')
    await expect(page.locator('form')).toBeVisible()
  })

  test('Acessar rota protegida sem login redireciona', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard')
    // Deve redirecionar para /login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('Responsável sem token não acessa área restrita', async ({ page }) => {
    await page.goto('http://localhost:3000/children')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })
})

// ═══════════════════════════════════════════════════════════
// RESPONSIVIDADE E ACESSIBILIDADE
// ═══════════════════════════════════════════════════════════
test.describe('Responsividade', () => {
  test('Admin funciona em mobile (viewport 375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('http://localhost:3001/login')
    await expect(page.locator('form')).toBeVisible()
  })

  test('Web funciona em tablet (viewport 768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('http://localhost:3000/login')
    await expect(page.locator('form')).toBeVisible()
  })
})
