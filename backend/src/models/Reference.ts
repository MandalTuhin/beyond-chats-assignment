import { z } from 'zod';

// Reference interface
export interface Reference {
  id: string;
  articleId: string;
  url: string;
  title: string;
  content: string;
  scrapedDate: Date;
  relevanceScore: number;
  createdAt: Date;
}

// Reference creation interface
export interface CreateReferenceData {
  articleId: string;
  url: string;
  title: string;
  content: string;
  relevanceScore?: number;
}

// Zod schema for reference validation
export const ReferenceSchema = z.object({
  id: z.string().uuid().optional(),
  articleId: z.string().uuid('Invalid article ID format'),
  url: z.string()
    .url('Invalid URL format')
    .max(1000, 'URL must be less than 1000 characters'),
  title: z.string()
    .min(1, 'Title is required')
    .max(500, 'Title must be less than 500 characters')
    .trim(),
  content: z.string()
    .min(10, 'Content must be at least 10 characters')
    .max(1000000, 'Content is too long'),
  scrapedDate: z.date().optional(),
  relevanceScore: z.number()
    .min(0, 'Relevance score must be between 0 and 1')
    .max(1, 'Relevance score must be between 0 and 1')
    .default(0),
  createdAt: z.date().optional(),
});

// Zod schema for creating references
export const CreateReferenceSchema = z.object({
  articleId: z.string().uuid('Invalid article ID format'),
  url: z.string()
    .url('Invalid URL format')
    .max(1000, 'URL must be less than 1000 characters'),
  title: z.string()
    .min(1, 'Title is required')
    .max(500, 'Title must be less than 500 characters')
    .trim(),
  content: z.string()
    .min(10, 'Content must be at least 10 characters')
    .max(1000000, 'Content is too long'),
  relevanceScore: z.number()
    .min(0, 'Relevance score must be between 0 and 1')
    .max(1, 'Relevance score must be between 0 and 1')
    .default(0),
});