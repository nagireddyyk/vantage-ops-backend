import { Op, fn } from 'sequelize'
import { Lead, Order, Product, PurchaseOrder, Quote, Ticket, User } from '../models/index.js'
import { AppError } from '../utils/AppError.js'

export async function summary() {
  return {
    products: await Product.count(),
    customers: await User.count({ where: { role: 'customer' } }),
    quotesToReview: await Quote.count({ where: { status: ['Submitted', 'Pending Approval'] } }),
    activeOrders: await Order.count({ where: { status: ['Placed', 'Confirmed', 'Dispatched'] } }),
    pendingPurchaseOrders: await PurchaseOrder.count({ where: { status: 'Submitted' } }),
    openTickets: await Ticket.count({ where: { status: { [Op.notIn]: ['Resolved', 'Closed'] } } }),
    unassigned: {
      quotes: await Quote.count({ where: { assignedToUserId: null, status: 'Submitted' } }),
      purchaseOrders: await PurchaseOrder.count({ where: { assignedToUserId: null, status: 'Submitted' } }),
      tickets: await Ticket.count({ where: { assignedToUserId: null, status: 'Open' } }),
    },
  }
}
const countBy = async (Model) => Object.fromEntries(
  (await Model.findAll({ attributes: ['customerId', [fn('COUNT', '*'), 'n']], group: ['customerId'], raw: true })).map((r) => [r.customerId, +r.n]))

// Customer list with how many quotes / orders / tickets each has.
export async function customers() {
  const [users, q, o, t] = await Promise.all([
    User.findAll({ where: { role: 'customer' }, attributes: ['id', 'email', 'name', 'company', 'phone', 'accountStatus', 'createdAt'], order: [['id', 'DESC']] }),
    countBy(Quote), countBy(Order), countBy(Ticket)])
  return users.map((u) => ({ ...u.toJSON(), quotes: q[u.id] || 0, orders: o[u.id] || 0, tickets: t[u.id] || 0 }))
}
export async function customerDetail(id) {
  const user = await User.findOne({ where: { id, role: 'customer' }, attributes: ['id', 'email', 'name', 'company', 'phone', 'accountStatus', 'createdAt'] })
  if (!user) throw new AppError(404, 'Customer not found')
  const where = { customerId: id }, order = [['id', 'DESC']]
  const [quotes, orders, purchaseOrders, tickets] = await Promise.all([
    Quote.findAll({ where, order }), Order.findAll({ where, order }), PurchaseOrder.findAll({ where, order }), Ticket.findAll({ where, order })])
  return { user, quotes, orders, purchaseOrders, tickets }
}


export async function updateCustomerStatus(id, accountStatus) {
  const allowed = ['Pending', 'Active', 'Suspended', 'Deactivated']
  if (!allowed.includes(accountStatus)) throw new AppError(400, 'Invalid accountStatus')
  const user = await User.findOne({ where: { id, role: 'customer' } })
  if (!user) throw new AppError(404, 'Customer not found')
  await user.update({ accountStatus })
  return { id: user.id, accountStatus: user.accountStatus }
}

export async function salesUsers() {
  return User.findAll({
    where: { role: 'sales', accountStatus: 'Active' },
    attributes: ['id', 'name', 'email', 'company'],
    order: [['name', 'ASC']],
  })
}

export async function salesPerformance() {
  const sales = await User.findAll({
    where: { role: 'sales' },
    attributes: ['id', 'name', 'email', 'accountStatus'],
    order: [['name', 'ASC']],
  })

  // Performance stages represent progress on assigned work, not the business
  // status vocabulary. Derive the stage from BOTH fields so changes such as
  // Quote Ready, Sent to Customer, Resolved, Dispatched, etc. are reflected.
  const terminal = new Set([
    'Accepted', 'Approved', 'Agreement Completed', 'Fulfilment', 'Active', 'Returned',
    'Resolved', 'Closed', 'Rejected', 'Cancelled', 'Expired', 'Terminated', 'Won',
  ])
  const progressed = new Set([
    'Under Review', 'Quote Ready', 'Sent to Customer', 'Revision Requested',
    'Pending Approval', 'Lease Offer Sent', 'Rental Offer Sent', 'Awaiting Customer Acceptance',
    'Availability Confirmed', 'Rental Quote Sent', 'Booking Confirmed', 'Ready for Dispatch',
    'Delivered', 'Return Requested', 'Open', 'Assigned', 'In Progress', 'Waiting on Customer',
    'Waiting for Customer', 'Waiting for Parts', 'Reopened', 'Confirmed', 'Processing',
    'Dispatched', 'In Transit', 'Placed',
  ])
  const stageOf = (row) => {
    if (row.workflowStatus === 'Closed' || terminal.has(row.status)) return 'Closed'
    if (row.workflowStatus === 'In Progress' || progressed.has(row.status)) return 'In Progress'
    return 'Assigned' // includes unstarted workflowStatus Pending/Assigned
  }
  const countStages = (rows) => {
    const counts = { Assigned: 0, 'In Progress': 0, Closed: 0 }
    for (const row of rows) counts[stageOf(row)] += 1
    return counts
  }
  return Promise.all(sales.map(async (person) => {
    const [leads, quotes, orders, purchaseOrders, tickets] = await Promise.all([
      Lead.findAll({ where: { assignedToUserId: person.id }, attributes: ['workflowStatus'], raw: true }),
      Quote.findAll({ where: { assignedToUserId: person.id }, attributes: ['workflowStatus', 'status'], raw: true }),
      Order.findAll({ where: { assignedToUserId: person.id }, attributes: ['workflowStatus', 'status'], raw: true }),
      PurchaseOrder.findAll({ where: { assignedToUserId: person.id }, attributes: ['workflowStatus', 'status'], raw: true }),
      Ticket.findAll({ where: { assignedToUserId: person.id }, attributes: ['workflowStatus', 'status'], raw: true }),
    ])
    const all = [...leads, ...quotes, ...orders, ...purchaseOrders, ...tickets]
    const counts = countStages(all)
    return {
      ...person.toJSON(), counts,
      totalAssignedWork: all.length,
      byType: {
        leads: countStages(leads), quotations: countStages(quotes), orders: countStages(orders),
        purchaseOrders: countStages(purchaseOrders), tickets: countStages(tickets),
      },
    }
  }))
}
