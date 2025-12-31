import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { logger } from '../utils/logger';
import { CreateArticleData } from '../models/Article';

export interface ScrapedArticle {
  title: string;
  content: string;
  url: string;
  publishedDate?: Date;
}

export class WebScraperService {
  private browser: Browser | null = null;
  private readonly baseUrl = 'https://beyondchats.com/blogs';
  private readonly userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

  /**
   * Initialize the browser instance
   */
  private async initBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
    }
    return this.browser;
  }

  /**
   * Close the browser instance
   */
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Navigate to the last page of BeyondChats blog and extract 5 oldest articles
   */
  async scrapeOldestArticles(): Promise<CreateArticleData[]> {
    let page: Page | null = null;
    
    try {
      logger.info('Starting to scrape oldest articles from BeyondChats blog');
      
      const browser = await this.initBrowser();
      page = await browser.newPage();
      
      // Set user agent and viewport
      await page.setUserAgent(this.userAgent);
      await page.setViewport({ width: 1920, height: 1080 });
      
      // Navigate to the blog page
      logger.info(`Navigating to ${this.baseUrl}`);
      await page.goto(this.baseUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Find the last page by looking for pagination
      const lastPageUrl = await this.findLastPage(page);
      
      if (lastPageUrl && lastPageUrl !== this.baseUrl) {
        logger.info(`Navigating to last page: ${lastPageUrl}`);
        await page.goto(lastPageUrl, { 
          waitUntil: 'networkidle2',
          timeout: 30000 
        });
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Extract article links from the current page
      const articleLinks = await this.extractArticleLinks(page);
      logger.info(`Found ${articleLinks.length} article links`);

      // Take the first 5 articles (oldest on the last page)
      const linksToScrape = articleLinks.slice(0, 5);
      logger.info(`Scraping ${linksToScrape.length} articles`);

      // Scrape each article
      const scrapedArticles: CreateArticleData[] = [];
      
      for (const link of linksToScrape) {
        try {
          const article = await this.scrapeArticleContent(link);
          if (article) {
            scrapedArticles.push(article);
            logger.info(`Successfully scraped article: ${article.title}`);
          }
          
          // Be polite - wait between requests
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          logger.error(`Failed to scrape article ${link}:`, error);
          // Continue with other articles
        }
      }

      logger.info(`Successfully scraped ${scrapedArticles.length} articles`);
      return scrapedArticles;

    } catch (error) {
      logger.error('Error scraping oldest articles:', error);
      throw error;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  /**
   * Find the last page URL by looking for pagination
   */
  private async findLastPage(page: Page): Promise<string | null> {
    try {
      // Look for pagination elements
      const paginationSelectors = [
        'a[aria-label="Last page"]',
        '.pagination a:last-child',
        '.page-numbers:last-child',
        'a[title*="last"]',
        'a[title*="Last"]'
      ];

      for (const selector of paginationSelectors) {
        try {
          const lastPageElement = await page.$(selector);
          if (lastPageElement) {
            const href = await lastPageElement.evaluate(el => el.getAttribute('href'));
            if (href) {
              return href.startsWith('http') ? href : new URL(href, this.baseUrl).toString();
            }
          }
        } catch (error) {
          // Continue trying other selectors
        }
      }

      // If no pagination found, try to find page numbers
      const pageNumbers = await page.$$eval('a[href*="page"]', elements => 
        elements
          .map(el => ({
            href: el.getAttribute('href'),
            text: el.textContent?.trim()
          }))
          .filter(item => item.href && /\d+/.test(item.text || ''))
          .sort((a, b) => {
            const numA = parseInt(a.text?.match(/\d+/)?.[0] || '0');
            const numB = parseInt(b.text?.match(/\d+/)?.[0] || '0');
            return numB - numA;
          })
      );

      if (pageNumbers.length > 0) {
        const lastPageHref = pageNumbers[0].href;
        return lastPageHref?.startsWith('http') 
          ? lastPageHref 
          : new URL(lastPageHref!, this.baseUrl).toString();
      }

      return null;
    } catch (error) {
      logger.warn('Could not find last page, using current page:', error);
      return null;
    }
  }

  /**
   * Extract article links from the current page
   */
  private async extractArticleLinks(page: Page): Promise<string[]> {
    try {
      const articleSelectors = [
        'article a[href*="/blog"]',
        '.blog-post a',
        '.post-title a',
        'h2 a[href*="/blog"]',
        'h3 a[href*="/blog"]',
        '.entry-title a',
        'a[href*="/blogs/"]'
      ];

      let links: string[] = [];

      for (const selector of articleSelectors) {
        try {
          const foundLinks = await page.$$eval(selector, elements =>
            elements
              .map(el => el.getAttribute('href'))
              .filter(href => href && href.includes('/blog'))
              .map(href => href?.startsWith('http') ? href : `https://www.beyondchats.com${href}`)
          );

          if (foundLinks.length > 0) {
            links = foundLinks as string[];
            break;
          }
        } catch (error) {
          // Continue trying other selectors
        }
      }

      // Remove duplicates
      return [...new Set(links)];
    } catch (error) {
      logger.error('Error extracting article links:', error);
      return [];
    }
  }

  /**
   * Scrape content from a specific article URL
   */
  private async scrapeArticleContent(url: string): Promise<CreateArticleData | null> {
    let page: Page | null = null;
    
    try {
      const browser = await this.initBrowser();
      page = await browser.newPage();
      
      await page.setUserAgent(this.userAgent);
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Extract article data
      const articleData = await page.evaluate(() => {
        // Common selectors for article content
        const titleSelectors = [
          'h1',
          '.post-title',
          '.entry-title',
          '.article-title',
          'title'
        ];

        const contentSelectors = [
          '.post-content',
          '.entry-content',
          '.article-content',
          '.blog-content',
          'main article',
          '.content'
        ];

        const dateSelectors = [
          'time[datetime]',
          '.post-date',
          '.published',
          '.entry-date',
          '[class*="date"]'
        ];

        // Extract title
        let title = '';
        for (const selector of titleSelectors) {
          const element = document.querySelector(selector);
          if (element && element.textContent?.trim()) {
            title = element.textContent.trim();
            break;
          }
        }

        // Extract content
        let content = '';
        for (const selector of contentSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            // Get text content and preserve some structure
            content = element.innerHTML || element.textContent || '';
            if (content.trim()) {
              break;
            }
          }
        }

        // Extract date
        let publishedDate: string | null = null;
        for (const selector of dateSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            publishedDate = element.getAttribute('datetime') || 
                           element.getAttribute('content') || 
                           element.textContent?.trim() || null;
            if (publishedDate) {
              break;
            }
          }
        }

        return {
          title: title || document.title || 'Untitled',
          content: content || '',
          publishedDate
        };
      });

      // Validate extracted data
      if (!articleData.title || !articleData.content) {
        logger.warn(`Incomplete article data for ${url}`);
        return null;
      }

      // Clean and format the content
      const cleanContent = this.cleanArticleContent(articleData.content);
      
      if (cleanContent.length < 100) {
        logger.warn(`Article content too short for ${url}`);
        return null;
      }

      return {
        title: articleData.title.substring(0, 500), // Ensure title fits in database
        content: cleanContent,
        url: url,
        tags: this.extractTags(articleData.title, cleanContent)
      };

    } catch (error) {
      logger.error(`Error scraping article content from ${url}:`, error);
      return null;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  /**
   * Clean and format article content
   */
  private cleanArticleContent(content: string): string {
    // Use cheerio to clean HTML content
    const $ = cheerio.load(content);
    
    // Remove unwanted elements
    $('script, style, nav, header, footer, aside, .advertisement, .ads').remove();
    
    // Get clean text content
    let cleanText = $.text();
    
    // Clean up whitespace
    cleanText = cleanText
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();

    return cleanText;
  }

  /**
   * Extract relevant tags from title and content
   */
  private extractTags(title: string, content: string): string[] {
    const text = `${title} ${content}`.toLowerCase();
    const commonTags = [
      'ai', 'chatbot', 'automation', 'customer service', 'technology',
      'business', 'marketing', 'support', 'communication', 'digital',
      'innovation', 'software', 'platform', 'solution', 'analytics'
    ];

    return commonTags.filter(tag => text.includes(tag));
  }

  /**
   * Scrape a single article by URL (utility method)
   */
  async scrapeArticle(url: string): Promise<CreateArticleData | null> {
    try {
      logger.info(`Scraping single article: ${url}`);
      return await this.scrapeArticleContent(url);
    } catch (error) {
      logger.error(`Error scraping single article ${url}:`, error);
      throw error;
    }
  }

  /**
   * Check if robots.txt allows scraping
   */
  async checkRobotsTxt(baseUrl: string): Promise<boolean> {
    try {
      const robotsUrl = new URL('/robots.txt', baseUrl).toString();
      const response = await axios.get(robotsUrl, { timeout: 5000 });
      
      // Simple check - look for disallow rules
      const robotsContent = response.data.toLowerCase();
      const userAgentSection = robotsContent.includes('user-agent: *');
      const disallowAll = robotsContent.includes('disallow: /');
      
      if (userAgentSection && disallowAll) {
        logger.warn(`Robots.txt disallows scraping for ${baseUrl}`);
        return false;
      }
      
      return true;
    } catch (error) {
      logger.warn(`Could not check robots.txt for ${baseUrl}:`, error);
      // If we can't check robots.txt, proceed with caution
      return true;
    }
  }
}