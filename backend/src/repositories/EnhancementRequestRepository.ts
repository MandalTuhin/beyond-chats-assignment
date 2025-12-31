import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { executeQuery } from '../database/connection';
import { 
  EnhancementRequest, 
  CreateEnhancementRequestData, 
  UpdateEnhancementRequestData,
  EnhancementStatus 
} from '../models/EnhancementRequest';
import { logger } from '../utils/logger';

export class EnhancementRequestRepository {
  /**
   * Create a new enhancement request
   */
  async create(data: CreateEnhancementRequestData): Promise<EnhancementRequest> {
    try {
      const query = `
        INSERT INTO enhancement_requests (article_id, enhancement_prompt)
        VALUES (?, ?)
      `;

      const params = [
        data.articleId,
        data.enhancementPrompt || null
      ];

      const result = await executeQuery<ResultSetHeader>(query, params);
      
      if (!result.insertId) {
        throw new Error('Failed to create enhancement request - no ID returned');
      }

      // Fetch the created enhancement request
      const createdRequest = await this.findById(result.insertId.toString());
      if (!createdRequest) {
        throw new Error('Failed to retrieve created enhancement request');
      }

      logger.info(`Enhancement request created successfully: ${createdRequest.id}`);
      return createdRequest;
    } catch (error) {
      logger.error('Error creating enhancement request:', error);
      throw error;
    }
  }

  /**
   * Find enhancement request by ID
   */
  async findById(id: string): Promise<EnhancementRequest | null> {
    try {
      const query = `
        SELECT id, article_id, status, enhancement_prompt, error_message, 
               created_at, updated_at
        FROM enhancement_requests 
        WHERE id = ?
      `;

      const results = await executeQuery<RowDataPacket[]>(query, [id]);
      
      if (results.length === 0) {
        return null;
      }

      return this.mapRowToEnhancementRequest(results[0]);
    } catch (error) {
      logger.error(`Error finding enhancement request by ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Find enhancement requests by article ID
   */
  async findByArticleId(articleId: string): Promise<EnhancementRequest[]> {
    try {
      const query = `
        SELECT id, article_id, status, enhancement_prompt, error_message, 
               created_at, updated_at
        FROM enhancement_requests 
        WHERE article_id = ?
        ORDER BY created_at DESC
      `;

      const results = await executeQuery<RowDataPacket[]>(query, [articleId]);
      
      return results.map(row => this.mapRowToEnhancementRequest(row));
    } catch (error) {
      logger.error(`Error finding enhancement requests for article ${articleId}:`, error);
      throw error;
    }
  }

  /**
   * Find enhancement requests by status
   */
  async findByStatus(status: EnhancementStatus, limit: number = 50): Promise<EnhancementRequest[]> {
    try {
      const query = `
        SELECT id, article_id, status, enhancement_prompt, error_message, 
               created_at, updated_at
        FROM enhancement_requests 
        WHERE status = ?
        ORDER BY created_at ASC
        LIMIT ?
      `;

      const results = await executeQuery<RowDataPacket[]>(query, [status, limit]);
      
      return results.map(row => this.mapRowToEnhancementRequest(row));
    } catch (error) {
      logger.error(`Error finding enhancement requests by status ${status}:`, error);
      throw error;
    }
  }

  /**
   * Update enhancement request
   */
  async update(id: string, data: UpdateEnhancementRequestData): Promise<EnhancementRequest | null> {
    try {
      const updates: string[] = [];
      const params: any[] = [];

      if (data.status !== undefined) {
        updates.push('status = ?');
        params.push(data.status);
      }

      if (data.enhancementPrompt !== undefined) {
        updates.push('enhancement_prompt = ?');
        params.push(data.enhancementPrompt);
      }

      if (data.errorMessage !== undefined) {
        updates.push('error_message = ?');
        params.push(data.errorMessage);
      }

      if (updates.length === 0) {
        throw new Error('No fields to update');
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      const query = `UPDATE enhancement_requests SET ${updates.join(', ')} WHERE id = ?`;
      
      const result = await executeQuery<ResultSetHeader>(query, params);
      
      if (result.affectedRows === 0) {
        return null;
      }

      // Return updated enhancement request
      const updatedRequest = await this.findById(id);
      if (updatedRequest) {
        logger.info(`Enhancement request updated successfully: ${id}`);
      }
      
      return updatedRequest;
    } catch (error) {
      logger.error(`Error updating enhancement request ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete enhancement request
   */
  async delete(id: string): Promise<boolean> {
    try {
      const query = 'DELETE FROM enhancement_requests WHERE id = ?';
      const result = await executeQuery<ResultSetHeader>(query, [id]);
      
      const deleted = result.affectedRows > 0;
      if (deleted) {
        logger.info(`Enhancement request deleted successfully: ${id}`);
      }
      
      return deleted;
    } catch (error) {
      logger.error(`Error deleting enhancement request ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get pending requests count
   */
  async getPendingCount(): Promise<number> {
    try {
      const query = 'SELECT COUNT(*) as count FROM enhancement_requests WHERE status = ?';
      const results = await executeQuery<RowDataPacket[]>(query, [EnhancementStatus.PENDING]);
      
      return results[0].count;
    } catch (error) {
      logger.error('Error counting pending enhancement requests:', error);
      throw error;
    }
  }

  /**
   * Map database row to EnhancementRequest object
   */
  private mapRowToEnhancementRequest(row: RowDataPacket): EnhancementRequest {
    return {
      id: row.id,
      articleId: row.article_id,
      status: row.status as EnhancementStatus,
      enhancementPrompt: row.enhancement_prompt || undefined,
      errorMessage: row.error_message || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}