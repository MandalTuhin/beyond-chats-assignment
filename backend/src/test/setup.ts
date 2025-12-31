// Test setup for backend
// This file will be expanded in subsequent tasks

import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Global test setup
beforeAll(() => {
  // Setup test database connection, etc.
});

afterAll(() => {
  // Cleanup test resources
});