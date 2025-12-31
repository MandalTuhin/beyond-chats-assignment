#!/usr/bin/env ts-node

import dotenv from 'dotenv';
import { ArticleRepository } from '../repositories/ArticleRepository';
import { initializeDatabase, closeDatabase } from '../database/connection';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

async function checkArticles() {
  try {
    logger.info('Checking saved articles...');
    
    // Initialize database connection
    await initializeDatabase();
    
    const articleRepository = new ArticleRepository();
    
    // Get article count
    const count = await articleRepository.count();
    logger.info(`Total articles in database: ${count}`);
    
    // Get all articles
    const articles = await articleRepository.findAll(10);
    
    if (articles.length > 0) {
      logger.info('Saved articles:');
      articles.forEach((article, index) => {
        console.log(`${index + 1}. ${article.title}`);
        console.log(`   ID: ${article.id}`);
        console.log(`   URL: ${article.url}`);
        console.log(`   Words: ${article.wordCount}, Reading time: ${article.readingTime} min`);
        console.log(`   Tags: ${article.tags.join(', ')}`);
        console.log(`   Created: ${article.createdAt}`);
        console.log('');
      });
    } else {
      logger.info('No articles found in database');
    }
    
  } catch (error) {
    logger.error('Error checking articles:', error);
    throw error;
  } finally {
    await closeDatabase();
  }
}

// Run the script
if (require.main === module) {
  checkArticles().catch((error) => {
    logger.error('Unhandled error:', error);
    process.exit(1);
  });
}