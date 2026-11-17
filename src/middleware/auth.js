import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { ensureSchema, isMissingTable, rebuildListeners } from '../db/selfHeal.js'
import { User } from '../models/index.js'
import { AppError } from '../utils/AppError.js'

// Users seen recently, so we do not query the database on every request.
const seen = new Map()
const TTL_MS = 10000
rebuildListeners.push(() => seen.clear()) // tables were recreated: users may be gone

// A token is only valid while its user still exists. If the users table or the user was deleted
// from the database, the app signs the person out instead of failing with database errors.
async function userExists(id) {
  const at = seen.get(id)
  if (at && Date.now() - at < TTL_MS) return true
  const find = () => User.findByPk(id, { attributes: ['id'] })
  let user
  try { user = await find() } catch (err) {
    if (!isMissingTable(err)) throw err
    await ensureSchema()
    user = await find()
  }
  if (user) { if (seen.size > 5000) seen.clear(); seen.set(id, Date.now()) } else seen.delete(id)
  return Boolean(user)
}

// Local JWT check. In AWS, replace with Amazon Cognito token verification.
export const authenticate = async (req, res, next) => {
  let payload
  try {
    payload = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), env.jwtSecret)
  } catch { return next(new AppError(401, 'Unauthorized')) }
  try {
    if (!payload.id || !(await userExists(payload.id))) return next(new AppError(401, 'Your session has expired. Please sign in again.'))
    req.user = payload
    next()
  } catch (err) { next(err) }
}
export const authorize = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : next(new AppError(403, 'Forbidden'))
