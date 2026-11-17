import { Router } from 'express'
import * as controller from '../controllers/user.controller.js'
import { authenticate } from '../middleware/auth.js'

const routes = Router()
routes.use(authenticate)
routes.get('/me', controller.profile)
routes.put('/me', controller.updateProfile)
routes.put('/me/password', controller.changePassword)
export default routes
