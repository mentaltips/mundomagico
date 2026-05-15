import { Router } from 'express'
import { prisma } from '@mundo-magico/database'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { requireApiAuth } from '../middleware/auth'

const router = Router()

// ─── Payload padrão do token ──────────────────────────────────────────────────
function buildPayload(user: { id: string; name: string; email: string; role: string; schoolId: string }) {
  return {
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    schoolId: user.schoolId,
  }
}

// ─── POST /auth/login ─────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' })
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user || !user.password || !user.active) {
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }

    const secret = process.env.NEXTAUTH_SECRET
    if (!secret) {
      return res.status(500).json({ error: 'Erro de configuração do servidor' })
    }

    // Token principal: 8 horas (reduzido de 30 dias)
    const token = jwt.sign(buildPayload(user), secret, { expiresIn: '8h' })

    // Refresh token: 7 dias — usado apenas para renovar o token principal
    const refreshToken = jwt.sign(
      { sub: user.id, type: 'refresh' },
      secret,
      { expiresIn: '7d' }
    )

    res.json({
      token,
      refreshToken,
      expiresIn: 8 * 60 * 60, // 8h em segundos
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
      },
    })
  } catch (error) {
    console.error('[Auth] Login error:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// ─── POST /auth/refresh ───────────────────────────────────────────────────────
// Recebe o refreshToken e devolve um novo token principal (sem exigir senha)
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body
  if (!refreshToken) {
    return res.status(400).json({ error: 'refreshToken é obrigatório' })
  }

  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    return res.status(500).json({ error: 'Erro de configuração do servidor' })
  }

  try {
    const payload = jwt.verify(refreshToken, secret) as any

    if (payload.type !== 'refresh') {
      return res.status(401).json({ error: 'Token inválido' })
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user || !user.active) {
      return res.status(401).json({ error: 'Usuário inativo ou não encontrado' })
    }

    const newToken = jwt.sign(buildPayload(user), secret, { expiresIn: '8h' })

    res.json({
      token: newToken,
      expiresIn: 8 * 60 * 60,
    })
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Refresh token expirado. Faça login novamente.' })
    }
    return res.status(401).json({ error: 'Token inválido' })
  }
})

// ─── GET /auth/me ─────────────────────────────────────────────────────────────
// Retorna dados do usuário logado
router.get('/me', requireApiAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.sub },
      select: { id: true, name: true, email: true, role: true, schoolId: true, active: true, avatarUrl: true },
    })
    if (!user || !user.active) {
      return res.status(401).json({ error: 'Usuário não encontrado' })
    }
    res.json(user)
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// ─── POST /auth/change-password ──────────────────────────────────────────────
router.post('/change-password', requireApiAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' })
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres' })
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user?.sub } })
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }

    const isValid = await bcrypt.compare(currentPassword, user.password!)
    if (!isValid) {
      return res.status(401).json({ error: 'Senha atual incorreta' })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })

    res.json({ success: true, message: 'Senha alterada com sucesso' })
  } catch (error) {
    console.error('[Auth] Change password error:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

export default router
