import { Router } from 'express';
import memoryStorage from '../memoryStorage.js';
import { rankProducts } from '../services/falService.js';
import logger from '../logger.js';

const router = Router();

// POST /api/ranking/build - Build top ranking
router.post('/build', async (req, res) => {
  try {
    const { user_id, response_date } = req.body;
    
    if (!user_id || !response_date) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Missing required fields' 
      });
    }
    
    // Get today's responses
    const todayResponses = memoryStorage.getUserResponses(user_id, response_date);
    
    // Format today's responses
    const formattedTodayResponses = {};
    for (const r of todayResponses) {
      const prompt = r.prompt.toLowerCase().replace(/\s+/g, '_');
      formattedTodayResponses[prompt] = JSON.parse(r.answer_json);
    }

    
    // Get all products (no vision data needed)
    const products = memoryStorage.getProducts(user_id, response_date);
    
    // Format products for ranking (simple format without vision data)
    const formattedProducts = products.map(p => ({
      product_id: p.product_id,
      title: p.title,
      vendor: p.vendor,
      price: p.price,
      currency: p.currency,
      url: p.url
    }));
    

    
    // Get all products without LLM ranking
    const rankedProducts = await rankProducts({
      todayResponses: formattedTodayResponses,
      todayQueries: [], // Not used anymore
      products: formattedProducts
    });
    
    // Clear existing rankings for this date
    memoryStorage.clearRankedProducts(user_id, response_date);
    
    // Store new rankings
    for (let i = 0; i < rankedProducts.length; i++) {
      const ranked = rankedProducts[i];
      memoryStorage.storeRankedProduct(
        user_id,
        response_date,
        i + 1,
        ranked.product_id,
        ranked.score,
        ranked.reason,
        1
      );
    }
    
    logger.info(`Built product list of ${rankedProducts.length} products for user ${user_id} (no LLM ranking)`);
    
    res.json({
      top: rankedProducts.map((p, i) => ({
        rank: i + 1,
        product_id: p.product_id,
        score: p.score,
        reason: p.reason
      }))
    });
  } catch (error) {
    logger.error('Failed to build ranking:', error);
    res.status(500).json({ ok: false, error: 'Failed to build ranking' });
  }
});

// GET /api/ranking - Get ranked products
router.get('/', async (req, res) => {
  try {
    const { user_id, response_date, limit = 50, offset = 0 } = req.query;
    
    if (!user_id || !response_date) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Missing required parameters' 
      });
    }
    
    // Get latest context version
    const contextVersion = memoryStorage.getMaxContextVersion(user_id, response_date) || 1;
    
    // Get ranked products with pagination
    const rankedProducts = memoryStorage.getRankedProducts(user_id, response_date, parseInt(limit), parseInt(offset));
    
    res.json({
      products: rankedProducts,
      total: rankedProducts.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
      context_version: contextVersion
    });
  } catch (error) {
    logger.error('Failed to get ranking:', error);
    res.status(500).json({ ok: false, error: 'Failed to get ranking' });
  }
});

// POST /api/ranking/replenish - Get new products excluding seen ones
router.post('/replenish', async (req, res) => {
  try {
    const { user_id, response_date, exclude_product_ids, past_days = 5 } = req.body;
    
    if (!user_id || !response_date || !exclude_product_ids || !Array.isArray(exclude_product_ids)) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Missing required fields' 
      });
    }
    
    // Get current max context version
    const maxVersion = memoryStorage.getMaxContextVersion(user_id, response_date);
    const nextVersion = (maxVersion || 0) + 1;
    
    // Get all products except excluded ones
    const products = memoryStorage.getProductsExcluding(user_id, response_date, exclude_product_ids);
    
    if (products.length === 0) {
      return res.json({ added: 0 });
    }
    
    // Get context data for ranking
    const todayResponses = memoryStorage.getUserResponses(user_id, response_date);
    
    const formattedTodayResponses = {};
    for (const r of todayResponses) {
      const prompt = r.prompt.toLowerCase().replace(/\s+/g, '_');
      formattedTodayResponses[prompt] = JSON.parse(r.answer_json);
    }
    
    const todayQueries = memoryStorage.getSearchQueries(user_id, response_date);
    
    // Format products (simple format without vision data)
    const formattedProducts = products.map(p => ({
      product_id: p.product_id,
      title: p.title,
      vendor: p.vendor,
      price: p.price,
      currency: p.currency,
      url: p.url
    }));
    
    // Get all products without LLM ranking
    const rankedProducts = await rankProducts({
      todayResponses: formattedTodayResponses,
      todayQueries: todayQueries.map(q => q.query),
      pastDays: { responses: [], queries: [] },
      products: formattedProducts,
      excludeProductIds: exclude_product_ids
    });
    
    // Store new rankings with incremented version
    const baseRank = memoryStorage.getMaxRankForVersion(user_id, response_date, nextVersion - 1) + 1;
    
    for (let i = 0; i < rankedProducts.length; i++) {
      const ranked = rankedProducts[i];
      memoryStorage.storeRankedProduct(
        user_id,
        response_date,
        baseRank + i,
        ranked.product_id,
        ranked.score,
        ranked.reason,
        nextVersion
      );
    }
    
    logger.info(`Added ${rankedProducts.length} new products to list for user ${user_id} (no LLM ranking)`);
    res.json({ added: rankedProducts.length });
  } catch (error) {
    logger.error('Failed to replenish ranking:', error);
    res.status(500).json({ ok: false, error: 'Failed to replenish ranking' });
  }
});

export default router;
