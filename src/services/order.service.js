import { ORDER_STATUS } from '../constants/index.js'
import { Order, PurchaseOrder, Quote, productInclude, withCustomer, assigneeInclude } from '../models/index.js'
import { AppError } from '../utils/AppError.js'
import { getOr404, oneOf, ownerScope, isAdmin } from '../utils/helpers.js'
import { priceLine } from './pricing.service.js'

const include = [...withCustomer.include, productInclude, assigneeInclude]

export const list = (user) => Order.findAll({ where: ownerScope(user), ...withCustomer, include })

export async function get(user, id) {
  const o = await Order.findOne({ where: { id, ...ownerScope(user) }, include: [...include, { model: PurchaseOrder }] })
  if (!o) throw new AppError(404, 'Order not found')
  return o
}
// Create an order either from an ACCEPTED quote (body.quoteId) or directly from a configuration.
export async function create(user, body) {
  let line, quote = null
  if (body.quoteId) {
    quote = await getOr404(Quote, { id: body.quoteId, customerId: user.id }, 'Quote')
    if (quote.status !== 'Accepted') throw new AppError(409, 'Only accepted quotes can be ordered')
    if (await Order.findOne({ where: { quoteId: quote.id } })) throw new AppError(409, 'This quote already has an order')
    line = { productId: quote.productId, options: quote.options, item: quote.item, mode: quote.mode, qty: quote.qty, amount: quote.amount, insurance: quote.insurance, endOfLease: quote.endOfLease }
  } else line = await priceLine(body)
  const requestedLeaseMonths = quote ? quote.leaseMonths : line.leaseMonths
  const leaseMonths = requestedLeaseMonths == null || requestedLeaseMonths === '' ? null : Number(requestedLeaseMonths)
  if (line.mode === 'lease' && leaseMonths !== null && (!Number.isInteger(leaseMonths) || leaseMonths < 1 || leaseMonths > 60)) {
    throw new AppError(400, 'leaseMonths must be between 1 and 60')
  }
  const po = (body.poNumber || '').trim()
  const initialStatus = line.mode === 'buy' ? 'Placed' : 'Submitted'
  const order = await Order.create({ customerId: user.id, orderNumber: null, quoteId: quote?.id ?? null, productId: line.productId, options: line.options,
    item: line.item, mode: line.mode, qty: line.qty, amount: line.amount, poNumber: po || null, leaseMonths,
    insurance: body.insurance ?? line.insurance ?? null,
    coverPlan: quote ? quote.coverPlan : line.coverPlan,
    coverPlanPct: quote ? quote.coverPlanPct : line.coverPlanPct,
    endOfLease: line.mode === 'lease' ? (body.endOfLease ?? line.endOfLease ?? null) : null, status: initialStatus, paymentMode: body.paymentMode === 'RecurringGateway' ? 'RecurringGateway' : 'OfflineInvoice' })
  await order.update({ orderNumber: `VO-${String(order.id).padStart(4, '0')}` })
  if (po) await PurchaseOrder.create({ customerId: user.id, orderId: order.id, number: po, amount: order.amount })
  return order
}
const ORDER_TRANSITIONS = {
  buy: {
    Placed: ['Confirmed', 'Cancelled'], Confirmed: ['Dispatched', 'Cancelled'], Dispatched: ['Delivered'],
  },
  lease: {
    Submitted: ['Under Review', 'Cancelled'], 'Under Review': ['Pending Approval', 'Rejected', 'Cancelled'],
    'Pending Approval': ['Lease Offer Sent', 'Rejected', 'Cancelled'], 'Lease Offer Sent': ['Awaiting Customer Acceptance', 'Cancelled'],
    'Awaiting Customer Acceptance': ['Approved', 'Rejected', 'Cancelled'], Approved: ['Agreement Completed'],
    'Agreement Completed': ['Fulfilment'], Fulfilment: ['Active'], Active: ['Expired', 'Terminated'],
  },
  rent: {
    Submitted: ['Under Review', 'Cancelled'], 'Under Review': ['Availability Confirmed', 'Rejected', 'Cancelled'],
    'Availability Confirmed': ['Rental Quote Sent', 'Cancelled'], 'Rental Quote Sent': ['Awaiting Customer Acceptance', 'Cancelled'],
    'Awaiting Customer Acceptance': ['Booking Confirmed', 'Rejected', 'Cancelled'], 'Booking Confirmed': ['Ready for Dispatch', 'Cancelled'],
    'Ready for Dispatch': ['Delivered'], Delivered: ['Active'], Active: ['Return Requested', 'Expired'],
    'Return Requested': ['Returned'], Returned: ['Closed'],
  },
}

