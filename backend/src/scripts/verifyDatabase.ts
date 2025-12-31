#!/usr/bin/env ts-node

import dotenv from 'dotenv';
import { executeQuery, initializeDatabase, closeDatabase } from '../database/connection';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

async function verifyDatabase() {
  try {
    logger.info('Verifying database connection and tables...');
    
    // Initialize database connection
    await initializeDatabase();
    
    // Check if database exists and show current database
    const currentDb = await executeQuery('SELECT DATABASE() as current_db');
    logger.info('Current database:', currentDb);
    
    // Show all databases
    const databases = await executeQuery('SHOW DATABASES');
    logger.info('Available databases:', databases);
    
    // Show tables in current database
    const tables = await executeQuery('SHOW TABLES');
    logger.info('Tables in current database:', tables);
    
    // If articles table exists, show its structure
    if (tables.some((table: any) => Object.values(table)[0] === 'articles')) {
      const structure = await executeQuery('DESCRIBE articles');
      logger.info('Articles table structure:', structure);
    }
    
  } catch (error) {
    logger.error('Database verification failed:', error);
    throw error;
  } finally {
    await closeDatabase();
  }
}

// Run the script
if (require.main === module) {
  verifyDatabase().catch((error) => {
    logger.error('Unhandled error:', error);
    process.exit(1);
  });
}