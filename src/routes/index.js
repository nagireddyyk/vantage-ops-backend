import { Router } from 'express'
import auth from './auth.routes.js'
import users from './user.routes.js'
import products from './product.routes.js'
import quotes from './quote.routes.js'
import orders from './order.routes.js'
import tickets from './ticket.routes.js'
import admin from './admin.routes.js'
import leads from './lead.routes.js'
import { createPublic } from '../controllers/lead.controller.js'

const api = Router()

// IMPORTANT: register public lead submission BEFORE routers that use authenticate
// at router level (for example products.routes.js). Otherwise those routers can
// reject /leads/public before Express reaches the public lead route.
api.post('/leads/public', createPublic)

api.use(auth, users, products, quotes, orders, tickets, admin, leads)
export default api
