import fs from 'fs/promises';
import path from 'path';
import { executeQuery, executeTransaction } from './connection';
import { logger } from '../utils/logger';

interface Migration {
  version: string;
  description: string;
  sql: string;
}

/**
 * Create migrations table if it doesn't exist
 */
const createMigrationsTable = async (): Promise<void> => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      version VARCHAR(50) NOT NULL UNIQUE,
      description VARCHAR(255) NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_version (version)
    )
  `;
  
  await executeQuery(createTableQuery);
  logger.info('Migrations table created or verified');
};

/**
 * Get executed migrations
 */
const getExecutedMigrations = async (): Promise<string[]> => {
  try {
    const results = await executeQuery<any[]>('SELECT version FROM migrations ORDER BY executed_at');
    return results.map(row => row.version);
  } catch (error) {
    logger.warn('Could not fetch executed migrations, assuming none executed');
    return [];
  }
};

/**
 * Execute a single migration
 */
const executeMigration = async (migration: Migration): Promise<void> => {
  await executeTransaction(async (connection) => {
    // Execute the migration SQL
    const statements = migration.sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement);
      }
    }
    
    // Record the migration as executed
    await connection.execute(
      'INSERT INTO migrations (version, description) VALUES (?, ?)',
      [migration.version, migration.description]
    );
  });
  
  logger.info(`Migration ${migration.version} executed successfully: ${migration.description}`);
};

/**
 * Load migration from schema file
 */
const loadSchemaMigration = async (): Promise<Migration> => {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = await fs.readFile(schemaPath, 'utf-8');
  
  return {
    version: '001_initial_schema',
    description: 'Create initial database schema with articles, references, and enhancement_requests tables',
    sql
  };
};

/**
 * Run all pending migrations
 */
export const runMigrations = async (): Promise<void> => {
  try {
    logger.info('Starting database migrations...');
    
    // Create migrations table
    await createMigrationsTable();
    
    // Get executed migrations
    const executedMigrations = await getExecutedMigrations();
    
    // Load available migrations
    const migrations: Migration[] = [
      await loadSchemaMigration()
    ];
    
    // Execute pending migrations
    for (const migration of migrations) {
      if (!executedMigrations.includes(migration.version)) {
        await executeMigration(migration);
      } else {
        logger.info(`Migration ${migration.version} already executed, skipping`);
      }
    }
    
    logger.info('Database migrations completed successfully');
  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  }
};

/**
 * Check if migrations are up to date
 */
export const checkMigrationStatus = async (): Promise<boolean> => {
  try {
    const executedMigrations = await getExecutedMigrations();
    const availableMigrations = ['001_initial_schema']; // Add more as needed
    
    return availableMigrations.every(version => executedMigrations.includes(version));
  } catch (error) {
    logger.error('Failed to check migration status:', error);
    return false;
  }
};