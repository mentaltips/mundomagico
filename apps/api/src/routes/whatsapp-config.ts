import { Router } from 'express'
import { prisma } from '@mundo-magico/database'
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

// Disparar transmissão/broadcast para responsáveis
router.post('/broadcast', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId
    const { targetStatus, message } = req.body

    if (!message) {
      return res.status(400).json({ error: 'Mensagem é obrigatória' })
    }

    const isConnected = whatsappService.getStatus().status === 'connected'
    if (!isConnected) {
      return res.status(400).json({ error: 'WhatsApp não conectado.' })
    }

    // Query active children matching targetStatus
    const children = await prisma.child.findMany({
      where: {
        schoolId,
        ...(targetStatus && targetStatus !== 'ALL' && { status: targetStatus })
      },
      include: {
        guardians: {
          include: {
            guardian: true
          }
        }
      }
    })

    let successCount = 0
    let failureCount = 0

    // Send messages in background
    for (const child of children) {
      const guardian = child.guardians?.[0]?.guardian
      if (guardian && guardian.phone) {
        const guardianName = guardian.fullName.split(' ')[0] || 'Responsável'
        const studentName = child.fullName
        const studentStatus = child.status === 'PENDENTE_PAGAMENTO' ? 'Pendente de Pagamento' :
                              child.status === 'AGUARDANDO_VAGA' ? 'Aguardando Vaga' :
                              child.status === 'ATIVO' ? 'Ativo' :
                              child.status === 'ADAPTACAO' ? 'Em Adaptação' : 'Inativo'

        const formattedText = message
          .replace(/{{nome_responsavel}}/g, guardianName)
          .replace(/{{nome_aluno}}/g, studentName)
          .replace(/{{status_aluno}}/g, studentStatus)
          .replace(/{{escola}}/g, 'Escola Mundo Mágico')

        const sent = await whatsappService.sendTextMessage(guardian.phone, formattedText)
        if (sent) {
          successCount++
        } else {
          failureCount++
        }
      }
    }

    res.json({
      message: 'Broadcast finalizado.',
      total: children.length,
      success: successCount,
      failures: failureCount
    })
  } catch (error) {
    req.log.error(error)
    res.status(500).json({ error: 'Erro ao enviar broadcast' })
  }
})

export default router
