import { Router } from 'express';
import supabaseService from '../services/supabaseService.js';
import logger from '../logger.js';

const router = Router();

// POST /api/responses - Store user responses (idempotent)
router.post('/', async (req, res) => {
  try {
    const { user_id, response_date, answers } = req.body;
    
    if (!user_id || !response_date || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Missing required fields' 
      });
    }
    
    // Store each response
    for (const answer of answers) {
      const { qid, answer: userAnswer } = answer;
      await supabaseService.storeUserResponse(user_id, {
        qid,
        response_value: userAnswer,
        response_date
      });
    }
    
    logger.info(`Stored ${answers.length} responses for user ${user_id} on ${response_date}`);
    res.json({ ok: true });
  } catch (error) {
    logger.error('Failed to store responses:', error);
    res.status(500).json({ ok: false, error: 'Failed to store responses' });
  }
});

export default router;
