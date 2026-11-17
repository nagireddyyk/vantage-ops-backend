import { Order, PurchaseOrder, assigneeInclude, orderInclude, withCustomer } from '../models/index.js'
import { AppError } from '../utils/AppError.js'
import { getOr404, isAdmin, ownerScope } from '../utils/helpers.js'
import { LEAD_WORKFLOW, findActiveLead } from './assignment.service.js'

const include = [...withCustomer.include, orderInclude, assigneeInclude]

export const list = (user) => PurchaseOrder.findAll({ where: ownerScope(user), ...withCustomer, include })

export async function get(user, id) {
  const p = await PurchaseOrder.findOne({ where: { id, ...ownerScope(user) }, include })
  if (!p) throw new AppError(404, 'Purchase order not found')
  return p
}
export async function create(user, { orderId, number }) {
  const order = await getOr404(Order, { id: orderId, customerId: user.id }, 'Order')
  if (!number?.trim()) throw new AppError(400, 'PO number is required')
  if (await PurchaseOrder.findOne({ where: { orderId: order.id } })) throw new AppError(409, 'This order already has a purchase order')
  await order.update({ poNumber: number.trim() })
  return PurchaseOrder.create({ customerId: user.id, orderId: order.id, number: number.trim(), amount: order.amount })
}
async function decide(id, status) {
  const p = await getOr404(PurchaseOrder, { id }, 'Purchase order')
  if (p.status !== 'Submitted') throw new AppError(409, `Purchase order is already ${p.status.toLowerCase()}`)
  return p.update({ status })
}
export const approve = (id) => decide(id, 'Approved')
export const reject = (id) => decide(id, 'Rejected')

// Super admin: assign (or re-assign) a purchase order to a lead.
export async function assign(id, leadId) {
  const p = await getOr404(PurchaseOrder, { id }, 'Purchase order')
  const lead = await findActiveLead(leadId)
  await p.update({ assignedToUserId: lead.id, workflowStatus: 'Assigned' })
  return p.reload({ include })
}
// Lead (or admin): move assigned work to In Progress / Closed.
export async function updateWorkflow(user, id, workflowStatus) {
  const p = await getOr404(PurchaseOrder, { id, ...ownerScope(user) }, 'Purchase order')
  if (!isAdmin(user) && p.assignedToUserId !== user.id) throw new AppError(403, 'Forbidden')
  if (!LEAD_WORKFLOW.includes(workflowStatus)) throw new AppError(400, 'workflowStatus must be In Progress or Closed')
  if (p.workflowStatus === 'Pending') throw new AppError(409, 'Purchase order must be assigned before work starts')
  return p.update({ workflowStatus })
}
