-- Favourity Database Schema Migration: 0001_initial_schema.sql

-- 1. Topics table
CREATE TABLE IF NOT EXISTS topics (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Items table
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL,
  name TEXT NOT NULL,
  FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
);

-- 3. Anonymous Lists table
CREATE TABLE IF NOT EXISTS anonymous_lists (
  id TEXT PRIMARY KEY,
  user_hash TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  rank_data TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
);

-- 4. Daily Leaderboards table
CREATE TABLE IF NOT EXISTS leaderboards_daily (
  topic_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  score REAL NOT NULL,
  rank INTEGER NOT NULL,
  PRIMARY KEY (topic_id, item_id)
);

-- 5. Lifetime Leaderboards table
CREATE TABLE IF NOT EXISTS leaderboards_lifetime (
  topic_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  score REAL NOT NULL,
  rank INTEGER NOT NULL,
  PRIMARY KEY (topic_id, item_id)
);

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_items_topic ON items(topic_id);
CREATE INDEX IF NOT EXISTS idx_anonymous_lists_topic ON anonymous_lists(topic_id);
CREATE INDEX IF NOT EXISTS idx_anonymous_lists_user ON anonymous_lists(user_hash);
CREATE INDEX IF NOT EXISTS idx_leaderboards_daily_topic_rank ON leaderboards_daily(topic_id, rank);
CREATE INDEX IF NOT EXISTS idx_leaderboards_lifetime_topic_rank ON leaderboards_lifetime(topic_id, rank);

-- Seed Initial Modular Topics
INSERT OR IGNORE INTO topics (id, name) VALUES
  ('food', 'Favourity Food'),
  ('movies', 'Favourity Movies'),
  ('video-games', 'Favourity Video Games'),
  ('tech', 'Favourity Tech');

-- Seed Initial Items for 'food'
INSERT OR IGNORE INTO items (id, topic_id, name) VALUES
  ('food_pizza', 'food', 'Artisan Neapolitan Pizza'),
  ('food_sushi', 'food', 'Fresh Nigiri Sushi'),
  ('food_tacos', 'food', 'Street Style Birria Tacos'),
  ('food_burger', 'food', 'Smash Cheeseburger'),
  ('food_ramen', 'food', 'Rich Tonkotsu Ramen'),
  ('food_pasta', 'food', 'Handmade Cacio e Pepe Pasta'),
  ('food_croissant', 'food', 'French Butter Croissant'),
  ('food_thai_curry', 'food', 'Authentic Green Thai Curry');

-- Seed Initial Items for 'movies'
INSERT OR IGNORE INTO items (id, topic_id, name) VALUES
  ('movie_interstellar', 'movies', 'Interstellar (2014)'),
  ('movie_inception', 'movies', 'Inception (2010)'),
  ('movie_dark_knight', 'movies', 'The Dark Knight (2008)'),
  ('movie_matrix', 'movies', 'The Matrix (1999)'),
  ('movie_spirited_away', 'movies', 'Spirited Away (2001)'),
  ('movie_godfather', 'movies', 'The Godfather (1972)'),
  ('movie_pulp_fiction', 'movies', 'Pulp Fiction (1994)'),
  ('movie_parasite', 'movies', 'Parasite (2019)');

-- Seed Initial Items for 'video-games'
INSERT OR IGNORE INTO items (id, topic_id, name) VALUES
  ('game_zelda_botw', 'video-games', 'The Legend of Zelda: Breath of the Wild'),
  ('game_elden_ring', 'video-games', 'Elden Ring'),
  ('game_witcher3', 'video-games', 'The Witcher 3: Wild Hunt'),
  ('game_portal2', 'video-games', 'Portal 2'),
  ('game_red_dead_2', 'video-games', 'Red Dead Redemption 2'),
  ('game_hollow_knight', 'video-games', 'Hollow Knight');

-- Seed Initial Items for 'tech'
INSERT OR IGNORE INTO items (id, topic_id, name) VALUES
  ('tech_macbook', 'tech', 'Apple Silicon MacBook Pro'),
  ('tech_mechanical_kb', 'tech', 'Custom Mechanical Keyboard'),
  ('tech_oled_monitor', 'tech', '4K OLED Ultra-wide Display'),
  ('tech_anc_headphones', 'tech', 'Flagship ANC Headphones'),
  ('tech_ergonomic_mouse', 'tech', 'Ergonomic Vertical Mouse');
