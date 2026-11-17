import { Router } from 'express'
import * as controller from '../controllers/quote.controller.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { auditAdminWrite } from '../middleware/audit.js'

const routes = Router()
routes.use(authenticate)
routes.get('/quotes', controller.list)
routes.get('/quotes/:id', controller.get)
routes.post('/quotes', authorize('customer'), controller.create)
routes.patch('/quotes/:id/assign', authorize('admin', 'superAdmin'), auditAdminWrite, controller.assign)
routes.patch('/quotes/:id/workflow', authorize('admin', 'superAdmin', 'sales'), controller.updateWorkflow)
routes.patch('/quotes/:id/status', authorize('admin', 'superAdmin', 'sales'), auditAdminWrite, controller.updateStatus)
routes.patch('/quotes/:id', authorize('admin', 'superAdmin', 'sales'), auditAdminWrite, controller.update)
routes.post('/quotes/:id/share', authorize('admin', 'superAdmin', 'sales'), auditAdminWrite, controller.share)
routes.post('/quotes/:id/accept', authorize('customer'), controller.accept)
routes.post('/quotes/:id/reject', authorize('customer'), controller.reject)
routes.post('/quotes/:id/request-revision', authorize('customer'), controller.requestRevision)
export default routes
