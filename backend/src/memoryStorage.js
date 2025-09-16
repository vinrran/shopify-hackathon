import logger from './logger.js';

// In-memory storage to replace database
class MemoryStorage {
  constructor() {
    this.users = new Map();
    this.questions = new Map();
    this.userResponses = new Map(); // key: userId_responseDate_qid
    this.searchQueries = new Map(); // key: userId_responseDate
    this.products = new Map(); // key: userId_responseDate_productId_source
    this.productImages = new Map(); // key: userId_responseDate_productId_imageUrl
    this.productVisionData = new Map(); // key: userId_responseDate_productId_imageUrl
    this.rankedProducts = new Map(); // key: userId_responseDate_rank_contextVersion
  }


  // User methods
  ensureUser(userId) {
    if (!this.users.has(userId)) {
      this.users.set(userId, {
        id: userId,
        created_at: new Date().toISOString()
      });
    }
  }

  // Questions methods
  getAllQuestions() {
    return Array.from(this.questions.values());
  }

  addQuestion(prompt, type, options) {
    const id = this.questions.size + 1;
    const question = { id, prompt, type, options };
    this.questions.set(id, question);
    return id;
  }

  // User responses methods
  storeUserResponse(userId, responseDate, qid, answer) {
    this.ensureUser(userId);
    const key = `${userId}_${responseDate}_${qid}`;
    this.userResponses.set(key, {
      user_id: userId,
      response_date: responseDate,
      qid,
      answer_json: JSON.stringify(answer)
    });
  }

  getUserResponses(userId, responseDate) {
    const responses = [];
    for (const [key, response] of this.userResponses) {
      if (response.user_id === userId && response.response_date === responseDate) {
        const question = this.questions.get(response.qid);
        responses.push({
          ...response,
          prompt: question?.prompt || `question_${response.qid}`, // Fallback for frontend questions
          type: question?.type || 'single_choice',
          options_json: JSON.stringify(question?.options || [])
        });
      }
    }
    return responses;
  }

  // Search queries methods
  storeSearchQuery(userId, responseDate, query, source = 'llm') {
    this.ensureUser(userId);
    const key = `${userId}_${responseDate}`;
    if (!this.searchQueries.has(key)) {
      this.searchQueries.set(key, []);
    }
    this.searchQueries.get(key).push({
      user_id: userId,
      response_date: responseDate,
      query,
      source
    });
  }

  getSearchQueries(userId, responseDate) {
    const key = `${userId}_${responseDate}`;
    return this.searchQueries.get(key) || [];
  }

