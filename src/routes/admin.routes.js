import { Router } from 'express'
import * as controller from '../controllers/admin.controller.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { auditAdminWrite } from '../middleware/audit.js'
import * as salesUserController from '../controllers/salesUser.controller.js'

const routes = Router()
routes.use('/admin', authenticate, authorize('admin', 'superAdmin'))
routes.get('/admin/summary', controller.summary)
routes.get('/admin/sales-users', controller.salesUsers)
// Sales-person account CRUD is restricted to super admins. Delete deactivates accounts to preserve assignment history.
routes.get('/admin/sales-persons', authenticate, authorize('superAdmin'), salesUserController.list)
routes.post('/admin/sales-persons', authenticate, authorize('superAdmin'), auditAdminWrite, salesUserController.create)
routes.patch('/admin/sales-persons/:id', authenticate, authorize('superAdmin'), auditAdminWrite, salesUserController.update)
routes.delete('/admin/sales-persons/:id', authenticate, authorize('superAdmin'), auditAdminWrite, salesUserController.remove)
routes.get('/admin/sales-performance', controller.salesPerformance)
routes.get('/admin/customers', controller.customers)
routes.get('/admin/customers/:id', controller.customerDetail)
routes.patch('/admin/customers/:id/status', auditAdminWrite, controller.updateCustomerStatus)
export default routes
