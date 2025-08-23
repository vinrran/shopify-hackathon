import { Router } from 'express';
import { getMemoryDb } from '../memory.js';
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
    
    const memoryDb = getMemoryDb();
    
    // Fetch today's responses
    const userResponses = await memoryDb.getUserResponses(user_id, response_date);
    
    if (userResponses.length === 0) {
      return res.status(400).json({ 
        ok: false, 
        error: 'No responses found for this date' 
      });
    }
    
    // Format responses for Fal.ai - need to join with questions
    const formattedResponses = {};
    for (const response of userResponses) {
      const question = await memoryDb.getQuestion(response.qid);
      if (question) {
        const prompt = question.prompt.toLowerCase().replace(/\s+/g, '_');
        formattedResponses[prompt] = response.answer;
      }
    }
    
    // Generate queries using Fal.ai with buyer attributes for personalization
    const queries = await generateSearchQueries(formattedResponses, {
      buyerAttributes: buyer_attributes,
      genderAffinity: gender_affinity
    });
    
    // Store queries in memory
    for (const query of queries) {
      await memoryDb.saveSearchQuery(user_id, response_date, query, 'llm');
    }
    
    logger.info(`Generated ${queries.length} search queries for user ${user_id}`);
    res.json({ queries });
  } catch (error) {
    logger.error('Failed to generate queries:', error);
    res.status(500).json({ ok: false, error: 'Failed to generate queries' });
  }
});

export default router;
