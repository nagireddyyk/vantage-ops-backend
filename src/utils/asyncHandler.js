import { ensureSchema, isMissingTable } from '../db/selfHeal.js'

// Wraps a route handler. If it fails because a table was dropped from the database while the
// server was running, the missing tables are recreated (empty) and the request is retried once,
// so the app shows empty lists instead of an error.
export const asyncHandler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next)
  } catch (err) {
    if (isMissingTable(err) && !req._schemaRetried) {
      req._schemaRetried = true
      try {
        await ensureSchema()
        await fn(req, res, next)
        return
      } catch (retryError) {
        return next(retryError)
      }
    }
    next(err)
  }
}
