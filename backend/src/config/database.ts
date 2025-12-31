import dotenv from 'dotenv';

dotenv.config();

export const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'appuser',
  password: process.env.DB_PASSWORD || 'apppassword',
  database: process.env.DB_NAME || 'beyondchats_articles',
};

export const validateDatabaseConfig = (): void => {
  const requiredFields = ['host', 'port', 'user', 'password', 'database'];
  
  for (const field of requiredFields) {
    if (!config[field as keyof typeof config]) {
      throw new Error(`Database configuration missing: ${field}`);
    }
  }
};