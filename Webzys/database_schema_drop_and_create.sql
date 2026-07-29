-- ============================================
-- DROP AND RECREATE TABLES (Use this to reset)
-- ============================================
-- WARNING: This will DELETE all existing data!
-- Only use this for development/testing

-- Drop tables in reverse order (due to foreign keys)
DROP TABLE IF EXISTS website_media CASCADE;
DROP TABLE IF EXISTS website_blocks CASCADE;
DROP TABLE IF EXISTS website_pages CASCADE;
DROP TABLE IF EXISTS websites CASCADE;

-- ============================================
-- OPTION 1: SINGLE TABLE (Simplest - Recommended to start)
-- ============================================

CREATE TABLE websites (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('normal', 'appointza', 'resume')),
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_websites_user_id ON websites(user_id);
CREATE INDEX idx_websites_type ON websites(type);
CREATE INDEX idx_websites_created_at ON websites(created_at DESC);

-- ============================================
-- OPTION 2: NORMALIZED TABLES (3 Tables)
-- ============================================

-- Table 1: Websites
CREATE TABLE websites (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('normal', 'appointza', 'resume')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 2: Website Pages
CREATE TABLE website_pages (
  id BIGSERIAL PRIMARY KEY,
  website_id BIGINT NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  page_id VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(website_id, page_id)
);

-- Table 3: Website Blocks
CREATE TABLE website_blocks (
  id BIGSERIAL PRIMARY KEY,
  page_id BIGINT NOT NULL REFERENCES website_pages(id) ON DELETE CASCADE,
  block_id VARCHAR(100) NOT NULL,
  block_type VARCHAR(100) NOT NULL,
  data JSONB NOT NULL,
  visible BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(page_id, block_id)
);

-- Indexes for normalized approach
CREATE INDEX idx_website_pages_website_id ON website_pages(website_id);
CREATE INDEX idx_website_pages_page_id ON website_pages(page_id);
CREATE INDEX idx_website_blocks_page_id ON website_blocks(page_id);
CREATE INDEX idx_website_blocks_block_type ON website_blocks(block_type);
CREATE INDEX idx_website_blocks_visible ON website_blocks(visible);

-- ============================================
-- OPTIONAL: Media Table (if needed)
-- ============================================

CREATE TABLE website_media (
  id BIGSERIAL PRIMARY KEY,
  website_id BIGINT NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,
  name VARCHAR(255),
  size BIGINT,
  type VARCHAR(50),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_website_media_website_id ON website_media(website_id);

