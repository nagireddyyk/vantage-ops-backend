import { Router } from 'express'
import * as controller from '../controllers/lead.controller.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { auditAdminWrite } from '../middleware/audit.js'

const routes = Router()
routes.post('/leads/public', controller.createPublic)
routes.use(authenticate)
routes.get('/leads', controller.list)
routes.post('/leads', authorize('customer'), controller.create)
routes.patch('/leads/:id/assign', authorize('admin', 'superAdmin'), auditAdminWrite, controller.assign)
routes.patch('/leads/:id/workflow', authorize('admin', 'superAdmin', 'sales'), controller.updateWorkflow)
export default routes
