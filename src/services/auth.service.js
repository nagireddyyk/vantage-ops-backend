import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { User } from '../models/index.js'
import { AppError } from '../utils/AppError.js'

const issue = (u) => {
  const user = { id: u.id, email: u.email, name: u.name, company: u.company, role: u.role }
  return { token: jwt.sign(user, env.jwtSecret, { expiresIn: '8h' }), user }
}

export async function login({ email = '', password = '' }) {
  const u = await User.findOne({ where: { email: email.trim().toLowerCase() } })
  if (!u || !bcrypt.compareSync(password, u.passwordHash)) throw new AppError(401, 'Email or password is incorrect')
  if (u.accountStatus && u.accountStatus !== 'Active') throw new AppError(403, `Account is ${u.accountStatus.toLowerCase()}. Contact your administrator.`)
  return issue(u)
}

// Public sign-up. Always creates a CUSTOMER – admins are created only by seed/DB, never via this endpoint.
export async function register({ name = '', company = '', email = '', password = '', phone = '' }) {
  email = email.trim().toLowerCase()
  if (!name.trim()) throw new AppError(400, 'Name is required')
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new AppError(400, 'Enter a valid email address')
  if (password.length < 8) throw new AppError(400, 'Password must be at least 8 characters')
  if (await User.findOne({ where: { email } })) throw new AppError(409, 'An account with this email already exists')
  const u = await User.create({ email, name: name.trim(), company: company.trim() || null, phone: phone.trim() || null,
    role: 'customer', passwordHash: bcrypt.hashSync(password, 10) })
  return issue(u)
}
