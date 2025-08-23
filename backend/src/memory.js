import logger from './logger.js';

// In-memory data structures
const storage = {
  users: new Map(),                    // id -> { id, created_at }
  questions: new Map(),                // id -> { id, prompt, type, options }
  userResponses: new Map(),            // key -> { user_id, response_date, qid, answer }
  searchQueries: new Map(),            // key -> { user_id, response_date, query, source }
  products: new Map(),                 // key -> { user_id, response_date, product_id, title, vendor, price, etc. }
  productImages: new Map(),            // key -> { user_id, response_date, product_id, image_url }
  productVisionData: new Map(),        // key -> { user_id, response_date, product_id, image_url, caption, tags, etc. }
  rankedProducts: new Map()            // key -> { user_id, response_date, rank, product_id, score, reason, context_version }
};

// Helper functions to generate composite keys
const generateKey = (...parts) => parts.join('|');

export async function initMemoryStorage() {
  logger.info('Initializing in-memory storage...');
  
  // Initialize with default questions
  await seedQuestions();
  
  logger.info('In-memory storage initialized successfully');
  return storage;
}

async function seedQuestions() {
  const defaultQuestions = [
    {
      id: 1,
      prompt: "How are you feeling today?",
      type: "single_choice",
      options: ["happy", "sad", "neutral", "excited", "stressed"]
    },
    {
      id: 2,
      prompt: "What style are you looking for?",
      type: "single_choice",
      options: ["streetwear", "formal", "casual", "athletic", "vintage", "minimalist"]
    },
    {
      id: 3,
      prompt: "What colors do you prefer?",
      type: "multi_choice",
      options: ["black", "white", "blue", "red", "green", "yellow", "purple", "gray", "brown"]
    },
    {
      id: 4,
      prompt: "What's your budget range?",
      type: "single_choice",
      options: ["under $50", "$50-$100", "$100-$200", "$200-$500", "over $500"]
    },
    {
      id: 5,
      prompt: "What occasion are you shopping for?",
      type: "single_choice",
      options: ["everyday wear", "work", "party", "gym", "outdoor", "special event"]
    },
    {
      id: 6,
      prompt: "What's your preferred fit?",
      type: "single_choice",
      options: ["slim fit", "regular fit", "loose fit", "oversized", "tailored"]
    }
  ];

  defaultQuestions.forEach(question => {
    storage.questions.set(question.id, question);
  });

  logger.info(`Seeded ${defaultQuestions.length} default questions`);
}

