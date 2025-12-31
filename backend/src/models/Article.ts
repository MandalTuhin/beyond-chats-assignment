import { z } from 'zod';

// Base Article interface
export interface Article {
  id: string;
  title: string;
  content: string;
  url: string;
  scrapedDate: Date;
  enhancedContent?: string;
  isEnhanced: boolean;
  wordCount: number;
  readingTime: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Article creation interface (without auto-generated fields)
export interface CreateArticleData {
  title: string;
  content: string;
  url: string;
  tags?: string[];
}

// Article update interface
export interface UpdateArticleData {
  title?: string;
  content?: string;
  enhancedContent?: string;
  tags?: string[];
}

// Zod schema for article validation
export const ArticleSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string()
    .min(1, 'Title is required')
    .max(500, 'Title must be less than 500 characters')
    .trim(),
  content: z.string()
    .min(10, 'Content must be at least 10 characters')
    .max(1000000, 'Content is too long'),
  url: z.string()
    .url('Invalid URL format')
    .max(1000, 'URL must be less than 1000 characters'),
  scrapedDate: z.date().optional(),
  enhancedContent: z.string()
    .max(1000000, 'Enhanced content is too long')
    .optional(),
  isEnhanced: z.boolean().default(false),
  wordCount: z.number().int().min(0).default(0),
  readingTime: z.number().int().min(0).default(0),
  tags: z.array(z.string().trim().min(1)).default([]),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Zod schema for creating articles
export const CreateArticleSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(500, 'Title must be less than 500 characters')
    .trim(),
  content: z.string()
    .min(10, 'Content must be at least 10 characters')
    .max(1000000, 'Content is too long'),
  url: z.string()
    .url('Invalid URL format')
    .max(1000, 'URL must be less than 1000 characters'),
  tags: z.array(z.string().trim().min(1)).default([]),
});

// Zod schema for updating articles
export const UpdateArticleSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(500, 'Title must be less than 500 characters')
    .trim()
    .optional(),
  content: z.string()
    .min(10, 'Content must be at least 10 characters')
    .max(1000000, 'Content is too long')
    .optional(),
  enhancedContent: z.string()
    .max(1000000, 'Enhanced content is too long')
    .optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
});

// Utility functions for article data
export const calculateWordCount = (content: string): number => {
  return content.trim().split(/\s+/).filter(word => word.length > 0).length;
};

export const calculateReadingTime = (wordCount: number): number => {
  // Average reading speed: 200 words per minute
  return Math.ceil(wordCount / 200);
};

export const sanitizeArticleContent = (content: string): string => {
  // Basic HTML sanitization - remove script tags and dangerous content
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};