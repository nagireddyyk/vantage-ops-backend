import { Router } from 'express'
import * as controller from '../controllers/auth.controller.js'
import { authenticate } from '../middleware/auth.js'

const routes = Router()
routes.post('/auth/register', controller.register) // public sign-up (customers only)
routes.post('/auth/login', controller.login)
routes.get('/config', authenticate, controller.config)
export default routes
