import { Router } from 'express'
import { prisma } from '@mundo-magico/database'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const groups = await prisma.group.findMany({
      include: {
        _count: {
          select: { students: true, children: true }
        }
      }
    })
    res.json(groups)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch groups' })
  }
})

export default router
