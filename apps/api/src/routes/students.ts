import { Router } from 'express'
import { prisma } from '@mundo-magico/database'
import { z } from 'zod'

const router = Router()

// List all students
router.get('/', async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        group: true,
        guardians: { include: { guardian: true } }
      },
      orderBy: {
        fullName: 'asc'
      }
    })
    res.json(students)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch students' })
  }
})

// Get single student
router.get('/:id', async (req, res) => {
  const { id } = req.params
  try {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        group: true,
        guardians: {
          include: {
            guardian: true
          }
        }
      }
    })
    if (!student) return res.status(404).json({ error: 'Student not found' })
    res.json(student)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch student' })
  }
})

// Create student
const createStudentSchema = z.object({
  fullName: z.string(),
  birthDate: z.string().transform(str => new Date(str)),
  schoolId: z.string(),
  groupId: z.string().optional(),
  shift: z.enum(['MANHA', 'TARDE', 'INTEGRAL', 'NOTURNO']).default('MANHA'),
})

router.post('/', async (req, res) => {
  try {
    const data = createStudentSchema.parse(req.body)
    const student = await prisma.student.create({
      data
    })
    res.status(201).json(student)
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json(error.errors)
    res.status(500).json({ error: 'Failed to create student' })
  }
})

export default router
