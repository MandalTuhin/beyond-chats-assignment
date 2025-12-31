#!/usr/bin/env ts-node

import dotenv from 'dotenv';
import { executeQuery, initializeDatabase, closeDatabase } from '../database/connection';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

async function checkMigrations() {
  try {
    logger.info('Checking migration status...');
    
    // Initialize database connection
    await initializeDatabase();
    
    // Check migrations table
    const migrations = await executeQuery('SELECT * FROM migrations ORDER BY executed_at');
    logger.info('Executed migrations:', migrations);
    
    // Try to manually create the articles table to test
    try {
      const createArticlesQuery = `
        CREATE TABLE IF NOT EXISTS articles (
          id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
          title VARCHAR(500) NOT NULL,
          content LONGTEXT NOT NULL,
          url VARCHAR(500) NOT NULL UNIQUE,
          scraped_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          enhanced_content LONGTEXT NULL,
          is_enhanced BOOLEAN DEFAULT FALSE,
          word_count INT DEFAULT 0,
          reading_time INT DEFAULT 0,
          tags JSON NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          
          INDEX idx_title (title(100)),
          INDEX idx_scraped_date (scraped_date),
          INDEX idx_is_enhanced (is_enhanced),
          INDEX idx_created_at (created_at)
        )
      `;
      
      await executeQuery(createArticlesQuery);
      logger.info('Articles table created successfully');
      
      // Show tables again
      const tables = await executeQuery('SHOW TABLES');
      logger.info('Tables after manual creation:', tables);
      
    } catch (error) {
      logger.error('Error creating articles table manually:', error);
    }
    
  } catch (error) {
    logger.error('Migration check failed:', error);
    throw error;
  } finally {
    await closeDatabase();
  }
}

// Run the script
if (require.main === module) {
  checkMigrations().catch((error) => {
    logger.error('Unhandled error:', error);
    process.exit(1);
  });
}