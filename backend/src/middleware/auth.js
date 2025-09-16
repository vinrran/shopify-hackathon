import { supabase } from '../config/supabase.js';
import logger from '../logger.js';

export async function authMiddleware(req, res, next) {
  // Skip auth in development if disabled
  if (process.env.AUTH_ENABLED === 'false') {
    logger.debug('Auth disabled - skipping authentication');
    req.userId = req.body?.user_id || 'test-user';
    return next();
  }

  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      ok: false, 
      error: 'Missing or invalid authorization header' 
    });
  }

  const token = authHeader.substring(7);
  
  try {
    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      logger.warn('Invalid token:', error?.message);
      return res.status(401).json({ 
        ok: false, 
        error: 'Invalid or expired token' 
      });
    }

    // Set user information in request
    req.userId = user.id;
    req.user = user;
    
    logger.debug(`Authenticated user: ${user.id}`);
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(401).json({ 
      ok: false, 
      error: 'Authentication failed' 
    });
  }
}

export default authMiddleware;
