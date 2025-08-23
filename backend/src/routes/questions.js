import { Router } from 'express';
import { getMemoryDb } from '../memory.js';
import logger from '../logger.js';

const router = Router();

// GET /api/questions - Get all questions
router.get('/', async (req, res) => {
  try {
    const memoryDb = getMemoryDb();
    const questions = await memoryDb.getAllQuestions();
    
    res.json({ questions });
  } catch (error) {
    logger.error('Failed to fetch questions:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch questions' });
  }
});

// POST /api/questions - Add new question (admin)
router.post('/', async (req, res) => {
  try {
    const { prompt, type, options } = req.body;
    
    if (!prompt || !type || !options || !Array.isArray(options)) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Invalid question data' 
      });
    }
    
    if (!['single_choice', 'multi_choice'].includes(type)) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Invalid question type' 
      });
    }
    
    const memoryDb = getMemoryDb();
    const newQuestion = await memoryDb.createQuestion(prompt, type, options);
    
    res.status(201).json({ 
      ok: true, 
      id: newQuestion.id 
    });
  } catch (error) {
    logger.error('Failed to create question:', error);
    res.status(500).json({ ok: false, error: 'Failed to create question' });
  }
});

export default router;
