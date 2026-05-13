import { Router } from 'express'
import { prisma } from '@mundo-magico/database'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const router = Router()

router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user || !user.password) {
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

    const token = jwt.sign(
      {
        sub: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
      },
      secret,
      { expiresIn: '30d' }
    )

    res.json({
      token,
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

export default router
