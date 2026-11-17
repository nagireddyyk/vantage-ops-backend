export default (sequelize, T) => sequelize.define('User', {
  email: { type: T.STRING, unique: true, allowNull: false },
  passwordHash: { type: T.STRING, allowNull: false },
  name: T.STRING,
  company: T.STRING,
  phone: T.STRING(20),
  role: { type: T.ENUM('customer', 'admin', 'superAdmin', 'sales'), defaultValue: 'customer' },
  accountStatus: { type: T.ENUM('Pending', 'Active', 'Suspended', 'Deactivated'), defaultValue: 'Active' },
}, { tableName: 'users', freezeTableName: true })
