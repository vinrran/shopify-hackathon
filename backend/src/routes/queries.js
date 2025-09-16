import { Router } from 'express';
import supabaseService from '../services/supabaseService.js';
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
    
    // Fetch today's responses
    const responses = await supabaseService.getUserResponses(user_id, response_date);
    
    if (responses.length === 0) {
      return res.status(400).json({ 
        ok: false, 
        error: 'No responses found for this date' 
      });
    }
    
    // Format responses for Fal.ai
    const formattedResponses = {};
    for (const r of responses) {
      const answer = r.response_value;
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
      await supabaseService.storeSearchQuery(user_id, {
        query_text: query,
        response_date
      });
    }
    
    logger.info(`Generated ${queries.length} search queries for user ${user_id}`);
    res.json({ queries });
  } catch (error) {
    logger.error('Failed to generate queries:', error);
    res.status(500).json({ ok: false, error: 'Failed to generate queries' });
  }
});

export default router;
