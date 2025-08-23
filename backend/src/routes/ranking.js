import { Router } from 'express';
import { getMemoryDb } from '../memory.js';
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
    
    const memoryDb = getMemoryDb();
    
    // Get today's responses
    const userResponses = await memoryDb.getUserResponses(user_id, response_date);
    
    // Format today's responses - need to join with questions
    const formattedTodayResponses = {};
    for (const response of userResponses) {
      const question = await memoryDb.getQuestion(response.qid);
      if (question) {
        const prompt = question.prompt.toLowerCase().replace(/\s+/g, '_');
        formattedTodayResponses[prompt] = response.answer;
      }
    }

    // Get products and vision data
    const products = await memoryDb.getAllProducts(user_id, response_date);
    const visionData = await memoryDb.getProductVisionData(user_id, response_date);
    
    // Create a map of vision data by product_id
    const visionByProduct = new Map();
    visionData.forEach(v => {
      visionByProduct.set(v.product_id, v);
    });
    
    // Format products for ranking
    const formattedProducts = products.map(p => {
      const vision = visionByProduct.get(p.product_id) || {};
      return {
        product_id: p.product_id,
        title: p.title,
        vendor: p.vendor,
        price: p.price,
        currency: p.currency,
        url: p.url,
        tags: vision.tags || [],
        caption: vision.caption || '',
        attributes: vision.attributes || {}
      };
    });
    

    
    // Get ranking from Fal.ai using user inputs and vision data
    const rankedProducts = await rankProducts({
      todayResponses: formattedTodayResponses,
      todayQueries: [], // No longer used - ranking uses user inputs + vision data directly
      products: formattedProducts
    });
    
    // Store new rankings in memory (this automatically clears existing ones)
    await memoryDb.saveRankedProducts(user_id, response_date, rankedProducts, 1);
    
    logger.info(`Built ranking of ${rankedProducts.length} products for user ${user_id}`);
    
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
    
    const memoryDb = getMemoryDb();
    
    // Get ranked products (always use context version 1 for simplicity)
    const rankings = await memoryDb.getRankedProducts(user_id, response_date, 1);
    
    // Get all products to join with rankings
    const allProducts = await memoryDb.getAllProducts(user_id, response_date);
    const productMap = new Map(allProducts.map(p => [p.product_id, p]));
    
    // Apply pagination and join with product data
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedRankings = rankings.slice(startIndex, endIndex);
    
    const rankedProducts = paginatedRankings.map(ranking => {
      const product = productMap.get(ranking.product_id) || {};
      return {
        ...ranking,
        title: product.title,
        vendor: product.vendor,
        price: product.price,
        currency: product.currency,
        url: product.url,
        thumbnail_url: product.thumbnail_url
      };
    });
    
    res.json({
      products: rankedProducts,
      total: rankings.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
      context_version: 1
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
    
    const memoryDb = getMemoryDb();
    
    // Get next context version (increment from current max)
    const existingRankings = await memoryDb.getRankedProducts(user_id, response_date, 1);
    const nextVersion = 2; // Simple increment for replenish
    
    // Get all products and filter out excluded ones
    const allProducts = await memoryDb.getAllProducts(user_id, response_date);
    const visionData = await memoryDb.getProductVisionData(user_id, response_date);
    
    // Create vision map
    const visionByProduct = new Map();
    visionData.forEach(v => {
      visionByProduct.set(v.product_id, v);
    });
    
    // Filter products excluding the ones already seen
    const excludeSet = new Set(exclude_product_ids);
    const products = allProducts.filter(p => !excludeSet.has(p.product_id));
    
    if (products.length === 0) {
      return res.json({ added: 0 });
    }
    
    // Get context data for ranking - format responses
    const formattedTodayResponses = {};
    for (const response of userResponses) {
      const question = await memoryDb.getQuestion(response.qid);
      if (question) {
        const prompt = question.prompt.toLowerCase().replace(/\s+/g, '_');
        formattedTodayResponses[prompt] = response.answer;
      }
    }
    
    // Get search queries
    const searchQueries = await memoryDb.getSearchQueries(user_id, response_date);
    
    // Format products with vision data
    const formattedProducts = products.map(p => {
      const vision = visionByProduct.get(p.product_id) || {};
      return {
        product_id: p.product_id,
        title: p.title,
        vendor: p.vendor,
        price: p.price,
        tags: vision.tags || [],
        caption: vision.caption || '',
        attributes: vision.attributes || {}
      };
    });
    
    // Get new ranking with negative context
    const rankedProducts = await rankProducts({
      todayResponses: formattedTodayResponses,
      todayQueries: searchQueries.map(q => q.query),
      pastDays: { responses: [], queries: [] },
      products: formattedProducts,
      excludeProductIds: exclude_product_ids
    });
    
    // Store new rankings with incremented version
    await memoryDb.saveRankedProducts(user_id, response_date, rankedProducts, nextVersion);
    
    logger.info(`Added ${rankedProducts.length} new products to ranking for user ${user_id}`);
    res.json({ added: rankedProducts.length });
  } catch (error) {
    logger.error('Failed to replenish ranking:', error);
    res.status(500).json({ ok: false, error: 'Failed to replenish ranking' });
  }
});

export default router;
