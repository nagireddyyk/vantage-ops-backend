import { sequelize } from '../models/index.js'

// True when a query failed because a table is missing (for example it was dropped in SQL
// while the server was running). Works for MySQL and SQLite.
export function isMissingTable(err) {
  for (let e = err, depth = 0; e && depth < 4; e = e.parent || e.original || e.cause, depth += 1) {
    if (e.code === 'ER_NO_SUCH_TABLE' || e.errno === 1146) return true
    if (/no such table|doesn't exist/i.test(String(e.message || '')) && /table/i.test(String(e.message || ''))) return true
  }
  return false
}

// Creates any missing tables from the models. Never deletes or changes existing tables or data.
// Several requests failing at once share one run.
// Code that caches database lookups registers here so it can forget them after a rebuild.
export const rebuildListeners = []
let running = null
export function ensureSchema() {
  if (!running) {
    running = sequelize.sync()
      .then(() => { console.log('Missing database tables were recreated.'); rebuildListeners.forEach((fn) => fn()) })
      .finally(() => { running = null })
  }
  return running
}
