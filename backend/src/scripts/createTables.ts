#!/usr/bin/env ts-node

import dotenv from 'dotenv';
import { executeQuery, initializeDatabase, closeDatabase } from '../database/connection';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

async function createTables() {
  try {
    logger.info('Creating database tables...');
    
    // Initialize database connection
    await initializeDatabase();
    
    // Create articles table
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
    logger.info('Articles table created');
    
    // Create references table
    const createReferencesQuery = `
      CREATE TABLE IF NOT EXISTS \`references\` (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        article_id VARCHAR(36) NOT NULL,
        url VARCHAR(500) NOT NULL,
        title VARCHAR(500) NOT NULL,
        content LONGTEXT NOT NULL,
        scraped_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        relevance_score DECIMAL(3,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
        
        INDEX idx_article_id (article_id),
        INDEX idx_relevance_score (relevance_score),
        INDEX idx_scraped_date (scraped_date)
      )
    `;
    
    await executeQuery(createReferencesQuery);
    logger.info('References table created');
    
    // Create enhancement_requests table
    const createEnhancementRequestsQuery = `
      CREATE TABLE IF NOT EXISTS enhancement_requests (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        article_id VARCHAR(36) NOT NULL,
        status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
        enhancement_prompt TEXT NULL,
        error_message TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
        
        INDEX idx_article_id (article_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      )
    `;
    
    await executeQuery(createEnhancementRequestsQuery);
    logger.info('Enhancement requests table created');
    
    // Show all tables
    const tables = await executeQuery('SHOW TABLES');
    logger.info('All tables:', tables);
    
    logger.info('Database tables created successfully');
    
  } catch (error) {
    logger.error('Table creation failed:', error);
    throw error;
  } finally {
    await closeDatabase();
  }
}

// Run the script
if (require.main === module) {
  createTables().catch((error) => {
    logger.error('Unhandled error:', error);
    process.exit(1);
  });
}