// Only administrators or the assigned sales user can move the business workflow forward.
export async function updateStatus(user, id, status) {
  const o = await getOr404(Order, { id, ...ownerScope(user) }, 'Order')
  if (!isAdmin(user) && o.assignedToUserId !== user.id) throw new AppError(403, 'Only the assigned sales user or an administrator can update order status')
  if (!ORDER_STATUS.includes(status)) throw new AppError(400, `status must be one of: ${ORDER_STATUS.join(', ')}`)
  const mode = String(o.mode || 'buy').toLowerCase()
  const allowed = ORDER_TRANSITIONS[mode]?.[o.status] || []
  if (!allowed.includes(status)) throw new AppError(409, `A ${mode} order cannot move from ${o.status} to ${status}`)
  return o.update({ status })
}

// Customers can only respond to a sent lease/rental offer; they cannot set fulfilment statuses.
export async function respondToOffer(user, id, decision) {
  const o = await getOr404(Order, { id, ...ownerScope(user) }, 'Order')
  if (!['rent', 'lease'].includes(String(o.mode).toLowerCase())) throw new AppError(400, 'Customer offer responses apply only to lease or rental orders')
  if (o.status !== 'Awaiting Customer Acceptance') throw new AppError(409, 'The sales team must send the offer and mark it as awaiting customer acceptance first')
  if (decision === 'accept') return o.update({ status: o.mode === 'rent' ? 'Booking Confirmed' : 'Approved' })
  if (decision === 'reject') return o.update({ status: 'Rejected' })
  throw new AppError(400, 'decision must be accept or reject')
}
// Customer: cancel an order that has not been confirmed yet.
export async function cancel(user, id) {
  const o = await getOr404(Order, { id, ...ownerScope(user) }, 'Order')
  const cancellable = o.mode === 'buy' ? ['Placed'] : ['Submitted', 'Under Review', 'Lease Offer Sent', 'Rental Quote Sent']
  if (!cancellable.includes(o.status)) throw new AppError(409, `A ${o.mode} order cannot be cancelled at status ${o.status}`)
  return o.update({ status: 'Cancelled' })
}

export async function assign(id, salesUserId) {
  const { User } = await import('../models/index.js')
  const o = await getOr404(Order, { id }, 'Order')
  const sales = await User.findOne({ where: { id: salesUserId, role: 'sales', accountStatus: 'Active' } })
  if (!sales) throw new AppError(400, 'Select an active sales user')
  await o.update({ assignedToUserId: sales.id, workflowStatus: 'Assigned' })
  return o.reload({ include })
}
export async function updateWorkflow(user, id, workflowStatus) {
  const o = await getOr404(Order, { id, ...ownerScope(user) }, 'Order')
  if (!isAdmin(user) && o.assignedToUserId !== user.id) throw new AppError(403, 'Forbidden')
  if (!['In Progress', 'Closed'].includes(workflowStatus)) throw new AppError(400, 'Sales can set workflowStatus to In Progress or Closed')
  if (o.workflowStatus === 'Pending') throw new AppError(409, 'Order must be assigned before work starts')
  return o.update({ workflowStatus })
}
