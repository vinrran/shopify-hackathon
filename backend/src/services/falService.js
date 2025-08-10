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
function sanitizeQueries(qs, cap = 3) {
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

Output policy:
- Return JSON ONLY.
- The top-level value MUST be a JSON array of 6 strings.
- Do NOT include code fences or any prose.
- Each query should be 8-10 words, broad, and searchable.
- Each query should be unique.
- Consider the user's responses, mood, and buyer preferences.
- Only search for clothes in the right gender based on gender affinity.
- Use buyer attributes to personalize queries (age, location, style preferences, etc.).`,
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

    queries = sanitizeQueries(queries, 3);
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
 * Rank products using Fal.ai any-LLM Enterprise
 */
export async function rankProducts({
  todayResponses,
  todayQueries,
  pastDays,
  products,
  excludeProductIds = []
}) {
  try {
    logger.info('Ranking products with Fal.ai');

    const result = await fal.subscribe('fal-ai/any-llm/enterprise', {
      input: {
        system_prompt: `You are a personalized ecommerce ranking model.

Return EXACTLY 20 items as a JSON array of:
[
  { "product_id": "string", "score": number (0..1), "reason": "string" }
]

Output policy:
- JSON ONLY. No prose, no code fences.
- Exclude any products whose IDs are provided in "exclude_product_ids".`,
        prompt: JSON.stringify({
          today_responses: todayResponses,
          today_queries: todayQueries,
          past_5_days: pastDays,
          products,
          exclude_product_ids: excludeProductIds
        })
      }
    });

    const text = extractFalText(result);
    let rankedProducts = [];

    try {
      const parsed = parseJsonFromMaybeMarkdown(text);
      rankedProducts = Array.isArray(parsed) ? parsed : parsed?.items ?? [];
    } catch (e) {
      logger.error('Failed to parse ranking response, using fallback 20:', e?.message || e);
      rankedProducts = products.slice(0, 20).map((p, i) => ({
        product_id: p.product_id,
        score: Math.max(0, 1 - i / 20),
        reason: 'Default fallback'
      }));
    }

    // Clean, dedupe, exclude, clamp to 20
    const seen = new Set();
    rankedProducts = rankedProducts
      .filter(
        (x) =>
          x &&
          x.product_id &&
          !seen.has(x.product_id) &&
          !excludeProductIds.includes(x.product_id) &&
          (seen.add(x.product_id) || true)
      )
      .slice(0, 20)
      .map((x) => ({
        product_id: String(x.product_id),
        score: Math.max(0, Math.min(1, Number(x.score) || 0)),
        reason: typeof x.reason === 'string' ? x.reason : ''
      }));

    logger.info(`Ranked ${rankedProducts.length} products`);
    return rankedProducts;
  } catch (error) {
    logger.error('Failed to rank products:', error?.message || error);
    throw error;
  }
}

export default {
  generateSearchQueries,
  processImageVision,
  processImagesVisionBatch,
  rankProducts
};
