-- Supabase Schema for INE Mock Store Price Tracker

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table 1: Tracked Products
CREATE TABLE IF NOT EXISTS tracked_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_product_id INT NOT NULL,
    slug VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    category VARCHAR(255),
    sku VARCHAR(100),
    selected_option_id VARCHAR(100) NOT NULL,
    selected_option_label VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_product_id, selected_option_id)
);

-- Table 2: Scrape Logs
CREATE TABLE IF NOT EXISTS scrape_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracked_product_id UUID REFERENCES tracked_products(id) ON DELETE CASCADE,
    store_product_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    selected_option VARCHAR(100) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    price NUMERIC(12, 2) NULL,
    stock INT NULL,
    outcome VARCHAR(50) NOT NULL CHECK (outcome IN ('success', 'retried', 'failed')),
    attempts INT NOT NULL DEFAULT 1,
    error_message TEXT NULL
);

-- Table 3: Price History
CREATE TABLE IF NOT EXISTS price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracked_product_id UUID REFERENCES tracked_products(id) ON DELETE CASCADE,
    store_product_id INT NOT NULL,
    selected_option VARCHAR(100) NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    stock INT NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scrape_logs_product ON scrape_logs(tracked_product_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_product ON price_history(tracked_product_id, recorded_at DESC);
