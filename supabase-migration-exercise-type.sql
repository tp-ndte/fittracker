-- Migration: Add exercise_type column to exercises table
-- This supports time-based exercises (e.g., planks, wall sits) in addition to weight-based
-- Run this in the Supabase SQL Editor

ALTER TABLE exercises ADD COLUMN IF NOT EXISTS exercise_type TEXT NOT NULL DEFAULT 'weight';
