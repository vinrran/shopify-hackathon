import { Router } from 'express';
import { getDb } from '../database.js';
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
    
    const db = getDb();
    
    // Ensure user exists
    await db.run(
      'INSERT OR IGNORE INTO users (id) VALUES (?)',
      [user_id]
    );
    
    // Store each response (idempotent with REPLACE)
    for (const answer of answers) {
      const { qid, answer: userAnswer } = answer;
      const answerJson = JSON.stringify(userAnswer);
      
      await db.run(
        `INSERT OR REPLACE INTO user_responses 
         (user_id, response_date, qid, answer_json) 
         VALUES (?, ?, ?, ?)`,
        [user_id, response_date, qid, answerJson]
      );
    }
    
    logger.info(`Stored ${answers.length} responses for user ${user_id} on ${response_date}`);
    res.json({ ok: true });
  } catch (error) {
    logger.error('Failed to store responses:', error);
    res.status(500).json({ ok: false, error: 'Failed to store responses' });
  }
});

export default router;
