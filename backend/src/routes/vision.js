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

export default router;
