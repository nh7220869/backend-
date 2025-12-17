import pg from 'pg';
import config from '../config/index.js';

const { Pool } = pg;

let pool;

const connectDb = async () => {
  if (pool) {
    return pool; // Return existing pool if already connected
  }

  try {
    pool = new Pool({
      connectionString: config.db.connectionString,
      // Add connection pool settings for better stability
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
      connectionTimeoutMillis: 10000, // How long to wait when connecting a new client
    });

    // Add error handler to prevent crashes
    pool.on('error', (err, client) => {
      console.error('Unexpected database pool error:', err);
      // Don't crash the server - just log the error
    });

    // Test the connection
    const client = await pool.connect();
    console.log('Connected to PostgreSQL database.');
    client.release(); // Release the test client back to the pool

    return pool;
  } catch (error) {
    console.error('Failed to connect to PostgreSQL database:', error);
    // Depending on the application, you might want to re-throw or handle this gracefully.
    // For now, we'll let it try to connect on next call or fail if critical.
    pool = null; // Reset pool if connection failed
    throw error;
  }
};

const getDbPool = () => {
  if (!pool) {
    console.warn('Database pool not initialized. Call connectDb() first.');
  }
  return pool;
};

// Exporting query function for convenience
const query = (text, params) => {
  const currentPool = getDbPool();
  if (!currentPool) {
    throw new Error('Database pool is not available. Cannot execute query.');
  }
  return currentPool.query(text, params);
};

export { connectDb, getDbPool, query };
