import { Router } from 'express'
import { requirePermission } from '../../shared/middlewares/permissions.middleware'
import * as photosController from './photos.controller'

const router = Router()

router.use(requirePermission('canManageStudents'))

router.get('/', photosController.listPhotos)
router.post('/', photosController.createPhoto)
router.delete('/:id', photosController.deletePhoto)

export default router

