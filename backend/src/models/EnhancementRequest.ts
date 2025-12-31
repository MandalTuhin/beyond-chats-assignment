import { z } from 'zod';

// Enhancement request status enum
export enum EnhancementStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// Enhancement request interface
export interface EnhancementRequest {
  id: string;
  articleId: string;
  status: EnhancementStatus;
  enhancementPrompt?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Enhancement request creation interface
export interface CreateEnhancementRequestData {
  articleId: string;
  enhancementPrompt?: string;
}

// Enhancement request update interface
export interface UpdateEnhancementRequestData {
  status?: EnhancementStatus;
  enhancementPrompt?: string;
  errorMessage?: string;
}

// Zod schema for enhancement request validation
export const EnhancementRequestSchema = z.object({
  id: z.string().uuid().optional(),
  articleId: z.string().uuid('Invalid article ID format'),
  status: z.nativeEnum(EnhancementStatus).default(EnhancementStatus.PENDING),
  enhancementPrompt: z.string()
    .max(10000, 'Enhancement prompt is too long')
    .optional(),
  errorMessage: z.string()
    .max(5000, 'Error message is too long')
    .optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Zod schema for creating enhancement requests
export const CreateEnhancementRequestSchema = z.object({
  articleId: z.string().uuid('Invalid article ID format'),
  enhancementPrompt: z.string()
    .max(10000, 'Enhancement prompt is too long')
    .optional(),
});

// Zod schema for updating enhancement requests
export const UpdateEnhancementRequestSchema = z.object({
  status: z.nativeEnum(EnhancementStatus).optional(),
  enhancementPrompt: z.string()
    .max(10000, 'Enhancement prompt is too long')
    .optional(),
  errorMessage: z.string()
    .max(5000, 'Error message is too long')
    .optional(),
});