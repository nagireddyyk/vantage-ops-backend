import { Router } from 'express'
import multer from 'multer'
import * as controller from '../controllers/product.controller.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { auditAdminWrite } from '../middleware/audit.js'

const routes = Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(xlsx|xls|csv)$/i.test(file.originalname || '')
    cb(allowed ? null : new Error('Only .xlsx, .xls, and .csv files are supported'), allowed)
  },
})
const admins = authorize('admin', 'superAdmin')

routes.use(authenticate)
routes.post('/pricing', controller.price)
routes.get('/products', controller.list)
routes.get('/products/categories', controller.categories)
routes.get('/products/:id', controller.get)
routes.post('/products/import', admins, upload.single('file'), auditAdminWrite, controller.importProducts)
routes.post('/products', admins, auditAdminWrite, controller.create)
routes.put('/products/:id', admins, auditAdminWrite, controller.update)
routes.patch('/products/:id/pricing', admins, auditAdminWrite, controller.updatePricing)
routes.delete('/products/:id', admins, auditAdminWrite, controller.remove)
export default routes
