import mysql from 'mysql2/promise';
import { config } from '../config/database';
import { logger } from '../utils/logger';

// Connection pool for efficient database connections
let pool: mysql.Pool | null = null;

/**
 * Initialize database connection pool
 */
export const initializeDatabase = async (): Promise<mysql.Pool> => {
  try {
    if (pool) {
      return pool;
    }

    pool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4',
    });

    // Test the connection
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();

    logger.info('Database connection pool initialized successfully');
    return pool;
  } catch (error) {
    logger.error('Failed to initialize database connection pool:', error);
    throw error;
  }
};

/**
 * Get database connection pool
 */
export const getDatabase = (): mysql.Pool => {
  if (!pool) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return pool;
};

/**
 * Execute a query with error handling
 */
export const executeQuery = async <T = any>(
  query: string,
  params?: any[]
): Promise<T> => {
  const db = getDatabase();
  try {
    const [results] = await db.execute(query, params);
    return results as T;
  } catch (error) {
    logger.error('Database query error:', { query, params, error });
    throw error;
  }
};

/**
 * Execute a transaction
 */
export const executeTransaction = async <T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> => {
  const db = getDatabase();
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    logger.error('Transaction error:', error);
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Close database connection pool
 */
export const closeDatabase = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database connection pool closed');
  }
};

/**
 * Health check for database connection
 */
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    const db = getDatabase();
    const connection = await db.getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
};