// Shared utilities and types
// This file will be implemented in subsequent tasks

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
}

export interface Reference {
  id: string;
  url: string;
  title: string;
  content: string;
  scrapedDate: Date;
  relevanceScore: number;
}

export interface EnhancementRequest {
  articleId: string;
  originalContent: string;
  references: Reference[];
  enhancementPrompt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

console.log('BeyondChats Article System Shared - Types and utilities ready');