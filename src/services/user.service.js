import bcrypt from 'bcryptjs'
import { User } from '../models/index.js'
import { AppError } from '../utils/AppError.js'

const FIELDS = ['id', 'email', 'name', 'company', 'phone', 'role', 'createdAt']

export async function getProfile(id) {
  const u = await User.findByPk(id, { attributes: FIELDS })
  if (!u) throw new AppError(404, 'User not found')
  return u
}
export async function updateProfile(id, { name, company, phone }) {
  const u = await User.findByPk(id)
  if (!u) throw new AppError(404, 'User not found')
  if (name !== undefined && !String(name).trim()) throw new AppError(400, 'Name cannot be empty')
  await u.update({
    ...(name !== undefined && { name: String(name).trim() }),
    ...(company !== undefined && { company: String(company).trim() || null }),
    ...(phone !== undefined && { phone: String(phone).trim() || null }),
  })
  return getProfile(id)
}
export async function changePassword(id, { currentPassword = '', newPassword = '' }) {
  const u = await User.findByPk(id)
  if (!u || !bcrypt.compareSync(currentPassword, u.passwordHash)) throw new AppError(400, 'Current password is incorrect')
  if (newPassword.length < 8) throw new AppError(400, 'New password must be at least 8 characters')
  await u.update({ passwordHash: bcrypt.hashSync(newPassword, 10) })
  return { message: 'Password updated' }
}
