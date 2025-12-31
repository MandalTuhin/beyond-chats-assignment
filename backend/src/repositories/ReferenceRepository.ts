import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { executeQuery } from '../database/connection';
import { Reference, CreateReferenceData } from '../models/Reference';
import { logger } from '../utils/logger';

export class ReferenceRepository {
  /**
   * Create a new reference
   */
  async create(data: CreateReferenceData): Promise<Reference> {
    try {
      const query = `
        INSERT INTO references (article_id, url, title, content, relevance_score)
        VALUES (?, ?, ?, ?, ?)
      `;

      const params = [
        data.articleId,
        data.url,
        data.title.trim(),
        data.content,
        data.relevanceScore || 0
      ];

      const result = await executeQuery<ResultSetHeader>(query, params);
      
      if (!result.insertId) {
        throw new Error('Failed to create reference - no ID returned');
      }

      // Fetch the created reference
      const createdReference = await this.findById(result.insertId.toString());
      if (!createdReference) {
        throw new Error('Failed to retrieve created reference');
      }

      logger.info(`Reference created successfully: ${createdReference.id}`);
      return createdReference;
    } catch (error) {
      logger.error('Error creating reference:', error);
      throw error;
    }
  }

  /**
   * Find reference by ID
   */
  async findById(id: string): Promise<Reference | null> {
    try {
      const query = `
        SELECT id, article_id, url, title, content, scraped_date, 
               relevance_score, created_at
        FROM references 
        WHERE id = ?
      `;

      const results = await executeQuery<RowDataPacket[]>(query, [id]);
      
      if (results.length === 0) {
        return null;
      }

      return this.mapRowToReference(results[0]);
    } catch (error) {
      logger.error(`Error finding reference by ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Find references by article ID
   */
  async findByArticleId(articleId: string): Promise<Reference[]> {
    try {
      const query = `
        SELECT id, article_id, url, title, content, scraped_date, 
               relevance_score, created_at
        FROM references 
        WHERE article_id = ?
        ORDER BY relevance_score DESC, created_at DESC
      `;

      const results = await executeQuery<RowDataPacket[]>(query, [articleId]);
      
      return results.map(row => this.mapRowToReference(row));
    } catch (error) {
      logger.error(`Error finding references for article ${articleId}:`, error);
      throw error;
    }
  }

  /**
   * Delete reference
   */
  async delete(id: string): Promise<boolean> {
    try {
      const query = 'DELETE FROM references WHERE id = ?';
      const result = await executeQuery<ResultSetHeader>(query, [id]);
      
      const deleted = result.affectedRows > 0;
      if (deleted) {
        logger.info(`Reference deleted successfully: ${id}`);
      }
      
      return deleted;
    } catch (error) {
      logger.error(`Error deleting reference ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete all references for an article
   */
  async deleteByArticleId(articleId: string): Promise<number> {
    try {
      const query = 'DELETE FROM references WHERE article_id = ?';
      const result = await executeQuery<ResultSetHeader>(query, [articleId]);
      
      logger.info(`Deleted ${result.affectedRows} references for article ${articleId}`);
      return result.affectedRows;
    } catch (error) {
      logger.error(`Error deleting references for article ${articleId}:`, error);
      throw error;
    }
  }

  /**
   * Update relevance score
   */
  async updateRelevanceScore(id: string, score: number): Promise<boolean> {
    try {
      const query = 'UPDATE references SET relevance_score = ? WHERE id = ?';
      const result = await executeQuery<ResultSetHeader>(query, [score, id]);
      
      const updated = result.affectedRows > 0;
      if (updated) {
        logger.info(`Reference relevance score updated: ${id} -> ${score}`);
      }
      
      return updated;
    } catch (error) {
      logger.error(`Error updating reference relevance score ${id}:`, error);
      throw error;
    }
  }

  /**
   * Map database row to Reference object
   */
  private mapRowToReference(row: RowDataPacket): Reference {
    return {
      id: row.id,
      articleId: row.article_id,
      url: row.url,
      title: row.title,
      content: row.content,
      scrapedDate: new Date(row.scraped_date),
      relevanceScore: parseFloat(row.relevance_score),
      createdAt: new Date(row.created_at),
    };
  }
}