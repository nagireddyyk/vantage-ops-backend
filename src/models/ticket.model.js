import { PRIORITIES, TICKET_STATUS, WORKFLOW_STATUS } from '../constants/index.js'

export default (sequelize, T) => sequelize.define('Ticket', {
  subject: { type: T.STRING, allowNull: false },
  asset: T.STRING,
  priority: { type: T.ENUM(...PRIORITIES), defaultValue: 'Medium' },
  status: { type: T.STRING(50), allowNull: false, defaultValue: 'Open' },
  assignee: T.STRING,
  description: T.TEXT,
  attachments: { type: T.JSON, defaultValue: [] },
  updates: { type: T.JSON, defaultValue: [] },
  amcContractId: T.INTEGER,
  workflowStatus: { type: T.ENUM(...WORKFLOW_STATUS), allowNull: false, defaultValue: 'Pending' },
  assignedToUserId: { type: T.INTEGER, allowNull: true },
}, { tableName: 'tickets', freezeTableName: true })
