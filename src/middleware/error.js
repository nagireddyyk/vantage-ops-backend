import { ensureSchema, isMissingTable } from '../db/selfHeal.js'

export const notFound = (req, res) => res.status(404).json({ error: 'Route not found' })

export const errorHandler = (err, req, res, _next) => {
  // A table disappeared while the server was running: recreate it in the background; the next request works.
  if (!err.status && isMissingTable(err)) {
    ensureSchema().catch((e) => console.error('Could not recreate tables:', e.message))
    return res.status(503).json({ error: 'The database was just reset. Please try again in a moment.' })
  }
  if (!err.status) console.error(err)
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Internal server error' })
}
