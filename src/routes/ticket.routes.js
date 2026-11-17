import { Router } from 'express'
import * as controller from '../controllers/ticket.controller.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { auditAdminWrite } from '../middleware/audit.js'

const routes = Router()
routes.use(authenticate)
routes.get('/tickets', controller.list)
routes.get('/tickets/:id', controller.get)
routes.post('/tickets', authorize('customer'), controller.create)
routes.patch('/tickets/:id/assign', authorize('admin', 'superAdmin'), auditAdminWrite, controller.assign)
routes.patch('/tickets/:id/workflow', authorize('admin', 'superAdmin', 'sales'), controller.updateWorkflow)
routes.patch('/tickets/:id/customer-update', authorize('customer'), controller.customerUpdate)
routes.patch('/tickets/:id', authorize('admin', 'superAdmin', 'sales'), auditAdminWrite, controller.update)
export default routes
