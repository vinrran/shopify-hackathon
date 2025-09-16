-- Supabase Database Schema for Shopify Shop Mini
-- This schema replaces the in-memory storage with persistent database tables

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Users table (managed by Supabase Auth)
-- This table will be automatically created by Supabase Auth

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'single_choice',
  options_json JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User responses table
CREATE TABLE IF NOT EXISTS user_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  qid UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  response_value TEXT NOT NULL,
  response_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, qid, response_date)
);

-- Search queries table
CREATE TABLE IF NOT EXISTS search_queries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query_text TEXT NOT NULL,
  response_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  title TEXT NOT NULL,
  vendor TEXT,
  price DECIMAL(10,2),
  currency VARCHAR(10) DEFAULT 'USD',
  url TEXT,
  thumbnail_url TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  source VARCHAR(50) NOT NULL, -- 'search' or 'recommended'
  response_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id, response_date, source)
);

-- Product vision data table
CREATE TABLE IF NOT EXISTS product_vision_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  vision_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, image_url)
);

-- Ranked products table
CREATE TABLE IF NOT EXISTS ranked_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  title TEXT NOT NULL,
  vendor TEXT,
  price DECIMAL(10,2),
  currency VARCHAR(10) DEFAULT 'USD',
  url TEXT,
  thumbnail_url TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  rank INTEGER NOT NULL,
  score DECIMAL(5,4) NOT NULL,
  reason TEXT,
  context_version INTEGER NOT NULL,
  response_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_responses_user_date ON user_responses(user_id, response_date);
CREATE INDEX IF NOT EXISTS idx_search_queries_user_date ON search_queries(user_id, response_date);
CREATE INDEX IF NOT EXISTS idx_products_user_date ON products(user_id, response_date);
CREATE INDEX IF NOT EXISTS idx_ranked_products_user_date ON ranked_products(user_id, response_date);
CREATE INDEX IF NOT EXISTS idx_product_vision_data_product ON product_vision_data(product_id);

-- Row Level Security (RLS) policies
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_vision_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranked_products ENABLE ROW LEVEL SECURITY;

-- RLS Policies for questions (public read access)
CREATE POLICY "Questions are viewable by everyone" ON questions FOR SELECT USING (true);

-- RLS Policies for user_responses (users can only access their own data)
CREATE POLICY "Users can view their own responses" ON user_responses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own responses" ON user_responses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own responses" ON user_responses FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for search_queries (users can only access their own data)
CREATE POLICY "Users can view their own queries" ON search_queries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own queries" ON search_queries FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for products (users can only access their own data)
CREATE POLICY "Users can view their own products" ON products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own products" ON products FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for product_vision_data (public read access for efficiency)
CREATE POLICY "Vision data is viewable by everyone" ON product_vision_data FOR SELECT USING (true);
CREATE POLICY "Vision data can be inserted by service" ON product_vision_data FOR INSERT WITH CHECK (true);

-- RLS Policies for ranked_products (users can only access their own data)
CREATE POLICY "Users can view their own ranked products" ON ranked_products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own ranked products" ON ranked_products FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updating timestamps
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
