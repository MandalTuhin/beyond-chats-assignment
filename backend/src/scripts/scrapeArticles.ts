#!/usr/bin/env ts-node

import dotenv from 'dotenv';
import { WebScraperService } from '../services/WebScraperService';
import { ArticleRepository } from '../repositories/ArticleRepository';
import { initializeDatabaseSetup } from '../database/init';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

async function main() {
  const scraperService = new WebScraperService();
  const articleRepository = new ArticleRepository();

  try {
    logger.info('Starting article scraping script...');

    // Initialize database
    await initializeDatabaseSetup();
    logger.info('Database initialized');

    // Check robots.txt
    const robotsAllowed = await scraperService.checkRobotsTxt('https://www.beyondchats.com');
    if (!robotsAllowed) {
      logger.warn('Robots.txt disallows scraping. Proceeding with caution...');
    }

    // Scrape articles
    logger.info('Scraping oldest articles from BeyondChats blog...');
    const scrapedArticles = await scraperService.scrapeOldestArticles();
    
    if (scrapedArticles.length === 0) {
      logger.warn('No articles found to scrape');
      return;
    }

    logger.info(`Found ${scrapedArticles.length} articles to process`);

    // Save articles to database
    let savedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const articleData of scrapedArticles) {
      try {
        // Check if article already exists
        const existingArticle = await articleRepository.findByUrl(articleData.url);
        
        if (existingArticle) {
          logger.info(`Article already exists: ${articleData.title}`);
          skippedCount++;
          continue;
        }

        // Save new article
        const savedArticle = await articleRepository.create(articleData);
        logger.info(`Saved article: ${savedArticle.title} (ID: ${savedArticle.id})`);
        savedCount++;
        
      } catch (error) {
        logger.error(`Error saving article "${articleData.title}":`, error);
        errorCount++;
      }
    }

    // Summary
    logger.info('Scraping completed!');
    logger.info(`Summary: ${savedCount} saved, ${skippedCount} skipped, ${errorCount} errors`);

    // Display saved articles
    if (savedCount > 0) {
      logger.info('\nSaved articles:');
      const allArticles = await articleRepository.findAll(10);
      allArticles.slice(0, savedCount).forEach((article, index) => {
        logger.info(`${index + 1}. ${article.title}`);
        logger.info(`   URL: ${article.url}`);
        logger.info(`   Words: ${article.wordCount}, Reading time: ${article.readingTime} min`);
        logger.info(`   Tags: ${article.tags.join(', ')}`);
        logger.info('');
      });
    }

  } catch (error) {
    logger.error('Script failed:', error);
    process.exit(1);
  } finally {
    // Clean up
    await scraperService.closeBrowser();
    logger.info('Browser closed');
  }
}

// Handle script termination
process.on('SIGINT', async () => {
  logger.info('Script interrupted, cleaning up...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Script terminated, cleaning up...');
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main().catch((error) => {
    logger.error('Unhandled error:', error);
    process.exit(1);
  });
}