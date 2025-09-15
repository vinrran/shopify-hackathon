import { fal } from '@fal-ai/client';
import pLimit from 'p-limit';
import logger from '../logger.js';

// -----------------------------
// Fal client configuration
// -----------------------------
fal.config({
  credentials: process.env.FAL_KEY
});

// -----------------------------
// Helpers
// -----------------------------

/**
 * Extract a usable text payload from various FAL response shapes.
 * Handles:
 *  - { output: string }
 *  - { output: { text: string } }
 *  - { data: { output: string } }
 *  - { text: string }
 *  - OpenAI-like { choices[0].message.content }
 */
function extractFalText(result) {
  if (!result) return '';

  const raw =
    result.output ??
    result?.data?.output ??
    result?.text ??
    result?.choices?.[0]?.message?.content ??
    '';

  if (typeof raw === 'string') return raw;
  if (raw && typeof raw.text === 'string') return raw.text;

  try {
    return JSON.stringify(raw);
  } catch {
    return '';
  }
}

/**
 * Given a string that might contain JSON (possibly inside code fences),
 * try to parse a JSON value (array/object). Falls back to extracting
 * the first [] or {} block if top-level parse fails.
 */
function parseJsonFromMaybeMarkdown(text) {
  if (!text) throw new Error('Empty output from model');

  // Prefer fenced JSON block if present
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = (fenced ? fenced[1] : text).trim();

  // Direct parse
  try {
    return JSON.parse(candidate);
  } catch {
    // Try to pull first array/object from the whole text
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]);
      } catch {}
    }
    const objMatch = text.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try {
        return JSON.parse(objMatch[0]);
      } catch {}
    }
  }

  throw new Error('No valid JSON found in model output');
}

/**
 * Clean and limit an array of query strings.
 */
