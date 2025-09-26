import { Router } from 'express';
import memoryStorage from '../memoryStorage.js';
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
    
    // Get unprocessed images
    const unprocessedImages = memoryStorage.getUnprocessedImages(user_id, response_date);
    
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
          memoryStorage.storeProductVisionData(
            user_id,
            response_date,
            image.product_id,
            image.image_url,
            visionData
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

// POST /api/vision/process - Disabled vision processing (returns immediately)
router.post('/process', async (req, res) => {
  try {
    logger.info('Vision processing disabled - returning immediately without processing');
    res.json({ processed: 0, message: 'Vision processing disabled' });
  } catch (error) {
    logger.error('Vision processing endpoint failed:', error);
    res.status(500).json({ ok: false, error: 'Vision processing failed' });
  }
});

export default router;
