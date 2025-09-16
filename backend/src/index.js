import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import authMiddleware from './middleware/auth.js';
import logger from './logger.js';

// Route imports
import questionsRoutes from './routes/questions.js';
import responsesRoutes from './routes/responses.js';
import queriesRoutes from './routes/queries.js';
import productsRoutes from './routes/products.js';
import visionRoutes from './routes/vision.js';
import rankingRoutes from './routes/ranking.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json({ limit: '10mb' }));
// CORS configuration - allow both development and production origins
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',  // Vite default
      'http://localhost:8082',  // Shop Mini simulator
      'http://127.0.0.1:5173',
      'http://127.0.0.1:8082',
      // Add your frontend domains here
      'https://shopify-hackathon-production.up.railway.app'
    ];
    
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    // Allow all origins for now to ensure connection works
    callback(null, true);
  },
  credentials: true
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API Routes (with auth middleware)
app.use('/api/questions', authMiddleware, questionsRoutes);
app.use('/api/responses', authMiddleware, responsesRoutes);
app.use('/api/queries', authMiddleware, queriesRoutes);
app.use('/api/products', authMiddleware, productsRoutes);
app.use('/api/vision', authMiddleware, visionRoutes);
app.use('/api/ranking', authMiddleware, rankingRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ 
    ok: false, 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    ok: false, 
    error: 'Endpoint not found' 
  });
});

// Initialize and start server
async function startServer() {
  try {
    // Start server (no database initialization needed - using in-memory storage)
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Auth enabled: ${process.env.AUTH_ENABLED !== 'false'}`);
      logger.info(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      logger.info('Using in-memory storage (no database required)');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Start the server
startServer();
