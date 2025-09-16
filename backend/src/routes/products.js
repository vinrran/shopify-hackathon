import { Router } from 'express';
import supabaseService from '../services/supabaseService.js';
import logger from '../logger.js';

const router = Router();

// Helper function to store products
async function storeProducts(userId, responseDate, source, results) {
  try {
    // Store all products in batch
    const storedProducts = await supabaseService.storeProducts(userId, responseDate, source, results);
    return storedProducts.length;
  } catch (error) {
    logger.error('Failed to store products:', error);
    throw error;
  }
}

// POST /api/products/store - Store search results
router.post('/store', async (req, res) => {
  try {
    const { user_id, response_date, source, results } = req.body;
    
    if (!user_id || !response_date || !source || !results || !Array.isArray(results)) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Missing required fields' 
      });
    }
    
    if (source !== 'search') {
      return res.status(400).json({ 
        ok: false, 
        error: 'Invalid source. Use /api/products/store for search results' 
      });
    }
    
    const storedCount = await storeProducts(user_id, response_date, source, results);
    
    logger.info(`Stored ${storedCount} search products for user ${user_id}`);
    res.json({ ok: true, stored: storedCount });
  } catch (error) {
    logger.error('Failed to store products:', error);
    res.status(500).json({ ok: false, error: 'Failed to store products' });
  }
});

// POST /api/products/recommended/store - Store recommended products
router.post('/recommended/store', async (req, res) => {
  try {
    const { user_id, response_date, results } = req.body;
    
    if (!user_id || !response_date || !results || !Array.isArray(results)) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Missing required fields' 
      });
    }
    
    const storedCount = await storeProducts(user_id, response_date, 'recommended', results);
    
    logger.info(`Stored ${storedCount} recommended products for user ${user_id}`);
    res.json({ ok: true, stored: storedCount });
  } catch (error) {
    logger.error('Failed to store recommended products:', error);
    res.status(500).json({ ok: false, error: 'Failed to store products' });
  }
});

export default router;
