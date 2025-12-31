#!/usr/bin/env ts-node

import dotenv from 'dotenv';
import { executeQuery, initializeDatabase, closeDatabase } from '../database/connection';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

async function resetDatabase() {
  try {
    logger.info('Resetting database...');
    
    // Initialize database connection
    await initializeDatabase();
    
    // Drop existing tables
    const dropTables = [
      'DROP TABLE IF EXISTS enhancement_requests',
      'DROP TABLE IF EXISTS `references`',
      'DROP TABLE IF EXISTS articles',
      'DROP TABLE IF EXISTS migrations'
    ];
    
    for (const query of dropTables) {
      await executeQuery(query);
      logger.info(`Executed: ${query}`);
    }
    
    logger.info('Database reset completed successfully');
    
  } catch (error) {
    logger.error('Database reset failed:', error);
    throw error;
  } finally {
    await closeDatabase();
  }
}

// Run the script
if (require.main === module) {
  resetDatabase().catch((error) => {
    logger.error('Unhandled error:', error);
    process.exit(1);
  });
}