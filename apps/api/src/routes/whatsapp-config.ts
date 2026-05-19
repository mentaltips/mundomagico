import { Router } from 'express'
import { requireRole } from '../middleware/requireRole'
import { whatsappService } from '../services/whatsapp'

const router = Router()

// Somente diretores ou admins podem configurar o WhatsApp
router.use(requireRole('ADMIN', 'DIRECTOR'))

// Retorna o status atual da conexão e o QR Code (se estiver desconectado)
router.get('/status', (req, res) => {
  const status = whatsappService.getStatus()
  res.json(status)
})

// Força a desconexão (logout) do aparelho atual
router.post('/logout', async (req, res) => {
  try {
    await whatsappService.logout()
    res.json({ message: 'WhatsApp desconectado com sucesso.' })
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Erro ao desconectar WhatsApp' })
  }
})

export default router
