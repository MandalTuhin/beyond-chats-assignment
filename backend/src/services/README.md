# Web Scraper Service

This service handles scraping articles from the BeyondChats blog using Puppeteer for browser automation and Cheerio for HTML parsing.

## Features

- **Respectful Scraping**: Checks robots.txt before scraping
- **Polite Crawling**: Implements delays between requests
- **Error Handling**: Graceful handling of network errors and parsing failures
- **Content Cleaning**: Removes unwanted HTML elements and formats content
- **Tag Extraction**: Automatically extracts relevant tags from content
- **Duplicate Prevention**: Checks for existing articles before saving

## Usage

### Via API Endpoints

```bash
# Scrape 5 oldest articles from BeyondChats blog
curl -X POST http://localhost:3001/api/scraper/oldest

# Scrape a single article by URL
curl -X POST http://localhost:3001/api/scraper/single \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.beyondchats.com/blogs/article-url"}'

# Get scraping statistics
curl http://localhost:3001/api/scraper/stats
```

### Via CLI Script

```bash
# Run the scraping script directly
npm run scrape

# Run in development mode with auto-restart
npm run scrape:dev
```

### Programmatic Usage

```typescript
import { WebScraperService } from './services/WebScraperService';
import { ArticleRepository } from './repositories/ArticleRepository';

const scraper = new WebScraperService();
const articleRepo = new ArticleRepository();

// Scrape oldest articles
const articles = await scraper.scrapeOldestArticles();

// Save to database
for (const articleData of articles) {
  await articleRepo.create(articleData);
}

// Clean up
await scraper.closeBrowser();
```

## Configuration

The scraper can be configured through environment variables:

```env
# Browser settings
PUPPETEER_HEADLESS=true
PUPPETEER_TIMEOUT=30000

# Scraping settings
SCRAPER_DELAY=1000
SCRAPER_MAX_ARTICLES=5
```

## Error Handling

The scraper implements comprehensive error handling:

- **Network Errors**: Retries and graceful degradation
- **Parsing Errors**: Skips malformed content
- **Browser Errors**: Automatic browser restart
- **Rate Limiting**: Respects server limits

## Content Processing

### Article Extraction

The scraper looks for content using multiple selectors:

- **Title**: `h1`, `.post-title`, `.entry-title`, `.article-title`
- **Content**: `.post-content`, `.entry-content`, `.article-content`, `main article`
- **Date**: `time[datetime]`, `.post-date`, `.published`

### Content Cleaning

- Removes script tags, styles, navigation elements
- Strips advertisements and unwanted content
- Normalizes whitespace and formatting
- Preserves essential structure

### Tag Extraction

Automatically extracts relevant tags based on content analysis:

- AI and technology terms
- Business and marketing keywords
- Industry-specific terminology

## Browser Management

- Uses Puppeteer with optimized settings for server environments
- Implements proper resource cleanup
- Handles browser crashes and restarts
- Configurable for headless or headed mode

## Compliance

- Checks robots.txt before scraping
- Implements polite crawling with delays
- Respects rate limits and server resources
- Logs all scraping activities

## Testing

Run tests with:

```bash
npm test -- WebScraperService.test.ts
```

Tests cover:
- Robots.txt checking
- URL validation
- Error handling
- Content extraction
- Browser management

## Troubleshooting

### Common Issues

1. **Browser Launch Fails**
   - Install required dependencies: `apt-get install -y chromium-browser`
   - Check Docker configuration for headless mode

2. **Scraping Returns Empty Results**
   - Website structure may have changed
   - Check network connectivity
   - Verify robots.txt permissions

3. **Memory Issues**
   - Ensure browser is properly closed after use
   - Monitor memory usage in production
   - Consider implementing browser pooling

### Debugging

Enable debug logging:

```typescript
import { logger } from '../utils/logger';
logger.level = 'debug';
```

Monitor browser activity:

```typescript
const scraper = new WebScraperService();
// Browser will be visible for debugging
process.env.PUPPETEER_HEADLESS = 'false';
```

## Performance Considerations

- Browser instances are reused when possible
- Content is processed in streaming fashion
- Database operations are batched
- Memory usage is monitored and controlled

## Security

- All scraped content is sanitized
- XSS prevention through content cleaning
- Input validation on all URLs
- Secure browser configuration