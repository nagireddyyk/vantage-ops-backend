import express from 'express'
import cors from 'cors'
import { env } from './config/env.js'
import routes from './routes/index.js'
import { errorHandler, notFound } from './middleware/error.js'

const app = express()
app.use(cors({ origin: env.corsOrigin }))
app.use(express.json({ limit: '1mb' }))

app.get('/', (req, res) => res.json({
  name: 'Vantage Ops API', status: 'running', health: '/health',
  note: 'This is a JSON API. Endpoints live under /api (e.g. POST /api/auth/login). The web UI is the React app.',
}))
app.get('/health', (req, res) => res.json({ ok: true })) // ALB health check
app.get('/health/db', async (req, res) => {
  try { const { sequelize } = await import('./models/index.js'); await sequelize.authenticate(); res.json({ ok: true, database: 'connected' }) }
  catch { res.status(503).json({ ok: false, database: 'unavailable' }) }
})
app.use('/api', routes)
app.use(notFound)
app.use(errorHandler)

export default app
