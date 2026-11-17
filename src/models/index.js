import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'
import userModel from './user.model.js'
import productModel from './product.model.js'
import quoteModel from './quote.model.js'
import orderModel from './order.model.js'
import purchaseOrderModel from './purchaseOrder.model.js'
import ticketModel from './ticket.model.js'
import auditLogModel from './auditLog.model.js'
import leadModel from './lead.model.js'

export const User = userModel(sequelize, DataTypes)
export const Product = productModel(sequelize, DataTypes)
export const Quote = quoteModel(sequelize, DataTypes)
export const Order = orderModel(sequelize, DataTypes)
export const PurchaseOrder = purchaseOrderModel(sequelize, DataTypes)
export const Ticket = ticketModel(sequelize, DataTypes)
export const AuditLog = auditLogModel(sequelize, DataTypes)
export const Lead = leadModel(sequelize, DataTypes)

// ---- Relationships (foreign keys) ----
// User 1—* Quote / Order / PurchaseOrder / Ticket  (customerId)
for (const M of [Quote, Order, PurchaseOrder, Ticket]) {
  User.hasMany(M, { foreignKey: 'customerId' })
  M.belongsTo(User, { as: 'customer', foreignKey: 'customerId' })
}
// Leads can be submitted by a signed-in customer or anonymously from the requirement questionnaire.
User.hasMany(Lead, { foreignKey: 'customerId' })
Lead.belongsTo(User, { as: 'customer', foreignKey: 'customerId' })
// Super admin assigns each of these to a lead (a user with role 'sales').
// (Ticket already has a text column called `assignee`, so its association is named `assignedLead`.)
for (const M of [Lead, Quote, Order, PurchaseOrder]) {
  M.belongsTo(User, { as: 'assignee', foreignKey: 'assignedToUserId' })
  User.hasMany(M, { as: 'assigned' + M.name + 's', foreignKey: 'assignedToUserId' })
}
// Product 1—* Quote, Product 1—* Order  (productId)
for (const M of [Quote, Order]) {
  Product.hasMany(M, { foreignKey: 'productId' })
  M.belongsTo(Product, { foreignKey: 'productId' })
}
// Quote 1—0..1 Order  (an accepted quote becomes an order: Order.quoteId)
Quote.hasOne(Order, { foreignKey: 'quoteId' })
Order.belongsTo(Quote, { foreignKey: 'quoteId' })
// Order 1—0..1 PurchaseOrder  (PurchaseOrder.orderId)
Order.hasOne(PurchaseOrder, { foreignKey: 'orderId' })
PurchaseOrder.belongsTo(Order, { foreignKey: 'orderId' })
// Order 1—* Ticket  (optional Ticket.orderId: which purchased/rented hardware the AMC ticket is about)
Order.hasMany(Ticket, { foreignKey: 'orderId' })
Ticket.belongsTo(Order, { foreignKey: 'orderId' })

// Reusable query options: newest first, with customer details.
export const withCustomer = {
  include: [{ model: User, as: 'customer', attributes: ['id', 'email', 'name'] }],
  order: [['id', 'DESC']],
}
Ticket.belongsTo(User, { as: 'assignedLead', foreignKey: 'assignedToUserId' })
User.hasMany(Ticket, { as: 'assignedTickets', foreignKey: 'assignedToUserId' })
export const ticketAssigneeInclude = { model: User, as: 'assignedLead', attributes: ['id', 'name', 'email'], required: false }
export const assigneeInclude = { model: User, as: 'assignee', attributes: ['id', 'name', 'email'], required: false }
export const productInclude = { model: Product, attributes: ['id', 'name', 'category'], paranoid: false }
export const orderInclude = { model: Order, attributes: ['id', 'item'] }
export { sequelize }
