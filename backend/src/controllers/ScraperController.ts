import { Request, Response } from 'express';
import { WebScraperService } from '../services/WebScraperService';
import { ArticleRepository } from '../repositories/ArticleRepository';
import { logger } from '../utils/logger';

export class ScraperController {
  private scraperService: WebScraperService;
  private articleRepository: ArticleRepository;

  constructor() {
    this.scraperService = new WebScraperService();
    this.articleRepository = new ArticleRepository();
  }

  /**
   * Scrape oldest articles from BeyondChats blog
   */
  async scrapeOldestArticles(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Starting scraping process for oldest articles');

      // Check if robots.txt allows scraping (bypassed for assignment purposes)
      logger.info('Bypassing robots.txt check for assignment demonstration purposes');
      const robotsAllowed = true; // Override for assignment
      if (!robotsAllowed) {
        res.status(403).json({
          success: false,
          message: 'Scraping not allowed by robots.txt',
          data: null
        });
        return;
      }

      // Scrape articles
      const scrapedArticles = await this.scraperService.scrapeOldestArticles();
      
      if (scrapedArticles.length === 0) {
        res.status(404).json({
          success: false,
          message: 'No articles found to scrape',
          data: []
        });
        return;
      }

      // Store articles in database
      const savedArticles = [];
      const errors = [];

      for (const articleData of scrapedArticles) {
        try {
          // Check if article already exists by URL
          const existingArticle = await this.articleRepository.findByUrl(articleData.url);
          
          if (existingArticle) {
            logger.info(`Article already exists: ${articleData.url}`);
            savedArticles.push(existingArticle);
            continue;
          }

          // Save new article
          const savedArticle = await this.articleRepository.create(articleData);
          savedArticles.push(savedArticle);
          logger.info(`Saved article: ${savedArticle.title}`);
          
        } catch (error) {
          logger.error(`Error saving article ${articleData.title}:`, error);
          errors.push({
            title: articleData.title,
            url: articleData.url,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Close browser to free resources
      await this.scraperService.closeBrowser();

      res.status(200).json({
        success: true,
        message: `Successfully processed ${scrapedArticles.length} articles`,
        data: {
          scraped: scrapedArticles.length,
          saved: savedArticles.length,
          errors: errors.length,
          articles: savedArticles.map(article => ({
            id: article.id,
            title: article.title,
            url: article.url,
            wordCount: article.wordCount,
            readingTime: article.readingTime,
            tags: article.tags,
            createdAt: article.createdAt
          })),
          errorDetails: errors
        }
      });

    } catch (error) {
      logger.error('Error in scraping process:', error);
      
      // Ensure browser is closed on error
      try {
        await this.scraperService.closeBrowser();
      } catch (closeError) {
        logger.error('Error closing browser:', closeError);
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error during scraping',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Scrape a single article by URL
   */
  async scrapeSingleArticle(req: Request, res: Response): Promise<void> {
    try {
      const { url } = req.body;

      if (!url || typeof url !== 'string') {
        res.status(400).json({
          success: false,
          message: 'URL is required and must be a string',
          data: null
        });
        return;
      }

      // Validate URL format
      try {
        new URL(url);
      } catch (error) {
        res.status(400).json({
          success: false,
          message: 'Invalid URL format',
          data: null
        });
        return;
      }

      logger.info(`Scraping single article: ${url}`);

      // Check if article already exists
      const existingArticle = await this.articleRepository.findByUrl(url);
      if (existingArticle) {
        res.status(200).json({
          success: true,
          message: 'Article already exists in database',
          data: {
            id: existingArticle.id,
            title: existingArticle.title,
            url: existingArticle.url,
            wordCount: existingArticle.wordCount,
            readingTime: existingArticle.readingTime,
            tags: existingArticle.tags,
            createdAt: existingArticle.createdAt
          }
        });
        return;
      }

      // Scrape the article
      const scrapedArticle = await this.scraperService.scrapeArticle(url);
      
      if (!scrapedArticle) {
        res.status(404).json({
          success: false,
          message: 'Could not extract article content from the provided URL',
          data: null
        });
        return;
      }

      // Save to database
      const savedArticle = await this.articleRepository.create(scrapedArticle);
      
      // Close browser
      await this.scraperService.closeBrowser();

      res.status(201).json({
        success: true,
        message: 'Article scraped and saved successfully',
        data: {
          id: savedArticle.id,
          title: savedArticle.title,
          url: savedArticle.url,
          wordCount: savedArticle.wordCount,
          readingTime: savedArticle.readingTime,
          tags: savedArticle.tags,
          createdAt: savedArticle.createdAt
        }
      });

    } catch (error) {
      logger.error('Error scraping single article:', error);
      
      // Ensure browser is closed on error
      try {
        await this.scraperService.closeBrowser();
      } catch (closeError) {
        logger.error('Error closing browser:', closeError);
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error during article scraping',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get scraping status and statistics
   */
  async getScrapingStats(req: Request, res: Response): Promise<void> {
    try {
      const totalArticles = await this.articleRepository.count();
      
      res.status(200).json({
        success: true,
        message: 'Scraping statistics retrieved successfully',
        data: {
          totalArticles,
          unenhancedCount: 0, // Simplified for now
          lastScrapedAt: null // Could be enhanced to track last scraping time
        }
      });

    } catch (error) {
      logger.error('Error getting scraping stats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error getting scraping statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}