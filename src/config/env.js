import 'dotenv/config'

const e = process.env

console.log('Database configuration:', {
  dialect: e.DB_DIALECT,
  host: e.DB_HOST,
  port: e.DB_PORT,
})

export const env = {
  port: +e.PORT || 4000,
  jwtSecret: e.JWT_SECRET || 'dev-secret',
  corsOrigin: e.CORS_ORIGIN ? e.CORS_ORIGIN.split(',') : true,
  db: {
    dialect: e.DB_DIALECT || 'sqlite',
    storage: e.SQLITE_FILE || './data.sqlite',
    host: e.DB_HOST,
    port: +e.DB_PORT || 3306,
    name: e.DB_NAME,
    user: e.DB_USER,
    password: e.DB_PASSWORD,
  },
}