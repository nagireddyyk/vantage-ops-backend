import { AppError } from './AppError.js'

export const oneOf = (value, list, name) => {
  if (!list.includes(value)) throw new AppError(400, `${name} must be one of: ${list.join(', ')}`)
  return value
}
// Super admins/admins see all records, sales users see only assigned work, customers see their own.
export const isAdmin = (user) => ['admin', 'superAdmin'].includes(user?.role)
export const isSuperAdmin = (user) => ['admin', 'superAdmin'].includes(user?.role)
export const ownerScope = (user) => {
  if (isAdmin(user)) return {}
  if (user.role === 'sales') return { assignedToUserId: user.id }
  return { customerId: user.id }
}
export const getOr404 = async (Model, where, label = 'Record') => {
  const row = await Model.findOne({ where })
  if (!row) throw new AppError(404, `${label} not found`)
  return row
}
