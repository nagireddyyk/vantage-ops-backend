import 'dotenv/config';
import mysql from 'mysql2/promise';

const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3307),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

const tables = [
  'users',
  'products',
  'quotes',
  'orders',
  'purchaseorders',
  'tickets'
];

try {
  for (const table of tables) {
    const [rows] = await db.query(
      `SELECT * FROM \`${table}\` LIMIT 10`
    );

    console.log(`\n========== ${table} (${rows.length} rows shown) ==========`);
    console.table(rows);
  }
} catch (error) {
  console.error('Database error:', error.message);
} finally {
  await db.end();
}
