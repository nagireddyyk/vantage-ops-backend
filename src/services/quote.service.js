import { Quote, productInclude, withCustomer, assigneeInclude } from '../models/index.js'
import { AppError } from '../utils/AppError.js'
import { getOr404, ownerScope, isAdmin } from '../utils/helpers.js'
import { priceLine } from './pricing.service.js'
import { QUOTE_STATUS } from '../constants/index.js'

const include = [...withCustomer.include, productInclude, assigneeInclude]

// Keep the stored workflow status consistent for staff, while showing the customer-facing label.
const presentForRole = (quote, user) => {
  const data = quote?.toJSON ? quote.toJSON() : { ...quote }
  if (String(user?.role || '').toLowerCase() === 'customer' && data.status === 'PO Sent') data.status = 'PO Received'
  return data
}

export const list = async (user) => (await Quote.findAll({ where: ownerScope(user), ...withCustomer, include }))
  .map((quote) => presentForRole(quote, user))

export async function get(user, id) {
  const q = await Quote.findOne({ where: { id, ...ownerScope(user) }, include })
  if (!q) throw new AppError(404, 'Quote not found')
  return presentForRole(q, user)
}
// Customer: request a quotation/estimate for a configured product (price is calculated on the server).
export async function create(user, body) {
  const l = await priceLine(body)
  const quote = await Quote.create({ customerId: user.id, quoteNumber: null, productId: l.productId, options: l.options, item: l.item, mode: l.mode,
    qty: l.qty, amount: l.amount, leaseMonths: l.leaseMonths,
    insurance: body.insurance == null || body.insurance === '' ? null : String(body.insurance).slice(0, 20),
    coverPlan: l.coverPlan,
    coverPlanPct: l.coverPlanPct,
    endOfLease: l.mode === 'lease' && body.endOfLease ? String(body.endOfLease).slice(0, 100) : null,
    note: (body.note || '').slice(0, 500), status: 'Submitted' })
  await quote.update({ quoteNumber: `VQ-${String(quote.id).padStart(4, '0')}` })
  return presentForRole(quote, user)
}
// Sales/admin may edit only records they own (admin) or have been assigned (sales).
export async function update(user, id, { amount, note, insurance, endOfLease }) {
  // Only Super Admin can change quotation pricing or the terms used in its PDF.
  if (String(user?.role || '').toLowerCase() !== 'superadmin') {
    throw new AppError(403, 'Only a Super Admin can edit quotation pricing or PDF details')
  }
  const q = await getOr404(Quote, { id, ...ownerScope(user) }, 'Quote')
  if (amount !== undefined && !(+amount > 0)) throw new AppError(400, 'amount must be > 0')
  const changes = {
    ...(amount !== undefined && { amount: +amount, status: 'PO Sent' }),
    ...(note !== undefined && { note: String(note).slice(0, 500) }),
    ...(insurance !== undefined && { insurance: insurance === null || insurance === '' ? null : String(insurance).slice(0, 20) }),
    ...(endOfLease !== undefined && { endOfLease: q.mode === 'lease' && endOfLease ? String(endOfLease).slice(0, 100) : null }),
  }
  await q.update(changes)
  return presentForRole(await q.reload({ include }), user)
}

const QUOTE_TRANSITIONS = {
  Submitted: ['Assigned'], // assignment is normally performed by the admin assignment endpoint
  Assigned: ['Contacted', 'Won', 'Lost'],
  Contacted: ['Won', 'Lost'],
  // Keep legacy transitions available for existing records until they are reassigned
  Requested: ['Under Review', 'Cancelled'],
  'Under Review': ['Quote Ready', 'Revision Requested', 'Cancelled'],
  'Quote Ready': ['Sent to Customer', 'Revision Requested', 'Cancelled'],
  Shared: ['Sent to Customer'],
  'Sent to Customer': ['Expired'],
  'Revision Requested': ['Under Review', 'Cancelled'],
}

