import { Router } from 'express'
import { requirePermission } from '../../shared/middlewares/permissions.middleware'
import * as settingsController from './settings.controller'

const router = Router()

router.get('/', settingsController.getSettings)
router.patch('/', requirePermission('canManageSchoolSettings'), settingsController.updateSettings)
router.get('/institution-type', settingsController.getInstitutionType)
router.patch('/institution-type', requirePermission('canManageSchoolSettings'), settingsController.updateInstitutionType)

export default router
