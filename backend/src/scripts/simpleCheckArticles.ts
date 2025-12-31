#!/usr/bin/env ts-node

import dotenv from 'dotenv';
import { executeQuery, initializeDatabase, closeDatabase } from '../database/connection';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

async function simpleCheckArticles() {
  try {
    logger.info('Checking saved articles...');
    
    // Initialize database connection
    await initializeDatabase();
    
    // Get article count
    const countResult = await executeQuery('SELECT COUNT(*) as count FROM articles');
    const count = countResult[0].count;
    logger.info(`Total articles in database: ${count}`);
    
    // Get articles with simple query
    const articles = await executeQuery(`
      SELECT id, title, url, word_count, reading_time, tags, created_at
      FROM articles 
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    if (articles.length > 0) {
      logger.info('Saved articles:');
      articles.forEach((article: any, index: number) => {
        console.log(`${index + 1}. ${article.title}`);
        console.log(`   ID: ${article.id}`);
        console.log(`   URL: ${article.url}`);
        console.log(`   Words: ${article.word_count}, Reading time: ${article.reading_time} min`);
        
        // Parse tags safely
        let tags = [];
        try {
          if (article.tags) {
            if (typeof article.tags === 'string') {
              if (article.tags.startsWith('[')) {
                tags = JSON.parse(article.tags);
              } else {
                tags = article.tags.split(',').map((t: string) => t.trim());
              }
            } else if (Array.isArray(article.tags)) {
              tags = article.tags;
            }
          }
        } catch (e) {
          tags = [];
        }
        
        console.log(`   Tags: ${tags.join(', ')}`);
        console.log(`   Created: ${article.created_at}`);
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
  simpleCheckArticles().catch((error) => {
    logger.error('Unhandled error:', error);
    process.exit(1);
  });
}