export async function updateStatus(user, id, status, note = '') {
  const q = await getOr404(Quote, { id, ...ownerScope(user) }, 'Quote')
  if (!isAdmin(user) && q.assignedToUserId !== user.id) {
    throw new AppError(403, 'Only the assigned sales user or an administrator can update this quotation')
  }
  if (!QUOTE_STATUS.includes(status)) throw new AppError(400, `status must be one of: ${QUOTE_STATUS.join(', ')}`)

  // Compatibility for quotations assigned before the assignment endpoint began
  // persisting status='Assigned'. The lead UI derives Assigned from the assignee,
  // so the backend must do the same for those existing records.
  const effectiveCurrentStatus =
    q.status === 'Submitted' && q.assignedToUserId != null
      ? 'Assigned'
      : q.status

  if (!(QUOTE_TRANSITIONS[effectiveCurrentStatus] || []).includes(status)) {
    throw new AppError(409, `Quotation cannot move from ${effectiveCurrentStatus} to ${status}`)
  }

  const cleanNote = String(note || '').trim().slice(0, 500)
  const changes = { status }
  if (cleanNote) {
    // Preserve the customer's original note and append the sales update so the
    // existing customer quote view can display it without a separate migration.
    const previous = String(q.note || '').trim()
    const entry = `Sales note (${status}): ${cleanNote}`
    changes.note = (previous ? `${previous}\n\n${entry}` : entry).slice(-500)
  }
  if (['Won', 'Lost'].includes(status)) changes.workflowStatus = 'Closed'
  else if (status === 'Contacted') changes.workflowStatus = 'In Progress'

  await q.update(changes)
  return presentForRole(await q.reload({ include }), user)
}

// Sending is an explicit sales action; customer acceptance/rejection is handled separately.
export async function share(user, id) {
  const q = await getOr404(Quote, { id, ...ownerScope(user) }, 'Quote')
  if (!isAdmin(user) && q.assignedToUserId !== user.id) throw new AppError(403, 'Only the assigned sales user or an administrator can send this quotation')
  if (!['Quote Ready', 'Shared'].includes(q.status)) throw new AppError(409, 'Move the quotation to Quote Ready before sending it to the customer')
  return q.update({ status: 'Sent to Customer' })
}

async function respond(user, id, status) {
  const q = await getOr404(Quote, { id, ...ownerScope(user) }, 'Quote')
  if (q.status !== 'Sent to Customer' && q.status !== 'Shared') throw new AppError(409, 'Only a quotation sent to the customer can be accepted, rejected, or revised')
  return q.update({ status })
}
export const accept = (user, id) => respond(user, id, 'Accepted')
export const reject = (user, id) => respond(user, id, 'Rejected')
export const requestRevision = (user, id) => respond(user, id, 'Revision Requested')

export async function assign(id, salesUserId) {
  const { User } = await import('../models/index.js')
  const q = await getOr404(Quote, { id }, 'Quote')
  const sales = await User.findOne({ where: { id: salesUserId, role: 'sales', accountStatus: 'Active' } })
  if (!sales) throw new AppError(400, 'Select an active sales user')
  await q.update({ assignedToUserId: sales.id, workflowStatus: 'Assigned', status: 'Assigned' })
  return q.reload({ include })
}
export async function updateWorkflow(user, id, workflowStatus) {
  const q = await getOr404(Quote, { id, ...ownerScope(user) }, 'Quote')
  if (!isAdmin(user) && q.assignedToUserId !== user.id) throw new AppError(403, 'Forbidden')
  if (!['In Progress', 'Closed'].includes(workflowStatus)) throw new AppError(400, 'Sales can set workflowStatus to In Progress or Closed')
  if (q.workflowStatus === 'Pending') throw new AppError(409, 'Quote must be assigned before work starts')
  return q.update({ workflowStatus })
}
