import { WORKFLOW_STATUS } from '../constants/index.js'

export default (sequelize, T) => sequelize.define('Lead', {
  source: { type: T.STRING(40), allowNull: false, defaultValue: 'website' },
  need: { type: T.STRING(100), allowNull: false },
  quantity: { type: T.STRING(30), allowNull: false },
  useCase: { type: T.STRING(100), allowNull: false },
  mode: { type: T.ENUM('Buy', 'Lease', 'Rent'), allowNull: false },
  budget: { type: T.STRING(40), allowNull: false },
  requiredBy: { type: T.DATEONLY, allowNull: true },
  supportRequired: { type: T.BOOLEAN, allowNull: false, defaultValue: false },
  additionalRequirements: { type: T.TEXT, allowNull: true },
  contactName: { type: T.STRING(150), allowNull: true },
  company: { type: T.STRING(255), allowNull: true },
  email: { type: T.STRING(255), allowNull: true },
  phone: { type: T.STRING(30), allowNull: true },
  workflowStatus: { type: T.ENUM(...WORKFLOW_STATUS), allowNull: false, defaultValue: 'Pending' },
  assignedToUserId: { type: T.INTEGER, allowNull: true },
  customerId: { type: T.INTEGER, allowNull: true },
}, { tableName: 'leads', freezeTableName: true })
