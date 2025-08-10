# Shopify Shop Mini - AI-Powered Product Discovery

A personalized shopping experience powered by AI that learns user preferences through daily quizzes and delivers curated product recommendations.

## Features

- **Daily Quiz System**: 3 dynamic questions to understand user preferences
- **AI-Powered Search**: Generates intelligent search queries using Fal.ai LLM
- **Smart Recommendations**: Combines search results with Shopify's recommendation engine
- **Personalized Ranking**: AI ranks products based on user responses and history
- **Interactive UI**: Freeze favorites, reshuffle products, and discover more
- **Vision AI**: Analyzes product images for enhanced recommendations

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  React Frontend │────▶│  Express Backend │────▶│   Fal.ai APIs   │
│  (Shop Mini)    │     │   (REST API)     │     │  (LLM/VLM/AI)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌──────────────────┐
│  Shopify Hooks  │     │  SQLite Database │
│  (Products API) │     │  (User Data)     │
└─────────────────┘     └──────────────────┘
```

## Prerequisites

- Node.js 18+ and npm
- Fal.ai API Key (get from [fal.ai](https://fal.ai))
- Shopify Shop Minis development environment

## Installation

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd Shopify/hackathon
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env and add your Fal.ai API key:
# FAL_KEY=your_actual_fal_key_here
# AUTH_ENABLED=false  # for development

# Seed the database with questions
npm run seed

# Start the backend server
npm start
```

The backend will run on `http://localhost:3001`

### 3. Frontend Setup

```bash
# Navigate to frontend (from project root)
cd ../

# Install Shop Minis dependencies
npx shop-minis install --fix

# Create environment file (optional)
echo "VITE_API_BASE_URL=http://localhost:3001/api" > .env

# Start the Shop Mini development server
npx shop-minis dev
```

The frontend will run on `http://localhost:5173` with the Shop Minis simulator

## Testing

### Backend API Testing
```bash
cd backend

# Run basic API tests
node test-api.js

# Run full integration test
node test-integration.js
```

### Manual Testing Flow
1. Open Shop Mini simulator
2. Answer 3 quiz questions
3. Watch AI generate search queries
4. Products are fetched and ranked
5. Interact with top 20 results:
   - Freeze favorites
   - Reshuffle unfrozen items
   - Load more products
   - Get fresh recommendations

## 📁 Project Structure

```
Shopify/hackathon/
├── backend/
│   ├── src/
│   │   ├── index.js          # Express server
│   │   ├── database.js       # SQLite setup
│   │   ├── routes/           # API endpoints
│   │   └── services/         # Business logic
│   ├── migrations/           # Database schemas
│   ├── test-api.js          # API tests
│   └── .env                 # Environment config
│
├── src/
│   ├── components/          # React components
│   │   ├── QuizScreen.tsx
│   │   ├── LoadingBridge.tsx
│   │   ├── ResultsScreen.tsx
│   │   └── ProductCard.tsx
│   ├── context/            # State management
│   ├── services/           # API client
│   ├── types/              # TypeScript types
│   └── App.tsx            # Main app
│
└── README.md
```

## Environment Variables

### Backend (.env)
```env
# Required for AI features
FAL_KEY=your_fal_ai_api_key

# Development settings
PORT=3001
NODE_ENV=development
AUTH_ENABLED=false          # Set to true in production
FRONTEND_URL=http://localhost:5173

# Database
DATABASE_URL=./shop_mini.db
```

### Frontend (.env)
```env
# API connection
VITE_API_BASE_URL=http://localhost:3001/api
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/questions` | GET | Fetch quiz questions |
| `/api/responses` | POST | Submit user answers |
| `/api/queries/generate` | POST | Generate AI search queries |
| `/api/products/store` | POST | Store search results |
| `/api/products/recommended/store` | POST | Store recommendations |
| `/api/vision/run` | POST | Process images with AI |
| `/api/ranking/build` | POST | Build AI ranking |
| `/api/ranking` | GET | Fetch ranked products |
| `/api/ranking/replenish` | POST | Get fresh products |

## Deployment

### Backend Deployment (Heroku/Railway/Render)

1. Set production environment variables:
   - `FAL_KEY` (required)
   - `AUTH_ENABLED=true`
   - `NODE_ENV=production`
   - `FRONTEND_URL=<your-frontend-url>`

2. Deploy with:
```bash
git push heroku main
# or
railway up
# or
render deploy
```

### Frontend Deployment (Shop Minis)

1. Build for production:
```bash
npx shop-minis build
```

2. Deploy to Shopify:
```bash
npx shop-minis deploy
```

## Security

- **Never expose FAL_KEY to frontend** - all AI calls are server-side
- **Enable AUTH in production** - `AUTH_ENABLED=true`
- **Use HTTPS in production** - update URLs accordingly
- **Rate limiting implemented** - prevents API abuse
- **Input validation** - all endpoints validate requests

## 🐛 Troubleshooting

### Port Conflicts
```bash
# Kill process on port 3001 (backend)
lsof -ti:3001 | xargs kill -9

# Kill process on port 8082 (frontend simulator)
lsof -ti:8082 | xargs kill -9
```

### Dependency Issues
```bash
# Frontend
npx shop-minis install --fix

# Backend
rm -rf node_modules package-lock.json
npm install
```

### Database Reset
```bash
cd backend
rm shop_mini.db
npm run seed
```

## Features Implemented

**Quiz System**
- Single & multi-choice questions
- Response persistence
- Daily question rotation

**AI Integration (Fal.ai)**
- Query generation from responses
- Product ranking algorithm
- Vision processing for images
- Context-aware replenishment

**Product Discovery**
- Shopify SDK search hooks
- Recommended products
- Top 20 ranked display
- Pagination & load more

**Interactive Features**
- Freeze/unfreeze products
- Reshuffle unfrozen items
- Replenish when low
- Error handling & retry

## 📊 Performance

- **Response Time**: < 500ms for API calls
- **AI Processing**: 2-5s for ranking
- **Mobile Optimized**: Touch-first UI
- **Concurrent Requests**: Vision API processes in parallel

MIT License - feel free to use for your Shop Mini projects!

## Acknowledgments

- Shopify Shop Minis team for the SDK
- Fal.ai for powerful AI APIs
- React & TypeScript communities
- Tailwind CSS for styling

---

**Built for Shopify Shop Minis Hackathon** 

For questions or support, please open an issue!
