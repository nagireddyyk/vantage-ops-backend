import { Router } from 'express'
import * as orders from '../controllers/order.controller.js'
import * as pos from '../controllers/purchaseOrder.controller.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { auditAdminWrite } from '../middleware/audit.js'

const routes = Router()
routes.use(authenticate)
routes.get('/orders', orders.list)
routes.get('/orders/:id', orders.get)
routes.post('/orders', authorize('customer'), orders.create)
routes.post('/orders/:id/cancel', authorize('customer'), orders.cancel)
routes.post('/orders/:id/respond', authorize('customer'), orders.respondToOffer)
routes.patch('/orders/:id/assign', authorize('admin', 'superAdmin'), auditAdminWrite, orders.assign)
routes.patch('/orders/:id/workflow', authorize('admin', 'superAdmin', 'sales'), orders.updateWorkflow)
routes.patch('/orders/:id/status', authorize('admin', 'superAdmin', 'sales'), auditAdminWrite, orders.updateStatus)

routes.get('/purchase-orders', pos.list)
routes.get('/purchase-orders/:id', pos.get)
routes.post('/purchase-orders', authorize('customer'), pos.create)
routes.patch('/purchase-orders/:id/assign', authorize('admin', 'superAdmin'), auditAdminWrite, pos.assign)
routes.patch('/purchase-orders/:id/workflow', authorize('admin', 'superAdmin', 'sales'), pos.updateWorkflow)
routes.patch('/purchase-orders/:id/approve', authorize('admin', 'superAdmin'), auditAdminWrite, pos.approve)
routes.patch('/purchase-orders/:id/reject', authorize('admin', 'superAdmin'), auditAdminWrite, pos.reject)
export default routes
