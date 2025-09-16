import { supabase } from '../config/supabase.js';
import logger from '../logger.js';

class SupabaseService {
  // Questions methods
  async getAllQuestions() {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error getting questions:', error);
      throw error;
    }
  }

  async addQuestion(questionData) {
    try {
      const { data, error } = await supabase
        .from('questions')
        .insert([questionData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error adding question:', error);
      throw error;
    }
  }

  // User responses methods
  async storeUserResponse(userId, responseData) {
    try {
      const { data, error } = await supabase
        .from('user_responses')
        .insert([{
          user_id: userId,
          qid: responseData.qid,
          response_value: responseData.response_value,
          response_date: responseData.response_date
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error storing user response:', error);
      throw error;
    }
  }

  async getUserResponses(userId, responseDate) {
    try {
      const { data, error } = await supabase
        .from('user_responses')
        .select(`
          *,
          questions (
            prompt,
            type,
            options_json
          )
        `)
        .eq('user_id', userId)
        .eq('response_date', responseDate);
      
      if (error) throw error;
      
      // Transform the data to match the expected format
      return data.map(response => ({
        ...response,
        prompt: response.questions?.prompt || `question_${response.qid}`,
        type: response.questions?.type || 'single_choice',
        options_json: response.questions?.options_json || '[]'
      }));
    } catch (error) {
      logger.error('Error getting user responses:', error);
      throw error;
    }
  }

  // Search queries methods
  async storeSearchQuery(userId, queryData) {
    try {
      const { data, error } = await supabase
        .from('search_queries')
        .insert([{
          user_id: userId,
          query_text: queryData.query_text,
          response_date: queryData.response_date
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error storing search query:', error);
      throw error;
    }
  }

  // Products methods
  async storeProducts(userId, responseDate, source, products) {
    try {
      const productData = products.map(product => ({
        user_id: userId,
        product_id: product.product_id,
        title: product.title,
        vendor: product.vendor,
        price: product.price,
        currency: product.currency || 'USD',
        url: product.url,
        thumbnail_url: product.thumbnail_url,
        images: product.images || [],
        source: source,
        response_date: responseDate
      }));

      const { data, error } = await supabase
        .from('products')
        .upsert(productData, { 
          onConflict: 'user_id,product_id,response_date,source',
          ignoreDuplicates: false 
        })
        .select();
      
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error storing products:', error);
      throw error;
    }
  }

  async getProductsWithVisionData(userId, responseDate) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_vision_data!inner (
            vision_data
          )
        `)
        .eq('user_id', userId)
        .eq('response_date', responseDate);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error getting products with vision data:', error);
      throw error;
    }
  }

  // Product vision data methods
  async storeProductVisionData(productId, imageUrl, visionData) {
    try {
      const { data, error } = await supabase
        .from('product_vision_data')
        .upsert([{
          product_id: productId,
          image_url: imageUrl,
          vision_data: visionData
        }], { 
          onConflict: 'product_id,image_url',
          ignoreDuplicates: false 
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error storing product vision data:', error);
      throw error;
    }
  }

  async getUnprocessedImages(userId, responseDate) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('product_id, thumbnail_url')
        .eq('user_id', userId)
        .eq('response_date', responseDate)
        .not('thumbnail_url', 'is', null);
      
      if (error) throw error;
      
      // Filter out products that already have vision data
      const unprocessedImages = [];
      for (const product of data || []) {
        const { data: visionData } = await supabase
          .from('product_vision_data')
          .select('id')
          .eq('product_id', product.product_id)
          .eq('image_url', product.thumbnail_url)
          .single();
        
        if (!visionData) {
          unprocessedImages.push({
            product_id: product.product_id,
            image_url: product.thumbnail_url
          });
        }
      }
      
      return unprocessedImages;
    } catch (error) {
      logger.error('Error getting unprocessed images:', error);
      throw error;
    }
  }

  async checkVisionDataExists(productId, imageUrl) {
    try {
      const { data, error } = await supabase
        .from('product_vision_data')
        .select('id')
        .eq('product_id', productId)
        .eq('image_url', imageUrl)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return !!data;
    } catch (error) {
      logger.error('Error checking vision data exists:', error);
      throw error;
    }
  }

  // Ranked products methods
  async clearRankedProducts(userId, responseDate) {
    try {
      const { error } = await supabase
        .from('ranked_products')
        .delete()
        .eq('user_id', userId)
        .eq('response_date', responseDate);
      
      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Error clearing ranked products:', error);
      throw error;
    }
  }

  async storeRankedProduct(userId, responseDate, product, rank, score, reason, contextVersion) {
    try {
      const { data, error } = await supabase
        .from('ranked_products')
        .insert([{
          user_id: userId,
          product_id: product.product_id,
          title: product.title,
          vendor: product.vendor,
          price: product.price,
          currency: product.currency || 'USD',
          url: product.url,
          thumbnail_url: product.thumbnail_url,
          images: product.images || [],
          rank: rank,
          score: score,
          reason: reason,
          context_version: contextVersion,
          response_date: responseDate
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error storing ranked product:', error);
      throw error;
    }
  }

  async getMaxContextVersion(userId, responseDate) {
    try {
      const { data, error } = await supabase
        .from('ranked_products')
        .select('context_version')
        .eq('user_id', userId)
        .eq('response_date', responseDate)
        .order('context_version', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return data?.context_version || 0;
    } catch (error) {
      logger.error('Error getting max context version:', error);
      throw error;
    }
  }

  async getRankedProducts(userId, responseDate, limit = 10, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('ranked_products')
        .select('*')
        .eq('user_id', userId)
        .eq('response_date', responseDate)
        .order('rank', { ascending: true })
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error getting ranked products:', error);
      throw error;
    }
  }

  async getProductsExcluding(userId, responseDate, excludeIds, limit = 10) {
    try {
      let query = supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .eq('response_date', responseDate)
        .limit(limit);
      
      if (excludeIds && excludeIds.length > 0) {
        query = query.not('product_id', 'in', `(${excludeIds.join(',')})`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error getting products excluding:', error);
      throw error;
    }
  }

  async getMaxRankForVersion(userId, responseDate, contextVersion) {
    try {
      const { data, error } = await supabase
        .from('ranked_products')
        .select('rank')
        .eq('user_id', userId)
        .eq('response_date', responseDate)
        .eq('context_version', contextVersion)
        .order('rank', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return data?.rank || 0;
    } catch (error) {
      logger.error('Error getting max rank for version:', error);
      throw error;
    }
  }
}

export default new SupabaseService();
