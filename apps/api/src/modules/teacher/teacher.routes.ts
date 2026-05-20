import { Router } from 'express'
import * as teacherController from './teacher.controller'

const router = Router()

router.get('/dashboard', teacherController.getDashboard)
router.get('/classes', teacherController.getClasses)
router.get('/classes/:id', teacherController.getClassDetails)
router.get('/attendance', teacherController.getAttendance)
router.post('/attendance', teacherController.registerAttendance)

export default router

