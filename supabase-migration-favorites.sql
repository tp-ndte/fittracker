-- FitTracker Favorites Migration
-- Run this in the Supabase SQL Editor to add favorite support to workouts

ALTER TABLE workouts ADD COLUMN IF NOT EXISTS favorite BOOLEAN NOT NULL DEFAULT false;
