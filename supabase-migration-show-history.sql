-- Migration: Add show_history column to exercises table
-- Run this in the Supabase SQL Editor

ALTER TABLE exercises ADD COLUMN IF NOT EXISTS show_history BOOLEAN;

-- No default value set — NULL means "use category-based default"
-- Strength exercises: shown by default
-- Mobility/Warm Up exercises: hidden by default
