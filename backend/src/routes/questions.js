import { Router } from 'express';
import supabaseService from '../services/supabaseService.js';
import logger from '../logger.js';

const router = Router();

// GET /api/questions - Get all questions
router.get('/', async (req, res) => {
  try {
    const questions = await supabaseService.getAllQuestions();
    
    const formattedQuestions = questions.map(q => ({
      id: q.id,
      prompt: q.prompt,
      type: q.type,
      options: q.options_json ? JSON.parse(q.options_json) : []
    }));
    
    res.json({ questions: formattedQuestions });
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
    
    const questionData = {
      prompt,
      type,
      options_json: JSON.stringify(options)
    };
    
    const result = await supabaseService.addQuestion(questionData);
    
    res.status(201).json({ 
      ok: true, 
      id: result.id 
    });
  } catch (error) {
    logger.error('Failed to create question:', error);
    res.status(500).json({ ok: false, error: 'Failed to create question' });
  }
});

export default router;
