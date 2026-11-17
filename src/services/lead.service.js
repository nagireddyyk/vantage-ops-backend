import { Lead, User } from '../models/index.js'
import { AppError } from '../utils/AppError.js'
import { ownerScope, isAdmin } from '../utils/helpers.js'
import { contentKey, isSameEnquiry, withLock } from '../utils/leadDedupe.js'

const leadInclude = [
  { model: User, as: 'customer', attributes: ['id', 'name', 'email'], required: false },
  { model: User, as: 'assignee', attributes: ['id', 'name', 'email'], required: false },
]
const requiredFields = ['need', 'quantity', 'useCase', 'mode', 'budget']

export async function create(body, user = null, source = 'website') {
  // Public Contact Us enquiries are stored in the same lead pipeline. Map their
  // contact-topic fields to the existing required lead columns for DB compatibility.
  if (source === 'contact-us') {
    body = { ...body, need: body.topic || 'General enquiry', quantity: '1', useCase: 'Contact enquiry',
      mode: /rent/i.test(body.topic || '') ? 'Rent' : /leas/i.test(body.topic || '') ? 'Lease' : 'Buy',
      budget: 'Not specified', additionalRequirements: `Contact Us message: ${String(body.message || '').slice(0, 1800)}` }
  }
  for (const key of requiredFields) {
    if (!String(body[key] ?? '').trim()) throw new AppError(400, `${key} is required`)
  }
  if (!['Buy', 'Lease', 'Rent'].includes(body.mode)) throw new AppError(400, 'mode must be Buy, Lease or Rent')
  if (!String(body.contactName || body.name || user?.name || '').trim()) throw new AppError(400, 'Name is required')
  const contactEmail = String(body.email || user?.email || '').trim()
  if (!contactEmail) throw new AppError(400, 'Email address is required')
  if (!/^\S+@\S+\.\S+$/.test(contactEmail)) throw new AppError(400, 'Enter a valid email address')
  const data = {
    source,
    need: String(body.need).slice(0, 100),
    quantity: String(body.quantity).slice(0, 30),
    useCase: String(body.useCase).slice(0, 100),
    mode: body.mode,
    budget: String(body.budget).slice(0, 40),
    requiredBy: body.requiredBy || null,
    supportRequired: Boolean(body.supportRequired),
    additionalRequirements: String(body.additionalRequirements || '').slice(0, 2000) || null,
    contactName: String(body.contactName || body.name || user?.name || '').slice(0, 150) || null,
    company: String(body.company || user?.company || '').slice(0, 255) || null,
    email: String(body.email || user?.email || '').trim().toLowerCase().slice(0, 255) || null,
    phone: String(body.phone || user?.phone || '').slice(0, 30) || null,
    customerId: user?.id || null,
    workflowStatus: 'Pending',
  }

  // Public Contact Us and WhatsApp: prevent duplicates by email OR phone only.
  // Questions/answers are intentionally ignored for duplicate detection.
  const normalizeEmail = (value) => String(value || '').trim().toLowerCase()
  const normalizePhone = (value) => {
    let digits = String(value || '').replace(/\\D/g, '')
    if (digits.startsWith('00')) digits = digits.slice(2)
    if (digits.startsWith('91') && digits.length === 12) digits = digits.slice(2)
    if (digits.startsWith('0') && digits.length === 11) digits = digits.slice(1)
    return digits
  }

  const email = normalizeEmail(data.email)
  const phone = normalizePhone(data.phone)
  const isPublicEnquiry = source === 'contact-us' || source === 'website-whatsapp'

  if (isPublicEnquiry && (email || phone)) {
    const identity = email || phone
    return withLock(`public-enquiry:${identity}`, async () => {
      const candidates = await Lead.findAll({
        where: { source: ['contact-us', 'website-whatsapp'] },
        attributes: ['id', 'email', 'phone'],
        order: [['createdAt', 'ASC']],
        limit: 10000,
      })

      const duplicate = candidates.find((candidate) => {
        const candidateEmail = normalizeEmail(candidate.email)
        const candidatePhone = normalizePhone(candidate.phone)
        return Boolean(
          (email && candidateEmail && email === candidateEmail) ||
          (phone && candidatePhone && (
            phone === candidatePhone ||
            (phone.length >= 10 && candidatePhone.length >= 10 &&
              phone.slice(-10) === candidatePhone.slice(-10))
          ))
        )
      })

      if (duplicate) {
        const existing = await Lead.findByPk(duplicate.id, { include: leadInclude })
        return { ...existing.toJSON(), duplicate: true }
      }

      const row = await Lead.create(data)
      return { ...(await row.reload({ include: leadInclude })).toJSON(), duplicate: false }
    })
  }

  // Preserve the existing behavior for authenticated/internal leads.
  return withLock(contentKey(data), async () => {
    const candidates = await Lead.findAll({
      where: { need: data.need, mode: data.mode },
      order: [['createdAt', 'ASC']],
      limit: 500,
    })
    const existing = candidates.find((candidate) => isSameEnquiry(candidate, data))
    if (existing) {
      return { ...(await existing.reload({ include: leadInclude })).toJSON(), duplicate: true }
    }
    const row = await Lead.create(data)
    return { ...(await row.reload({ include: leadInclude })).toJSON(), duplicate: false }
  })
}
export async function list(user) {
  return Lead.findAll({ where: ownerScope(user), include: leadInclude, order: [['createdAt', 'DESC']] })
}
export async function assign(id, salesUserId) {
  const lead = await Lead.findByPk(id)
  if (!lead) throw new AppError(404, 'Lead not found')
  const sales = await User.findOne({ where: { id: salesUserId, role: 'sales', accountStatus: 'Active' } })
  if (!sales) throw new AppError(400, 'Select an active sales user')
  await lead.update({ assignedToUserId: sales.id, workflowStatus: 'Assigned' })
  return lead.reload({ include: leadInclude })
}
export async function updateWorkflow(user, id, workflowStatus) {
  const lead = await Lead.findOne({ where: { id, ...ownerScope(user) } })
  if (!lead) throw new AppError(404, 'Lead not found')
  if (!isAdmin(user) && lead.assignedToUserId !== user.id) throw new AppError(403, 'Forbidden')
  if (!['In Progress', 'Closed'].includes(workflowStatus)) throw new AppError(400, 'Sales can set workflowStatus to In Progress or Closed')
  if (lead.workflowStatus === 'Pending') throw new AppError(409, 'Lead must be assigned before work starts')
  await lead.update({ workflowStatus })
  return lead.reload({ include: leadInclude })
}
