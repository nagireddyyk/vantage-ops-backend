import { PO_STATUS, WORKFLOW_STATUS } from '../constants/index.js'

export default (sequelize, T) => sequelize.define('PurchaseOrder', {
  number: { type: T.STRING, allowNull: false },
  amount: T.DOUBLE,
  status: { type: T.STRING(50), allowNull: false, defaultValue: 'Submitted' },
  workflowStatus: { type: T.ENUM(...WORKFLOW_STATUS), allowNull: false, defaultValue: 'Pending' },
  assignedToUserId: { type: T.INTEGER, allowNull: true },
}, { tableName: 'purchaseorders', freezeTableName: true })
