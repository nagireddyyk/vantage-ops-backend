import bcrypt from 'bcryptjs'
import { User } from '../models/index.js'
import { AppError } from '../utils/AppError.js'

const fields = ['id', 'name', 'email', 'phone', 'role', 'accountStatus', 'createdAt', 'updatedAt']
const cleanEmail = (v) => String(v || '').trim().toLowerCase()
function validate(body, creating = false) {
  const name = String(body.name ?? '').trim()
  const email = cleanEmail(body.email)
  const phone = String(body.phone ?? '').trim()
  if ((creating || body.name !== undefined) && !name) throw new AppError(400, 'Name is required')
  if ((creating || body.email !== undefined) && !/^\S+@\S+\.\S+$/.test(email)) throw new AppError(400, 'A valid email is required')
  if ((creating || body.phone !== undefined) && !/^\+?[0-9 ()-]{7,20}$/.test(phone)) throw new AppError(400, 'Enter a valid mobile number (7–20 characters)')
  if (creating && String(body.password || '').length < 8) throw new AppError(400, 'Temporary password must be at least 8 characters')
  return { name, email, phone }
}
export async function list() {
  return User.findAll({ where: { role: 'sales' }, attributes: fields, order: [['name', 'ASC']] })
}
export async function create(body) {
  const data = validate(body, true)
  if (await User.findOne({ where: { email: data.email } })) throw new AppError(409, 'An account with this email already exists')
  const user = await User.create({ ...data, role: 'sales', accountStatus: 'Active', passwordHash: bcrypt.hashSync(String(body.password), 10) })
  return User.findByPk(user.id, { attributes: fields })
}
export async function update(id, body) {
  const user = await User.findOne({ where: { id, role: 'sales' } })
  if (!user) throw new AppError(404, 'Sales person not found')
  const data = {}
  if (body.name !== undefined || body.email !== undefined || body.phone !== undefined) Object.assign(data, validate({ name: body.name ?? user.name, email: body.email ?? user.email, phone: body.phone ?? user.phone }))
  if (data.email && data.email !== user.email && await User.findOne({ where: { email: data.email } })) throw new AppError(409, 'An account with this email already exists')
  if (body.accountStatus !== undefined) {
    if (!['Active', 'Suspended', 'Deactivated'].includes(body.accountStatus)) throw new AppError(400, 'Invalid account status')
    data.accountStatus = body.accountStatus
  }
  if (body.password !== undefined && body.password !== '') {
    if (String(body.password).length < 8) throw new AppError(400, 'Temporary password must be at least 8 characters')
    data.passwordHash = bcrypt.hashSync(String(body.password), 10)
  }
  await user.update(data)
  return User.findByPk(user.id, { attributes: fields })
}
export async function remove(id) {
  const user = await User.findOne({ where: { id, role: 'sales' } })
  if (!user) throw new AppError(404, 'Sales person not found')
  await user.update({ accountStatus: 'Deactivated' })
  return { message: 'Sales person deactivated' }
}