function sanitizeQueries(qs, cap = 6) {
  const dedup = new Set(
    qs
      .map((q) => (typeof q === 'string' ? q : ''))
      .map((q) => q.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
  );
  return Array.from(dedup).slice(0, cap);
}

// -----------------------------
// Public API
// -----------------------------

/**
 * Generate search queries using Fal.ai any-LLM Enterprise
 */
export async function generateSearchQueries(userResponses, buyerData = {}) {
  try {
    logger.info('Generating search queries with Fal.ai');
    logger.info('FAL_KEY configured:', !!process.env.FAL_KEY);
    logger.info('User responses:', JSON.stringify(userResponses, null, 2));

    const { buyerAttributes, genderAffinity } = buyerData;
    
    const input = {
      system_prompt: `You are an e-commerce search query generator.

You are an e-commerce search query generator.

Output policy:
- Return JSON ONLY.
- The top-level value MUST be a JSON array of exactly 6 strings.
- Do NOT include code fences, keys, timestamps, or prose.

Category scope:
- You are NOT limited to clothing. You may choose categories from ANY retail department (apparel, beauty, home, kitchen, lighting, pets, office, electronics accessories, etc.).
- Aim for diversity across departments when the user's preferences are broad. If the user intent is clearly fashion-only, apparel-only is acceptable.

Generation rules:
- Each of the 6 queries MUST target a DIFFERENT product category (no duplicates or synonyms).
- Include the category keyword in each query exactly once.
- Word count per query: 8–10 words.
- Queries must be broad and searchable (no SKUs, no brand names).
- Apply gender affinity ONLY to apparel/footwear/accessories queries; ignore it for non-apparel categories.
- Avoid repeating the same adjective more than twice overall.

Personalization using Buyer Attributes (Shopify Minis useBuyerAttributes taxonomy):
- Use the shopper’s historical categories/brands/price bands to guide category selection toward RELATED or COMPLEMENTARY items rather than exact repeats.
- At most ONE query may directly target the shopper’s dominant historical category; the remaining queries should be adjacent (e.g., if history is “running shoes,” consider “performance socks,” “gym shorts,” “lightweight windbreakers,” or “fitness earbuds”).
- Keep tone (quality/price adjectives) consistent with typical spend/brands when appropriate.

Personalization using TODAY’S QUIZ ANSWERS:
- Use the user’s current answers (mood, occasion, color/style, budget, etc.) to shape both the chosen categories and the adjectives in the queries.
- Prefer categories that naturally fit the stated occasion, season, or mood (e.g., “cozy” → sweaters/blankets/candles; “work setup upgrade” → lamps/desk organizers/keyboard).
- If a quiz answer strongly emphasizes a theme, you may include ONE direct category for that theme and keep the other queries related-but-different (complementary) to avoid redundancy.

Tie-breaking & consistency:
- When buyer history and today’s answers conflict, prioritize TODAY’S answers and use history to choose adjacent categories, not identical repeats.
- Maintain cross-department variety when the answers are broad; if the intent is clearly focused on one department, stay within that department but still use different categories.

Quality check (before output):
- Ensure exactly 6 strings, each a unique category, all 8–10 words, and JSON array only.
      `,
      prompt: JSON.stringify({
        today_responses: userResponses,
        buyer_attributes: buyerAttributes || {},
        gender_affinity: genderAffinity || null,
        constraints: { max_queries: 6, max_words_per_query: 10 }
      })
    };

    logger.info('Fal.ai input:', JSON.stringify(input, null, 2));

    const result = await fal.subscribe('fal-ai/any-llm/enterprise', { input });
    logger.info('Fal.raw type:', typeof result?.output);
    logger.info('Fal.output preview:', String(result?.output ?? '').slice(0, 200));

    const text = extractFalText(result);
    logger.info('Extracted text from result:', text);

    let queries = [];
    try {
      const parsed = parseJsonFromMaybeMarkdown(text);
      queries = Array.isArray(parsed) ? parsed : parsed?.queries ?? [];
    } catch (parseErr) {
      logger.info('JSON parse failed, falling back to line extraction:', parseErr?.message || parseErr);
      const lines = (text || '')
        .replace(/```(?:json)?|```/g, '')
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      queries = lines
        .filter((l) => /^\d+\)|^-|^".*"$|^'.*'$/.test(l))
        .map((l) => l.replace(/^\d+\)\s*|^-\s*|^["']|["']$/g, '').trim());
    }

    queries = sanitizeQueries(queries, 6);
    logger.info(`Generated ${queries.length} search queries:`, queries);
    return queries;
  } catch (error) {
    logger.error('Failed to generate search queries:', error?.message || error);
    logger.error('Stack:', error?.stack);
    throw error;
  }
}

/**
 * Process image with Fal.ai any-VLM Vision
 */
export async function processImageVision(imageUrl) {
  try {
    const result = await fal.subscribe('fal-ai/any-llm/vision', {
      input: {
        prompt: `Extract ecommerce-relevant attributes from this product image.

Return JSON ONLY with this shape:
{
  "caption": "string",
  "tags": ["string", "..."],
  "attributes": { "key": "value" }
}`,
        image_url: imageUrl
      }
    });

    const text = extractFalText(result);
    let visionData = {
      caption: '',
      tags: [],
      attributes: {}
    };

    try {
      const parsed = parseJsonFromMaybeMarkdown(text);
      visionData = {
        caption: parsed.caption ?? '',
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        attributes: parsed.attributes ?? {}
      };
    } catch {
      // Fallback: heuristic extraction
      visionData.caption = (text.split('\n')[0] || '').trim();
      visionData.tags = (text.match(/\b[a-z0-9\-]+\b/gi) || []).slice(0, 10);
    }

    return {
      ...visionData,
      raw_json: JSON.stringify(result)
    };
  } catch (error) {
    logger.error(`Failed to process image ${imageUrl}:`, error?.message || error);
    throw error;
  }
}

/**
 * Process multiple images concurrently with rate limiting
 */
export async function processImagesVisionBatch(imageUrls, maxConcurrency = 8) {
  const limit = pLimit(maxConcurrency);
  logger.info(`Processing ${imageUrls.length} images with concurrency ${maxConcurrency}`);

  const promises = imageUrls.map((url) =>
    limit(() =>
      processImageVision(url).catch((err) => {
        logger.error(`Failed to process image ${url}:`, err?.message || err);
        return null;
      })
    )
  );

  const results = await Promise.all(promises);
  const successful = results.filter((r) => r !== null);
  logger.info(`Successfully processed ${successful.length}/${imageUrls.length} images`);
  return results;
}

/**
 * Return all products without ranking (simple passthrough)
 */
export async function rankProducts({
  todayResponses,
  todayQueries,
  pastDays,
  products,
  excludeProductIds = []
}) {
  try {
    logger.info('Returning all products without LLM ranking');

    // Filter out excluded products and return all remaining products
    const filteredProducts = products.filter(
      (product) => !excludeProductIds.includes(product.product_id)
    );

    // Return all products with default scores
    const rankedProducts = filteredProducts.map((product, index) => ({
      product_id: product.product_id,
      score: 1.0, // All products get the same score
      reason: 'All products returned without ranking'
    }));

    logger.info(`Returned ${rankedProducts.length} products without ranking`);
    return rankedProducts;
  } catch (error) {
    logger.error('Failed to return products:', error?.message || error);
    throw error;
  }
}

export default {
  generateSearchQueries,
  processImageVision,
  processImagesVisionBatch,
  rankProducts
};
