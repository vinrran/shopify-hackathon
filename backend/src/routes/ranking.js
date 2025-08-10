import { Router } from 'express';
import { getDb } from '../database.js';
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
    
    const db = getDb();
    
    // Get today's responses
    const todayResponses = await db.all(
      `SELECT ur.*, q.prompt
       FROM user_responses ur
       JOIN questions q ON ur.qid = q.id
       WHERE ur.user_id = ? AND ur.response_date = ?`,
      [user_id, response_date]
    );
    
    // Format today's responses
    const formattedTodayResponses = {};
    for (const r of todayResponses) {
      const prompt = r.prompt.toLowerCase().replace(/\s+/g, '_');
      formattedTodayResponses[prompt] = JSON.parse(r.answer_json);
    }

    
    // Get products with vision data
    const products = await db.all(
      `SELECT DISTINCT 
         p.product_id,
         p.title,
         p.vendor,
         p.price,
         p.currency,
         p.url,
         p.thumbnail_url,
         pvd.caption,
         pvd.tags_json,
         pvd.attributes_json
       FROM products p
       LEFT JOIN product_vision_data pvd 
         ON p.user_id = pvd.user_id 
         AND p.response_date = pvd.response_date 
         AND p.product_id = pvd.product_id
       WHERE p.user_id = ? AND p.response_date = ?`,
      [user_id, response_date]
    );
    
    // Format products for ranking
    const formattedProducts = products.map(p => ({
      product_id: p.product_id,
      title: p.title,
      vendor: p.vendor,
      price: p.price,
      currency: p.currency,
      url: p.url,
      tags: p.tags_json ? JSON.parse(p.tags_json) : [],
      caption: p.caption,
      attributes: p.attributes_json ? JSON.parse(p.attributes_json) : {}
    }));
    

    
    // Get ranking from Fal.ai using user inputs and vision data
    const rankedProducts = await rankProducts({
      todayResponses: formattedTodayResponses,
      todayQueries: [], // No longer used - ranking uses user inputs + vision data directly
      products: formattedProducts
    });
    
    // Clear existing rankings for this date
    await db.run(
      'DELETE FROM ranked_products WHERE user_id = ? AND response_date = ?',
      [user_id, response_date]
    );
    
    // Store new rankings
    for (let i = 0; i < rankedProducts.length; i++) {
      const ranked = rankedProducts[i];
      await db.run(
        `INSERT INTO ranked_products 
         (user_id, response_date, rank, product_id, score, reason, context_version)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          user_id,
          response_date,
          i + 1,
          ranked.product_id,
          ranked.score,
          ranked.reason,
          1
        ]
      );
    }
    
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
    
    const db = getDb();
    
    // Get latest context version
    const maxVersion = await db.get(
      `SELECT MAX(context_version) as max_version 
       FROM ranked_products 
       WHERE user_id = ? AND response_date = ?`,
      [user_id, response_date]
    );
    
    const contextVersion = maxVersion?.max_version || 1;
    
    // Get ranked products with pagination
    const rankedProducts = await db.all(
      `SELECT rp.*, p.title, p.vendor, p.price, p.currency, p.url, p.thumbnail_url
       FROM ranked_products rp
       JOIN products p ON rp.product_id = p.product_id 
         AND rp.user_id = p.user_id 
         AND rp.response_date = p.response_date
       WHERE rp.user_id = ? 
         AND rp.response_date = ?
         AND rp.context_version = ?
       ORDER BY rp.rank
       LIMIT ? OFFSET ?`,
      [user_id, response_date, contextVersion, limit, offset]
    );
    
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
    
    const db = getDb();
    
    // Get current max context version
    const maxVersion = await db.get(
      `SELECT MAX(context_version) as max_version 
       FROM ranked_products 
       WHERE user_id = ? AND response_date = ?`,
      [user_id, response_date]
    );
    
    const nextVersion = (maxVersion?.max_version || 0) + 1;
    
    // Get all products except excluded ones
    const placeholders = exclude_product_ids.map(() => '?').join(',');
    const products = await db.all(
      `SELECT DISTINCT 
         p.product_id,
         p.title,
         p.vendor,
         p.price,
         p.currency,
         p.url,
         p.thumbnail_url,
         pvd.caption,
         pvd.tags_json,
         pvd.attributes_json
       FROM products p
       LEFT JOIN product_vision_data pvd 
         ON p.user_id = pvd.user_id 
         AND p.response_date = pvd.response_date 
         AND p.product_id = pvd.product_id
       WHERE p.user_id = ? 
         AND p.response_date = ?
         AND p.product_id NOT IN (${placeholders})`,
      [user_id, response_date, ...exclude_product_ids]
    );
    
    if (products.length === 0) {
      return res.json({ added: 0 });
    }
    
    // Get context data for ranking
    const todayResponses = await db.all(
      `SELECT ur.*, q.prompt
       FROM user_responses ur
       JOIN questions q ON ur.qid = q.id
       WHERE ur.user_id = ? AND ur.response_date = ?`,
      [user_id, response_date]
    );
    
    const formattedTodayResponses = {};
    for (const r of todayResponses) {
      const prompt = r.prompt.toLowerCase().replace(/\s+/g, '_');
      formattedTodayResponses[prompt] = JSON.parse(r.answer_json);
    }
    
    const todayQueries = await db.all(
      `SELECT query FROM search_queries 
       WHERE user_id = ? AND response_date = ?`,
      [user_id, response_date]
    );
    
    // Format products
    const formattedProducts = products.map(p => ({
      product_id: p.product_id,
      title: p.title,
      vendor: p.vendor,
      price: p.price,
      tags: p.tags_json ? JSON.parse(p.tags_json) : [],
      caption: p.caption,
      attributes: p.attributes_json ? JSON.parse(p.attributes_json) : {}
    }));
    
    // Get new ranking with negative context
    const rankedProducts = await rankProducts({
      todayResponses: formattedTodayResponses,
      todayQueries: todayQueries.map(q => q.query),
      pastDays: { responses: [], queries: [] },
      products: formattedProducts,
      excludeProductIds: exclude_product_ids
    });
    
    // Store new rankings with incremented version
    let startRank = await db.get(
      `SELECT MAX(rank) as max_rank 
       FROM ranked_products 
       WHERE user_id = ? AND response_date = ? AND context_version = ?`,
      [user_id, response_date, nextVersion - 1]
    );
    
    const baseRank = (startRank?.max_rank || 0) + 1;
    
    for (let i = 0; i < rankedProducts.length; i++) {
      const ranked = rankedProducts[i];
      await db.run(
        `INSERT INTO ranked_products 
         (user_id, response_date, rank, product_id, score, reason, context_version)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          user_id,
          response_date,
          baseRank + i,
          ranked.product_id,
          ranked.score,
          ranked.reason,
          nextVersion
        ]
      );
    }
    
    logger.info(`Added ${rankedProducts.length} new products to ranking for user ${user_id}`);
    res.json({ added: rankedProducts.length });
  } catch (error) {
    logger.error('Failed to replenish ranking:', error);
    res.status(500).json({ ok: false, error: 'Failed to replenish ranking' });
  }
});

export default router;
