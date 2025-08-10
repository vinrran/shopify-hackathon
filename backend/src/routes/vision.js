import { Router } from 'express';
import { getDb } from '../database.js';
import { processImagesVisionBatch } from '../services/falService.js';
import logger from '../logger.js';

const router = Router();

// POST /api/vision/run - Process images with Fal.ai Vision
router.post('/run', async (req, res) => {
  try {
    const { user_id, response_date, max_concurrency = 8 } = req.body;
    
    if (!user_id || !response_date) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Missing required fields' 
      });
    }
    
    const db = getDb();
    
    // Get unprocessed images
    const unprocessedImages = await db.all(
      `SELECT DISTINCT pi.product_id, pi.image_url
       FROM product_images pi
       LEFT JOIN product_vision_data pvd 
         ON pi.user_id = pvd.user_id 
         AND pi.response_date = pvd.response_date 
         AND pi.product_id = pvd.product_id
         AND pi.image_url = pvd.image_url
       WHERE pi.user_id = ? 
         AND pi.response_date = ?
         AND pvd.id IS NULL`,
      [user_id, response_date]
    );
    
    if (unprocessedImages.length === 0) {
      return res.json({ ok: true, queued: 0 });
    }
    
    logger.info(`Processing ${unprocessedImages.length} images for user ${user_id}`);
    
    // Return 202 immediately and process async
    res.status(202).json({ ok: true, queued: unprocessedImages.length });
    
    // Process images in background
    const imageUrls = unprocessedImages.map(img => img.image_url);
    const visionResults = await processImagesVisionBatch(imageUrls, max_concurrency);
    
    // Store vision results
    for (let i = 0; i < unprocessedImages.length; i++) {
      const image = unprocessedImages[i];
      const visionData = visionResults[i];
      
      if (visionData) {
        try {
          await db.run(
            `INSERT INTO product_vision_data 
             (user_id, response_date, product_id, image_url, caption, tags_json, attributes_json, raw_json)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              user_id,
              response_date,
              image.product_id,
              image.image_url,
              visionData.caption,
              JSON.stringify(visionData.tags || []),
              JSON.stringify(visionData.attributes || {}),
              visionData.raw_json
            ]
          );
        } catch (error) {
          logger.error(`Failed to store vision data for ${image.image_url}:`, error);
        }
      }
    }
    
    logger.info(`Completed vision processing for ${unprocessedImages.length} images`);
  } catch (error) {
    logger.error('Failed to process vision:', error);
    if (!res.headersSent) {
      res.status(500).json({ ok: false, error: 'Failed to process vision' });
    }
  }
});

// POST /api/vision/process - Process specific products with vision AI
router.post('/process', async (req, res) => {
  try {
    const { user_id, response_date, products } = req.body;
    
    if (!user_id || !response_date || !Array.isArray(products)) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Missing required fields' 
      });
    }
    
    const db = getDb();
    
    // First, collect all unprocessed products
    const unprocessedProducts = [];
    for (const product of products) {
      if (!product.product_id || !product.image_url) continue;
      
      // Check if already processed
      const existing = await db.get(
        `SELECT id FROM product_vision_data 
         WHERE user_id = ? AND response_date = ? AND product_id = ?`,
        [user_id, response_date, product.product_id]
      );
      
      if (!existing) {
        unprocessedProducts.push(product);
      }
    }
    
    if (unprocessedProducts.length === 0) {
      return res.json({ processed: 0 });
    }
    
    // Process ALL images in parallel with high concurrency
    const { processImagesVisionBatch } = await import('../services/falService.js');
    const imageUrls = unprocessedProducts.map(p => p.image_url);
    const maxConcurrency = Math.min(20, unprocessedProducts.length); // Process up to 20 images at once
    
    logger.info(`Processing ${imageUrls.length} images in parallel with concurrency ${maxConcurrency}`);
    const visionResults = await processImagesVisionBatch(imageUrls, maxConcurrency);
    
    // Store all results in batch
    let processed = 0;
    for (let i = 0; i < unprocessedProducts.length; i++) {
      const product = unprocessedProducts[i];
      const visionData = visionResults[i];
      
      if (visionData) {
        try {
          await db.run(
            `INSERT OR REPLACE INTO product_vision_data 
             (user_id, response_date, product_id, image_url, caption, tags_json, attributes_json, raw_json)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              user_id,
              response_date,
              product.product_id,
              product.image_url,
              visionData.caption || '',
              JSON.stringify(visionData.tags || []),
              JSON.stringify(visionData.attributes || {}),
              visionData.raw_json || '{}'
            ]
          );
          processed++;
        } catch (error) {
          logger.error(`Failed to store vision data for product ${product.product_id}:`, error);
        }
      }
    }
    
    logger.info(`Processed ${processed} product images with vision AI for user ${user_id}`);
    res.json({ processed });
  } catch (error) {
    logger.error('Vision processing endpoint failed:', error);
    res.status(500).json({ ok: false, error: 'Vision processing failed' });
  }
});

export default router;
