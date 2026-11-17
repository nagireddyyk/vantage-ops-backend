import app from './app.js'
import { env } from './config/env.js'
import { sequelize } from './models/index.js'

// Create any missing tables from the Sequelize models, without deleting existing data.
// Do not use force:true or alter:true here. No seed/demo data is inserted at startup.
await sequelize.authenticate()
await sequelize.sync()
console.log('Database connected; Sequelize model tables are ready (no demo data seeded).')

app.listen(env.port, () => console.log(`API on http://localhost:${env.port}  (db: ${env.db.dialect})`))
