import dotenv from 'dotenv';
import { initDatabase, getDb } from './database.js';
import logger from './logger.js';

dotenv.config();

// Sample questions for testing
const sampleQuestions = [
  {
    prompt: "How are you feeling today?",
    type: "single_choice",
    options: ["happy", "sad", "neutral", "excited", "stressed"]
  },
  {
    prompt: "What style are you looking for?",
    type: "single_choice",
    options: ["streetwear", "formal", "casual", "athletic", "vintage", "minimalist"]
  },
  {
    prompt: "What colors do you prefer?",
    type: "multi_choice",
    options: ["black", "white", "blue", "red", "green", "yellow", "purple", "gray", "brown"]
  },
  {
    prompt: "What's your budget range?",
    type: "single_choice",
    options: ["under $50", "$50-$100", "$100-$200", "$200-$500", "over $500"]
  },
  {
    prompt: "What occasion are you shopping for?",
    type: "single_choice",
    options: ["everyday wear", "work", "party", "gym", "outdoor", "special event"]
  },
  {
    prompt: "What's your preferred fit?",
    type: "single_choice",
    options: ["slim fit", "regular fit", "loose fit", "oversized", "tailored"]
  }
];

async function seedDatabase() {
  try {
    await initDatabase();
    const db = getDb();
    
    logger.info('Seeding database with sample questions...');
    
    for (const question of sampleQuestions) {
      const existing = await db.get(
        'SELECT id FROM questions WHERE prompt = ?',
        [question.prompt]
      );
      
      if (!existing) {
        await db.run(
          'INSERT INTO questions (prompt, type, options_json) VALUES (?, ?, ?)',
          [question.prompt, question.type, JSON.stringify(question.options)]
        );
        logger.info(`Added question: ${question.prompt}`);
      } else {
        logger.info(`Question already exists: ${question.prompt}`);
      }
    }
    
    logger.info('Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Failed to seed database:', error);
    process.exit(1);
  }
}

seedDatabase();
