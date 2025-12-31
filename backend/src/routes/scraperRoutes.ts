import { Router } from 'express';
import { ScraperController } from '../controllers/ScraperController';

const router = Router();
const scraperController = new ScraperController();

/**
 * @route POST /api/scraper/oldest
 * @desc Scrape the 5 oldest articles from BeyondChats blog
 * @access Public
 */
router.post('/oldest', async (req, res) => {
  await scraperController.scrapeOldestArticles(req, res);
});

/**
 * @route POST /api/scraper/single
 * @desc Scrape a single article by URL
 * @access Public
 * @body { url: string }
 */
router.post('/single', async (req, res) => {
  await scraperController.scrapeSingleArticle(req, res);
});

/**
 * @route GET /api/scraper/stats
 * @desc Get scraping statistics
 * @access Public
 */
router.get('/stats', async (req, res) => {
  await scraperController.getScrapingStats(req, res);
});

export default router;