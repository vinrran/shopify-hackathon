import logger from '../logger.js';

export function authMiddleware(req, res, next) {
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
  
  // Simple token validation - just extract user_id from token or body
  if (token) {
    req.userId = req.body?.user_id || token;
    next();
  } else {
    res.status(401).json({ 
      ok: false, 
      error: 'Invalid token' 
    });
  }
}

export default authMiddleware;
