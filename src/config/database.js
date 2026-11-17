import { Sequelize } from 'sequelize'
import { env } from './env.js'

const { db } = env
export const sequelize = db.dialect === 'mysql'
  ? new Sequelize(db.name, db.user, db.password, { host: db.host, port: db.port, dialect: 'mysql', logging: false })
  : new Sequelize({ dialect: 'sqlite', storage: db.storage, logging: false })
