import { QUOTE_STATUS, WORKFLOW_STATUS } from '../constants/index.js'
import { lineFields } from './lineFields.js'

export default (sequelize, T) => sequelize.define('Quote', {
  ...lineFields(T),
  quoteNumber: { type: T.STRING(32), unique: true },
  note: T.STRING(500),
  leaseMonths: T.INTEGER,
  insurance: T.STRING(20),
  // Customer-selected AMC / coverage plan saved with the quotation.
  coverPlan: { type: T.STRING(30), allowNull: false, defaultValue: 'noAmc' },
  coverPlanPct: { type: T.DOUBLE, allowNull: false, defaultValue: 0 },
  endOfLease: T.STRING(100),
  status: { type: T.STRING(50), allowNull: false, defaultValue: 'Submitted' },
  workflowStatus: { type: T.ENUM(...WORKFLOW_STATUS), allowNull: false, defaultValue: 'Pending' },
  assignedToUserId: { type: T.INTEGER, allowNull: true },
}, { tableName: 'quotes', freezeTableName: true })
