import dotenv from 'dotenv';
import { initMemoryStorage, getMemoryDb } from './memory.js';
import logger from './logger.js';

dotenv.config();

// Note: Sample questions are now automatically seeded in memory.js during initialization
// This file is kept for consistency but no longer needed for seeding

async function seedMemoryStorage() {
  try {
    await initMemoryStorage();
    const memoryDb = getMemoryDb();
    
    logger.info('Memory storage initialized with default questions');
    
    // Display current questions for verification
    const questions = await memoryDb.getAllQuestions();
    logger.info(`Questions available: ${questions.length}`);
    questions.forEach(q => {
      logger.info(`- ${q.prompt} (${q.type})`);
    });
    
    // Display memory stats
    const stats = memoryDb.getStats();
    logger.info('Memory storage stats:', stats);
    
    logger.info('Memory storage seeding completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Failed to seed memory storage:', error);
    process.exit(1);
  }
}

seedMemoryStorage();
