import { Router } from 'express';
import { getDb } from '../database.js';
import logger from '../logger.js';

const router = Router();

// Helper function to store products
async function storeProducts(db, userId, responseDate, source, results) {
  let storedCount = 0;
  
  for (const product of results) {
    try {
      // Store product
      await db.run(
        `INSERT OR REPLACE INTO products 
         (user_id, response_date, product_id, title, vendor, price, currency, url, thumbnail_url, source, raw_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          responseDate,
          product.product_id,
          product.title,
          product.vendor,
          product.price,
          product.currency,
          product.url,
          product.thumbnail_url,
          source,
          JSON.stringify(product.raw || product)
        ]
      );
      
      // Store product images
      if (product.images && Array.isArray(product.images)) {
        for (const imageUrl of product.images) {
          await db.run(
            `INSERT OR IGNORE INTO product_images 
             (user_id, response_date, product_id, image_url)
             VALUES (?, ?, ?, ?)`,
            [userId, responseDate, product.product_id, imageUrl]
          );
        }
      }
      
      storedCount++;
    } catch (error) {
      logger.error(`Failed to store product ${product.product_id}:`, error);
    }
  }
  
  return storedCount;
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
    
    const db = getDb();
    
    // Ensure user exists
    await db.run('INSERT OR IGNORE INTO users (id) VALUES (?)', [user_id]);
    
    const storedCount = await storeProducts(db, user_id, response_date, source, results);
    
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
    
    const db = getDb();
    
    // Ensure user exists
    await db.run('INSERT OR IGNORE INTO users (id) VALUES (?)', [user_id]);
    
    const storedCount = await storeProducts(db, user_id, response_date, 'recommended', results);
    
    logger.info(`Stored ${storedCount} recommended products for user ${user_id}`);
    res.json({ ok: true, stored: storedCount });
  } catch (error) {
    logger.error('Failed to store recommended products:', error);
    res.status(500).json({ ok: false, error: 'Failed to store products' });
  }
});

export default router;
