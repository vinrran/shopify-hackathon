import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db;

export async function initDatabase() {
  const dbPath = process.env.DB_PATH || join(__dirname, '..', 'database.db');
  
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  logger.info(`Database initialized at ${dbPath}`);
  
  // Run migrations
  await runMigrations();
  
  return db;
}

async function runMigrations() {
  logger.info('Running database migrations...');

  // Enable foreign keys
  await db.exec('PRAGMA foreign_keys = ON');

  // Users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Questions table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY,
      prompt TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('single_choice', 'multi_choice')),
      options_json TEXT NOT NULL
    )
  `);

  // User responses table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_responses (
      id INTEGER PRIMARY KEY,
      user_id TEXT NOT NULL,
      response_date TEXT NOT NULL,
      qid INTEGER NOT NULL,
      answer_json TEXT NOT NULL,
      UNIQUE(user_id, response_date, qid),
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(qid) REFERENCES questions(id)
    )
  `);

  // Search queries table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS search_queries (
      id INTEGER PRIMARY KEY,
      user_id TEXT NOT NULL,
      response_date TEXT NOT NULL,
      query TEXT NOT NULL,
      source TEXT NOT NULL CHECK(source IN ('llm')),
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  // Products table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      user_id TEXT NOT NULL,
      response_date TEXT NOT NULL,
      product_id TEXT NOT NULL,
      title TEXT,
      vendor TEXT,
      price TEXT,
      currency TEXT,
      url TEXT,
      thumbnail_url TEXT,
      source TEXT NOT NULL CHECK(source IN ('search','recommended')),
      raw_json TEXT NOT NULL,
      UNIQUE(user_id, response_date, product_id, source),
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  // Product images table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS product_images (
      id INTEGER PRIMARY KEY,
      user_id TEXT NOT NULL,
      response_date TEXT NOT NULL,
      product_id TEXT NOT NULL,
      image_url TEXT NOT NULL,
      UNIQUE(user_id, response_date, product_id, image_url)
    )
  `);

  // Product vision data table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS product_vision_data (
      id INTEGER PRIMARY KEY,
      user_id TEXT NOT NULL,
      response_date TEXT NOT NULL,
      product_id TEXT NOT NULL,
      image_url TEXT NOT NULL,
      caption TEXT,
      tags_json TEXT,
      attributes_json TEXT,
      raw_json TEXT NOT NULL,
      UNIQUE(user_id, response_date, product_id, image_url)
    )
  `);

  // Ranked products table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS ranked_products (
      id INTEGER PRIMARY KEY,
      user_id TEXT NOT NULL,
      response_date TEXT NOT NULL,
      rank INTEGER NOT NULL,
      product_id TEXT NOT NULL,
      score REAL NOT NULL,
      reason TEXT,
      context_version INTEGER DEFAULT 1,
      UNIQUE(user_id, response_date, rank, context_version)
    )
  `);

  logger.info('Database migrations completed');
}

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export default { initDatabase, getDb };
