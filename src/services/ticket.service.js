import { PRIORITIES, TICKET_STATUS } from '../constants/index.js'
import { Order, Ticket, orderInclude, ticketAssigneeInclude, withCustomer } from '../models/index.js'
import { AppError } from '../utils/AppError.js'
import { getOr404, isAdmin, oneOf, ownerScope } from '../utils/helpers.js'
import { LEAD_WORKFLOW, findActiveLead, leadName } from './assignment.service.js'

const include = [...withCustomer.include, orderInclude, ticketAssigneeInclude]

export const list = (user) => Ticket.findAll({ where: ownerScope(user), ...withCustomer, include })

export async function create(user, { subject, description = '', asset, priority = 'Medium', orderId, attachments = [], amcContractId }) {
  if (!subject?.trim() || !asset?.trim()) throw new AppError(400, 'subject and asset are required')
  if (!Array.isArray(attachments) || attachments.length > 5) throw new AppError(400, 'Attach up to 5 files')
  if (attachments.some((x) => typeof x !== 'string' || x.length > 500000)) throw new AppError(400, 'Each attachment must be a small data URL or storage URL')
  if (description.length > 4000) throw new AppError(400, 'Description must be under 4000 characters')
  if (orderId) await getOr404(Order, { id: orderId, customerId: user.id }, 'Order') // optional link to an order
  return Ticket.create({ customerId: user.id, orderId: orderId || null, subject: subject.trim(), description: description.trim(), attachments, updates: [], amcContractId: amcContractId || null, asset: asset.trim(), priority: oneOf(priority, PRIORITIES, 'priority') })
}
export async function get(user, id) {
  const t = await Ticket.findOne({ where: { id, ...ownerScope(user) }, include })
  if (!t) throw new AppError(404, 'Ticket not found')
  return t
}
// Super admin: assign (or re-assign) a ticket to a lead.
export async function assign(user, id, leadId) {
  const t = await getOr404(Ticket, { id }, 'Ticket')
  const lead = await findActiveLead(leadId)
  const name = leadName(lead)
  await t.update({
    assignedToUserId: lead.id, assignee: name, workflowStatus: 'Assigned',
    ...(t.status === 'Open' && { status: 'Assigned' }),
    updates: [...(t.updates || []), { message: `Assigned to ${name}`, at: new Date().toISOString(), by: 'admin', system: true }],
  })
  return t.reload({ include })
}
// Super admin, or the lead the ticket is assigned to: update status / priority / add a note.
export async function update(user, id, { status, update: message, priority }) {
  const t = await getOr404(Ticket, { id, ...ownerScope(user) }, 'Ticket')
  if (!isAdmin(user) && t.assignedToUserId !== user.id) throw new AppError(403, 'Forbidden')
  const changes = {}
  if (status) {
    // Accept the legacy spelling 'Waiting on Customer' from older records/clients.
    const norm = (v) => (v === 'Waiting on Customer' ? 'Waiting for Customer' : v)
    const next = oneOf(norm(status), TICKET_STATUS, 'status')
    const current = norm(t.status)
    const transitions = {
      Open: ['Assigned', 'In Progress'], Assigned: ['In Progress', 'Waiting for Customer', 'Waiting for Parts', 'Resolved'],
      'In Progress': ['Waiting for Customer', 'Waiting for Parts', 'Resolved'],
      'Waiting for Customer': ['In Progress', 'Resolved'], 'Waiting for Parts': ['In Progress', 'Resolved'],
      Resolved: ['Closed', 'Reopened'], Closed: ['Reopened'], Reopened: ['Assigned', 'In Progress'],
    }
    if (!(transitions[current] || []).includes(next)) throw new AppError(409, `Ticket cannot move from ${t.status} to ${next}`)
    changes.status = next
    if (next === 'Resolved' || next === 'Closed') changes.workflowStatus = 'Closed'
    else if (['In Progress', 'Waiting for Customer', 'Waiting for Parts', 'Reopened'].includes(next)) changes.workflowStatus = 'In Progress'
  }
  if (priority) changes.priority = oneOf(priority, PRIORITIES, 'priority')
  if (message !== undefined) {
    if (!String(message).trim()) throw new AppError(400, 'Update message cannot be empty')
    changes.updates = [...(t.updates || []), { message: String(message).trim().slice(0, 2000), at: new Date().toISOString(), by: isAdmin(user) ? 'admin' : 'lead', name: user.name || user.email }]
  }
  return t.update(changes)
}
// Customers can add a note to their own ticket, confirm resolution, or reopen a resolved/closed issue.
export async function customerUpdate(user, id, { update: message, status }) {
  const t = await getOr404(Ticket, { id, customerId: user.id }, 'Ticket')
  const changes = {}
  if (message !== undefined) {
    if (!String(message).trim()) throw new AppError(400, 'Update message cannot be empty')
    changes.updates = [...(t.updates || []), { message: String(message).trim().slice(0, 2000), at: new Date().toISOString(), by: 'customer', name: user.name || user.email }]
  }
  if (status !== undefined) {
    if (status === 'Closed' && t.status === 'Resolved') {
      changes.status = 'Closed'; changes.workflowStatus = 'Closed'
    } else if (status === 'Reopened' && ['Resolved', 'Closed'].includes(t.status)) {
      changes.status = 'Reopened'; changes.workflowStatus = 'In Progress'
    } else {
      throw new AppError(409, 'Customers may only confirm a resolved ticket as Closed or reopen a resolved/closed ticket')
    }
  }
  if (!Object.keys(changes).length) throw new AppError(400, 'Provide an update message or an allowed customer status')
  return t.update(changes)
}

// Lead (or admin): move assigned work to In Progress / Closed. Closing resolves the ticket.
export async function updateWorkflow(user, id, workflowStatus) {
  const t = await getOr404(Ticket, { id, ...ownerScope(user) }, 'Ticket')
  if (!isAdmin(user) && t.assignedToUserId !== user.id) throw new AppError(403, 'Forbidden')
  if (!LEAD_WORKFLOW.includes(workflowStatus)) throw new AppError(400, 'workflowStatus must be In Progress or Closed')
  if (t.workflowStatus === 'Pending') throw new AppError(409, 'Ticket must be assigned before work starts')
  return t.update({ workflowStatus, ...(workflowStatus === 'Closed' && { status: 'Resolved' }) })
}
