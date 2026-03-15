-- =============================================================================
-- Artha Database Initialization Script
-- =============================================================================
-- This script runs automatically when the PostgreSQL container starts for the
-- first time. It creates the initial schema, indexes, and seed data.
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- Schema Setup
-- =============================================================================

-- Create schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS public;

-- Set search path
SET search_path TO public;

-- =============================================================================
-- Better Auth Tables (Auto-created by Better Auth, but defined here for reference)
-- =============================================================================

-- Note: Better Auth will create these tables automatically when first run.
-- This section documents the expected schema structure.

COMMENT ON SCHEMA public IS 'Artha Finance Tracker - Better Auth + Application Tables';

-- =============================================================================
-- Application Seed Data
-- =============================================================================

-- Insert default categories for the single-owner system
-- These are common Indonesian expense/income categories

-- Income categories
INSERT INTO categories (id, name, type, created_at) VALUES
  (gen_random_uuid(), 'Salary', 'income', NOW()),
  (gen_random_uuid(), 'Freelance', 'income', NOW()),
  (gen_random_uuid(), 'Investments', 'income', NOW()),
  (gen_random_uuid(), 'Business', 'income', NOW()),
  (gen_random_uuid(), 'Gifts', 'income', NOW()),
  (gen_random_uuid(), 'Other Income', 'income', NOW())
ON CONFLICT DO NOTHING;

-- Expense categories
INSERT INTO categories (id, name, type, created_at) VALUES
  (gen_random_uuid(), 'Food & Dining', 'expense', NOW()),
  (gen_random_uuid(), 'Transportation', 'expense', NOW()),
  (gen_random_uuid(), 'Housing', 'expense', NOW()),
  (gen_random_uuid(), 'Utilities', 'expense', NOW()),
  (gen_random_uuid(), 'Healthcare', 'expense', NOW()),
  (gen_random_uuid(), 'Entertainment', 'expense', NOW()),
  (gen_random_uuid(), 'Shopping', 'expense', NOW()),
  (gen_random_uuid(), 'Education', 'expense', NOW()),
  (gen_random_uuid(), 'Savings', 'expense', NOW()),
  (gen_random_uuid(), 'Investments', 'expense', NOW()),
  (gen_random_uuid(), 'Travel', 'expense', NOW()),
  (gen_random_uuid(), 'Other Expense', 'expense', NOW())
ON CONFLICT DO NOTHING;

-- =============================================================================
-- Performance Optimization
-- =============================================================================

-- Analyze tables for query planner
ANALYZE categories;
ANALYZE transactions;

-- =============================================================================
-- Security Configuration
-- =============================================================================

-- Revoke public schema permissions for security
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC;

-- Grant permissions to the application user
GRANT USAGE ON SCHEMA public TO CURRENT_USER;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO CURRENT_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO CURRENT_USER;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO CURRENT_USER;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO CURRENT_USER;

-- =============================================================================
-- Documentation
-- =============================================================================

COMMENT ON TABLE categories IS 'Transaction categories - no user_id for single-owner system';
COMMENT ON TABLE transactions IS 'Financial transactions - no user_id for single-owner system';
