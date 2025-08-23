import { Router } from 'express';
import { getMemoryDb } from '../memory.js';
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
    
    const memoryDb = getMemoryDb();
    
    // Ensure user exists
    let user = await memoryDb.getUser(user_id);
    if (!user) {
      user = await memoryDb.createUser(user_id);
    }
    
    // Store each response (idempotent behavior)
    for (const answer of answers) {
      const { qid, answer: userAnswer } = answer;
      
      // Check if response already exists (for idempotency)
      const exists = await memoryDb.getUserResponseExists(user_id, response_date, qid);
      if (!exists) {
        await memoryDb.saveUserResponse(user_id, response_date, qid, userAnswer);
      }
    }
    
    logger.info(`Stored ${answers.length} responses for user ${user_id} on ${response_date}`);
    res.json({ ok: true });
  } catch (error) {
    logger.error('Failed to store responses:', error);
    res.status(500).json({ ok: false, error: 'Failed to store responses' });
  }
});

export default router;
