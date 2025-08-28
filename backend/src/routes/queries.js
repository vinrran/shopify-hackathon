import { Router } from 'express';
import { getDb } from '../database.js';
import { generateSearchQueries } from '../services/falService.js';
import logger from '../logger.js';

const router = Router();

// POST /api/queries/generate - Generate search queries using Fal.ai
router.post('/generate', async (req, res) => {
  try {
    const { user_id, response_date, buyer_attributes, gender_affinity } = req.body;
    
    if (!user_id || !response_date) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Missing required fields' 
      });
    }
    
    const db = getDb();
    
    // Fetch today's responses
    const responses = await db.all(
      `SELECT ur.*, q.prompt, q.type, q.options_json
       FROM user_responses ur
       JOIN questions q ON ur.qid = q.id
       WHERE ur.user_id = ? AND ur.response_date = ?`,
      [user_id, response_date]
    );
    
    if (responses.length === 0) {
      return res.status(400).json({ 
        ok: false, 
        error: 'No responses found for this date' 
      });
    }
    
    // Format responses for Fal.ai
    const formattedResponses = {};
    for (const r of responses) {
      const answer = JSON.parse(r.answer_json);
      const prompt = r.prompt.toLowerCase().replace(/\s+/g, '_');
      formattedResponses[prompt] = answer;
    }
    
    // Generate queries using Fal.ai with buyer attributes for personalization
    const queries = await generateSearchQueries(formattedResponses, {
      buyerAttributes: buyer_attributes,
      genderAffinity: gender_affinity
    });
    
    // Store queries in database
    for (const query of queries) {
      await db.run(
        `INSERT INTO search_queries 
         (user_id, response_date, query, source) 
         VALUES (?, ?, ?, ?)`,
        [user_id, response_date, query, 'llm']
      );
    }
    
    logger.info(`Generated ${queries.length} search queries for user ${user_id}`);
    res.json({ queries });
  } catch (error) {
    logger.error('Failed to generate queries:', error);
    res.status(500).json({ ok: false, error: 'Failed to generate queries' });
  }
});

export default router;
