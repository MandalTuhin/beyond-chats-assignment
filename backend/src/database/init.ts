import { initializeDatabase, closeDatabase } from './connection';
import { runMigrations } from './migrations';
import { validateDatabaseConfig } from '../config/database';
import { logger } from '../utils/logger';

/**
 * Initialize the complete database setup
 */
export const initializeDatabaseSetup = async (): Promise<void> => {
  try {
    logger.info('Initializing database setup...');
    
    // Validate configuration
    validateDatabaseConfig();
    logger.info('Database configuration validated');
    
    // Initialize connection pool
    await initializeDatabase();
    logger.info('Database connection pool initialized');
    
    // Run migrations
    await runMigrations();
    logger.info('Database migrations completed');
    
    logger.info('Database setup completed successfully');
  } catch (error) {
    logger.error('Database setup failed:', error);
    throw error;
  }
};

/**
 * Graceful database shutdown
 */
export const shutdownDatabase = async (): Promise<void> => {
  try {
    await closeDatabase();
    logger.info('Database shutdown completed');
  } catch (error) {
    logger.error('Database shutdown failed:', error);
    throw error;
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down database...');
  await shutdownDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down database...');
  await shutdownDatabase();
  process.exit(0);
});