  // Products methods
  storeProduct(userId, responseDate, source, product) {
    this.ensureUser(userId);
    const key = `${userId}_${responseDate}_${product.product_id}_${source}`;
    this.products.set(key, {
      user_id: userId,
      response_date: responseDate,
      product_id: product.product_id,
      title: product.title,
      vendor: product.vendor,
      price: product.price,
      currency: product.currency,
      url: product.url,
      thumbnail_url: product.thumbnail_url,
      source,
      raw_json: JSON.stringify(product.raw || product)
    });

    // Store product images
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach(imageUrl => {
        this.storeProductImage(userId, responseDate, product.product_id, imageUrl);
      });
    }
  }

  getProducts(userId, responseDate) {
    const products = [];
    for (const [key, product] of this.products) {
      if (product.user_id === userId && product.response_date === responseDate) {
        products.push(product);
      }
    }
    return products;
  }

  // Product images methods
  storeProductImage(userId, responseDate, productId, imageUrl) {
    const key = `${userId}_${responseDate}_${productId}_${imageUrl}`;
    this.productImages.set(key, {
      user_id: userId,
      response_date: responseDate,
      product_id: productId,
      image_url: imageUrl
    });
  }

  getUnprocessedImages(userId, responseDate) {
    const unprocessedImages = [];
    for (const [key, image] of this.productImages) {
      if (image.user_id === userId && image.response_date === responseDate) {
        const visionKey = `${userId}_${responseDate}_${image.product_id}_${image.image_url}`;
        if (!this.productVisionData.has(visionKey)) {
          unprocessedImages.push({
            product_id: image.product_id,
            image_url: image.image_url
          });
        }
      }
    }
    return unprocessedImages;
  }

  // Product vision data methods
  storeProductVisionData(userId, responseDate, productId, imageUrl, visionData) {
    const key = `${userId}_${responseDate}_${productId}_${imageUrl}`;
    this.productVisionData.set(key, {
      user_id: userId,
      response_date: responseDate,
      product_id: productId,
      image_url: imageUrl,
      caption: visionData.caption,
      tags_json: JSON.stringify(visionData.tags || []),
      attributes_json: JSON.stringify(visionData.attributes || {}),
      raw_json: visionData.raw_json
    });
  }

  getProductsWithVisionData(userId, responseDate) {
    const products = [];
    const productMap = new Map();

    // Get all products
    for (const [key, product] of this.products) {
      if (product.user_id === userId && product.response_date === responseDate) {
        if (!productMap.has(product.product_id)) {
          productMap.set(product.product_id, {
            product_id: product.product_id,
            title: product.title,
            vendor: product.vendor,
            price: product.price,
            currency: product.currency,
            url: product.url,
            thumbnail_url: product.thumbnail_url,
            caption: null,
            tags_json: null,
            attributes_json: null
          });
        }
      }
    }

    // Add vision data
    for (const [key, visionData] of this.productVisionData) {
      if (visionData.user_id === userId && visionData.response_date === responseDate) {
        const product = productMap.get(visionData.product_id);
        if (product) {
          product.caption = visionData.caption;
          product.tags_json = visionData.tags_json;
          product.attributes_json = visionData.attributes_json;
        }
      }
    }

    return Array.from(productMap.values());
  }

  // Ranked products methods
  storeRankedProduct(userId, responseDate, rank, productId, score, reason, contextVersion = 1) {
    const key = `${userId}_${responseDate}_${rank}_${contextVersion}`;
    this.rankedProducts.set(key, {
      user_id: userId,
      response_date: responseDate,
      rank,
      product_id: productId,
      score,
      reason,
      context_version: contextVersion
    });
  }

  clearRankedProducts(userId, responseDate) {
    const keysToDelete = [];
    for (const [key, rankedProduct] of this.rankedProducts) {
      if (rankedProduct.user_id === userId && rankedProduct.response_date === responseDate) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.rankedProducts.delete(key));
  }

  getRankedProducts(userId, responseDate, limit = 50, offset = 0) {
    // Get latest context version
    let maxVersion = 1;
    for (const [key, rankedProduct] of this.rankedProducts) {
      if (rankedProduct.user_id === userId && rankedProduct.response_date === responseDate) {
        maxVersion = Math.max(maxVersion, rankedProduct.context_version);
      }
    }

    // Get ranked products for the latest version
    const rankedProducts = [];
    for (const [key, rankedProduct] of this.rankedProducts) {
      if (rankedProduct.user_id === userId && 
          rankedProduct.response_date === responseDate && 
          rankedProduct.context_version === maxVersion) {
        
        // Get product details
        const productKey = `${userId}_${responseDate}_${rankedProduct.product_id}_search`;
        const productKeyRec = `${userId}_${responseDate}_${rankedProduct.product_id}_recommended`;
        const product = this.products.get(productKey) || this.products.get(productKeyRec);
        
        if (product) {
          rankedProducts.push({
            ...rankedProduct,
            title: product.title,
            vendor: product.vendor,
            price: product.price,
            currency: product.currency,
            url: product.url,
            thumbnail_url: product.thumbnail_url
          });
        }
      }
    }

    // Sort by rank and apply pagination
    rankedProducts.sort((a, b) => a.rank - b.rank);
    return rankedProducts.slice(offset, offset + limit);
  }

  getMaxContextVersion(userId, responseDate) {
    let maxVersion = 0;
    for (const [key, rankedProduct] of this.rankedProducts) {
      if (rankedProduct.user_id === userId && rankedProduct.response_date === responseDate) {
        maxVersion = Math.max(maxVersion, rankedProduct.context_version);
      }
    }
    return maxVersion;
  }

  getMaxRankForVersion(userId, responseDate, contextVersion) {
    let maxRank = 0;
    for (const [key, rankedProduct] of this.rankedProducts) {
      if (rankedProduct.user_id === userId && 
          rankedProduct.response_date === responseDate && 
          rankedProduct.context_version === contextVersion) {
        maxRank = Math.max(maxRank, rankedProduct.rank);
      }
    }
    return maxRank;
  }

  getProductsExcluding(userId, responseDate, excludeProductIds) {
    const products = [];
    const productMap = new Map();

    // Get all products except excluded ones
    for (const [key, product] of this.products) {
      if (product.user_id === userId && 
          product.response_date === responseDate && 
          !excludeProductIds.includes(product.product_id)) {
        
        if (!productMap.has(product.product_id)) {
          productMap.set(product.product_id, {
            product_id: product.product_id,
            title: product.title,
            vendor: product.vendor,
            price: product.price,
            currency: product.currency,
            url: product.url,
            thumbnail_url: product.thumbnail_url,
            caption: null,
            tags_json: null,
            attributes_json: null
          });
        }
      }
    }

    // Add vision data
    for (const [key, visionData] of this.productVisionData) {
      if (visionData.user_id === userId && visionData.response_date === responseDate) {
        const product = productMap.get(visionData.product_id);
        if (product) {
          product.caption = visionData.caption;
          product.tags_json = visionData.tags_json;
          product.attributes_json = visionData.attributes_json;
        }
      }
    }

    return Array.from(productMap.values());
  }

  checkVisionDataExists(userId, responseDate, productId) {
    for (const [key, visionData] of this.productVisionData) {
      if (visionData.user_id === userId && 
          visionData.response_date === responseDate && 
          visionData.product_id === productId) {
        return true;
      }
    }
    return false;
  }
}

// Create singleton instance
const memoryStorage = new MemoryStorage();

export default memoryStorage;