// Memory storage operations
export const memoryDb = {
  // Users operations
  async createUser(userId) {
    const user = {
      id: userId,
      created_at: new Date().toISOString()
    };
    storage.users.set(userId, user);
    return user;
  },

  async getUser(userId) {
    return storage.users.get(userId);
  },

  // Questions operations
  async getAllQuestions() {
    return Array.from(storage.questions.values());
  },

  async getQuestion(id) {
    return storage.questions.get(id);
  },

  async createQuestion(prompt, type, options) {
    const existingQuestions = Array.from(storage.questions.values());
    const newId = Math.max(...existingQuestions.map(q => q.id), 0) + 1;
    const question = { id: newId, prompt, type, options };
    storage.questions.set(newId, question);
    return question;
  },

  // User responses operations
  async saveUserResponse(userId, responseDate, qid, answer) {
    const key = generateKey(userId, responseDate, qid);
    const response = {
      user_id: userId,
      response_date: responseDate,
      qid: qid,
      answer: answer
    };
    storage.userResponses.set(key, response);
    return response;
  },

  async getUserResponses(userId, responseDate) {
    const responses = [];
    for (const [key, response] of storage.userResponses) {
      if (response.user_id === userId && response.response_date === responseDate) {
        responses.push(response);
      }
    }
    return responses;
  },

  async getUserResponseExists(userId, responseDate, qid) {
    const key = generateKey(userId, responseDate, qid);
    return storage.userResponses.has(key);
  },

  // Search queries operations
  async saveSearchQuery(userId, responseDate, query, source) {
    const key = generateKey(userId, responseDate, query);
    const searchQuery = {
      user_id: userId,
      response_date: responseDate,
      query: query,
      source: source
    };
    storage.searchQueries.set(key, searchQuery);
    return searchQuery;
  },

  async getSearchQueries(userId, responseDate) {
    const queries = [];
    for (const [key, query] of storage.searchQueries) {
      if (query.user_id === userId && query.response_date === responseDate) {
        queries.push(query);
      }
    }
    return queries;
  },

  // Products operations
  async saveProduct(userId, responseDate, product, source) {
    const key = generateKey(userId, responseDate, product.product_id || product.id, source);
    const productData = {
      user_id: userId,
      response_date: responseDate,
      product_id: product.product_id || product.id,
      title: product.title,
      vendor: product.vendor,
      price: product.price,
      currency: product.currency,
      url: product.onlineStoreUrl || product.url,
      thumbnail_url: product.featuredImage?.url || product.image,
      source: source,
      raw_data: product
    };
    storage.products.set(key, productData);
    return productData;
  },

  async getProducts(userId, responseDate, source = null) {
    const products = [];
    for (const [key, product] of storage.products) {
      if (product.user_id === userId && product.response_date === responseDate) {
        if (!source || product.source === source) {
          products.push(product);
        }
      }
    }
    return products;
  },

  async getAllProducts(userId, responseDate) {
    return this.getProducts(userId, responseDate);
  },

  // Product images operations
  async saveProductImage(userId, responseDate, productId, imageUrl) {
    const key = generateKey(userId, responseDate, productId, imageUrl);
    const imageData = {
      user_id: userId,
      response_date: responseDate,
      product_id: productId,
      image_url: imageUrl
    };
    storage.productImages.set(key, imageData);
    return imageData;
  },

  async getProductImages(userId, responseDate) {
    const images = [];
    for (const [key, image] of storage.productImages) {
      if (image.user_id === userId && image.response_date === responseDate) {
        images.push(image);
      }
    }
    return images;
  },

  // Product vision data operations
  async saveProductVisionData(userId, responseDate, productId, imageUrl, visionData) {
    const key = generateKey(userId, responseDate, productId, imageUrl);
    const data = {
      user_id: userId,
      response_date: responseDate,
      product_id: productId,
      image_url: imageUrl,
      caption: visionData.caption,
      tags: visionData.tags,
      attributes: visionData.attributes,
      raw_data: visionData
    };
    storage.productVisionData.set(key, data);
    return data;
  },

  async getProductVisionData(userId, responseDate) {
    const visionData = [];
    for (const [key, data] of storage.productVisionData) {
      if (data.user_id === userId && data.response_date === responseDate) {
        visionData.push(data);
      }
    }
    return visionData;
  },

  // Ranked products operations
  async saveRankedProducts(userId, responseDate, rankedProducts, contextVersion = 1) {
    // Clear existing rankings for this user/date/context
    const keysToDelete = [];
    for (const [key, ranking] of storage.rankedProducts) {
      if (ranking.user_id === userId && 
          ranking.response_date === responseDate && 
          ranking.context_version === contextVersion) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => storage.rankedProducts.delete(key));

    // Save new rankings
    const savedRankings = [];
    rankedProducts.forEach((product, index) => {
      const key = generateKey(userId, responseDate, index + 1, contextVersion);
      const ranking = {
        user_id: userId,
        response_date: responseDate,
        rank: index + 1,
        product_id: product.product_id,
        score: product.score,
        reason: product.reason,
        context_version: contextVersion
      };
      storage.rankedProducts.set(key, ranking);
      savedRankings.push(ranking);
    });

    return savedRankings;
  },

  async getRankedProducts(userId, responseDate, contextVersion = 1) {
    const rankings = [];
    for (const [key, ranking] of storage.rankedProducts) {
      if (ranking.user_id === userId && 
          ranking.response_date === responseDate && 
          ranking.context_version === contextVersion) {
        rankings.push(ranking);
      }
    }
    // Sort by rank
    return rankings.sort((a, b) => a.rank - b.rank);
  },

  // Utility operations
  async clearUserData(userId, responseDate = null) {
    if (responseDate) {
      // Clear data for specific date
      const keysToDelete = [];
      
      [storage.userResponses, storage.searchQueries, storage.products, 
       storage.productImages, storage.productVisionData, storage.rankedProducts]
        .forEach(store => {
          for (const [key, item] of store) {
            if (item.user_id === userId && item.response_date === responseDate) {
              keysToDelete.push([store, key]);
            }
          }
        });
      
      keysToDelete.forEach(([store, key]) => store.delete(key));
    } else {
      // Clear all data for user
      storage.users.delete(userId);
      const keysToDelete = [];
      
      [storage.userResponses, storage.searchQueries, storage.products, 
       storage.productImages, storage.productVisionData, storage.rankedProducts]
        .forEach(store => {
          for (const [key, item] of store) {
            if (item.user_id === userId) {
              keysToDelete.push([store, key]);
            }
          }
        });
      
      keysToDelete.forEach(([store, key]) => store.delete(key));
    }
  },

  // Get storage stats
  getStats() {
    return {
      users: storage.users.size,
      questions: storage.questions.size,
      userResponses: storage.userResponses.size,
      searchQueries: storage.searchQueries.size,
      products: storage.products.size,
      productImages: storage.productImages.size,
      productVisionData: storage.productVisionData.size,
      rankedProducts: storage.rankedProducts.size
    };
  }
};

export function getMemoryDb() {
  return memoryDb;
}

export default { initMemoryStorage, getMemoryDb };
