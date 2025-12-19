import pg from 'pg';
import config from '../config/index.js';

const { Pool } = pg;

let pool = null;

/**
 * Initialize and return a PostgreSQL connection pool
 * Uses connection pooling for better performance in serverless environments
 */
export const connectDb = async () => {
  try {
    if (pool) {
      console.log('📦 Using existing database pool');
      return pool;
    }

    if (!config.db.connectionString) {
      throw new Error('DATABASE_URL is not configured in environment variables');
    }

    pool = new Pool({
      connectionString: config.db.connectionString,
      // Optimized for Vercel serverless environment
      max: 10, // Maximum pool size
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 10000, // Timeout after 10 seconds
      ssl: {
        rejectUnauthorized: false // Required for Neon and most cloud PostgreSQL providers
      }
    });

    // Test the connection
    const client = await pool.connect();
    console.log('✅ PostgreSQL database connected successfully');

    // Check database version
    const result = await client.query('SELECT version()');
    console.log('📊 PostgreSQL version:', result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]);

    client.release();

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('❌ Unexpected database pool error:', err);
    });

    return pool;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
};

/**
 * Get the existing database pool
 * @returns {Pool} PostgreSQL pool instance
 */
export const getDbPool = () => {
  if (!pool) {
    console.warn('⚠️ Database pool not initialized. Call connectDb() first.');
  }
  return pool;
};

/**
 * Close the database pool (useful for graceful shutdown)
 */
export const closeDb = async () => {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('🔌 Database connection pool closed');
  }
};

export default { connectDb, getDbPool, closeDb };
