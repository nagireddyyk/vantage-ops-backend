export default (sequelize, T) => sequelize.define('AuditLog', {
  actorUserId: T.INTEGER,
  action: { type: T.STRING(100), allowNull: false },
  entityType: { type: T.STRING(80), allowNull: false },
  entityId: T.STRING(100),
  details: T.JSON,
}, { tableName: 'audit_logs', freezeTableName: true, updatedAt: false })
