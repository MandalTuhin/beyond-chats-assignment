import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { executeQuery, executeTransaction } from '../database/connection';
import { 
  Article, 
  CreateArticleData, 
  UpdateArticleData,
  calculateWordCount,
  calculateReadingTime,
  sanitizeArticleContent
} from '../models/Article';
import { logger } from '../utils/logger';

export class ArticleRepository {
  /**
   * Create a new article
   */
  async create(data: CreateArticleData): Promise<Article> {
    try {
      // Sanitize and process content
      const sanitizedContent = sanitizeArticleContent(data.content);
      const wordCount = calculateWordCount(sanitizedContent);
      const readingTime = calculateReadingTime(wordCount);

      const query = `
        INSERT INTO articles (title, content, url, word_count, reading_time, tags)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const params = [
        data.title.trim(),
        sanitizedContent,
        data.url,
        wordCount,
        readingTime,
        JSON.stringify(data.tags || [])
      ];

      const result = await executeQuery<ResultSetHeader>(query, params);
      
      if (!result.insertId) {
        throw new Error('Failed to create article - no ID returned');
      }

      // Fetch the created article
      const createdArticle = await this.findById(result.insertId.toString());
      if (!createdArticle) {
        throw new Error('Failed to retrieve created article');
      }

      logger.info(`Article created successfully: ${createdArticle.id}`);
      return createdArticle;
    } catch (error) {
      logger.error('Error creating article:', error);
      throw error;
    }
  }

  /**
   * Find article by ID
   */
  async findById(id: string): Promise<Article | null> {
    try {
      const query = `
        SELECT id, title, content, url, scraped_date, enhanced_content, 
               is_enhanced, word_count, reading_time, tags, created_at, updated_at
        FROM articles 
        WHERE id = ?
      `;

      const results = await executeQuery<RowDataPacket[]>(query, [id]);
      
      if (results.length === 0) {
        return null;
      }

      return this.mapRowToArticle(results[0]);
    } catch (error) {
      logger.error(`Error finding article by ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Find article by URL
   */
  async findByUrl(url: string): Promise<Article | null> {
    try {
      const query = `
        SELECT id, title, content, url, scraped_date, enhanced_content, 
               is_enhanced, word_count, reading_time, tags, created_at, updated_at
        FROM articles 
        WHERE url = ?
      `;

      const results = await executeQuery<RowDataPacket[]>(query, [url]);
      
      if (results.length === 0) {
        return null;
      }

      return this.mapRowToArticle(results[0]);
    } catch (error) {
      logger.error(`Error finding article by URL ${url}:`, error);
      throw error;
    }
  }

  /**
   * Find all articles with pagination
   */
  async findAll(limit: number = 50, offset: number = 0): Promise<Article[]> {
    try {
      const query = `
        SELECT id, title, content, url, scraped_date, enhanced_content, 
               is_enhanced, word_count, reading_time, tags, created_at, updated_at
        FROM articles 
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;

      const results = await executeQuery<RowDataPacket[]>(query, [limit, offset]);
      
      return results.map(row => this.mapRowToArticle(row));
    } catch (error) {
      logger.error('Error finding all articles:', error);
      throw error;
    }
  }

  /**
   * Update article
   */
  async update(id: string, data: UpdateArticleData): Promise<Article | null> {
    try {
      const updates: string[] = [];
      const params: any[] = [];

      if (data.title !== undefined) {
        updates.push('title = ?');
        params.push(data.title.trim());
      }

      if (data.content !== undefined) {
        const sanitizedContent = sanitizeArticleContent(data.content);
        const wordCount = calculateWordCount(sanitizedContent);
        const readingTime = calculateReadingTime(wordCount);
        
        updates.push('content = ?', 'word_count = ?', 'reading_time = ?');
        params.push(sanitizedContent, wordCount, readingTime);
      }

      if (data.enhancedContent !== undefined) {
        updates.push('enhanced_content = ?', 'is_enhanced = ?');
        params.push(data.enhancedContent, true);
      }

      if (data.tags !== undefined) {
        updates.push('tags = ?');
        params.push(JSON.stringify(data.tags));
      }

      if (updates.length === 0) {
        throw new Error('No fields to update');
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      const query = `UPDATE articles SET ${updates.join(', ')} WHERE id = ?`;
      
      const result = await executeQuery<ResultSetHeader>(query, params);
      
      if (result.affectedRows === 0) {
        return null;
      }

      // Return updated article
      const updatedArticle = await this.findById(id);
      if (updatedArticle) {
        logger.info(`Article updated successfully: ${id}`);
      }
      
      return updatedArticle;
    } catch (error) {
      logger.error(`Error updating article ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete article
   */
  async delete(id: string): Promise<boolean> {
    try {
      const query = 'DELETE FROM articles WHERE id = ?';
      const result = await executeQuery<ResultSetHeader>(query, [id]);
      
      const deleted = result.affectedRows > 0;
      if (deleted) {
        logger.info(`Article deleted successfully: ${id}`);
      }
      
      return deleted;
    } catch (error) {
      logger.error(`Error deleting article ${id}:`, error);
      throw error;
    }
  }

  /**
   * Count total articles
   */
  async count(): Promise<number> {
    try {
      const query = 'SELECT COUNT(*) as count FROM articles';
      const results = await executeQuery<RowDataPacket[]>(query);
      
      return results[0].count;
    } catch (error) {
      logger.error('Error counting articles:', error);
      throw error;
    }
  }

  /**
   * Find articles that need enhancement
   */
  async findUnenhanced(limit: number = 10): Promise<Article[]> {
    try {
      const query = `
        SELECT id, title, content, url, scraped_date, enhanced_content, 
               is_enhanced, word_count, reading_time, tags, created_at, updated_at
        FROM articles 
        WHERE is_enhanced = FALSE
        ORDER BY created_at ASC
        LIMIT ?
      `;

      const results = await executeQuery<RowDataPacket[]>(query, [limit]);
      
      return results.map(row => this.mapRowToArticle(row));
    } catch (error) {
      logger.error('Error finding unenhanced articles:', error);
      throw error;
    }
  }

  /**
   * Map database row to Article object
   */
  private mapRowToArticle(row: RowDataPacket): Article {
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      url: row.url,
      scrapedDate: new Date(row.scraped_date),
      enhancedContent: row.enhanced_content || undefined,
      isEnhanced: Boolean(row.is_enhanced),
      wordCount: row.word_count,
      readingTime: row.reading_time,
      tags: row.tags ? JSON.parse(row.tags) : [],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}