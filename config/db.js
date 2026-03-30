// config/db.js
// PostgreSQL connection pool for Neon / Render / local Postgres

const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || null;
const pool = new Pool({
  connectionString: connectionString || undefined,
  host: connectionString ? undefined : process.env.DB_HOST || 'localhost',
  port: connectionString ? undefined : process.env.DB_PORT || 5432,
  database: connectionString ? undefined : process.env.DB_NAME || 'talentlaunch',
  user: connectionString ? undefined : process.env.DB_USER || 'postgres',
  password: connectionString ? undefined : process.env.DB_PASSWORD || '',
  ssl: connectionString
    ? { rejectUnauthorized: false }
    : false,
  max: 10,
});

function convertToPgParams(sql, params = []) {
  let index = 0;
  const text = sql.replace(/\?/g, () => `$${++index}`);
  return { text, values: params };
}

const originalQuery = pool.query.bind(pool);

pool.query = async (sql, params = []) => {
  const { text, values } = convertToPgParams(sql, params);
  const result = await originalQuery(text, values);
  const exposed = {
    ...result,
    insertId: result.command === 'INSERT' && result.rows[0] ? result.rows[0].id : null,
    affectedRows: result.rowCount,
  };
  return [result.rows, exposed];
};

// Test the connection on startup
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅  PostgreSQL connected successfully');
    client.release();
  } catch (err) {
    console.error('❌  PostgreSQL connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = { pool, testConnection };