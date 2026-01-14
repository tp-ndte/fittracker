-- FitTracker Database Schema for Supabase
-- Run this in the Supabase SQL Editor

-- Exercises table (custom exercises created by users)
CREATE TABLE IF NOT EXISTS exercises (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  muscle_groups TEXT[] NOT NULL DEFAULT '{}',
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workouts table (saved workout plans)
CREATE TABLE IF NOT EXISTS workouts (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Strength',
  exercises JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table (completed gym sessions)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  date TEXT NOT NULL,
  name TEXT NOT NULL,
  exercises JSONB NOT NULL DEFAULT '[]',
  duration INTEGER,
  notes TEXT,
  workout_id TEXT,
  workout_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deleted exercises table (for soft-deleting built-in exercises)
CREATE TABLE IF NOT EXISTS deleted_exercises (
  id SERIAL PRIMARY KEY,
  device_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(device_id, exercise_id)
);

-- Create indexes for faster queries by device_id
CREATE INDEX IF NOT EXISTS idx_exercises_device_id ON exercises(device_id);
CREATE INDEX IF NOT EXISTS idx_workouts_device_id ON workouts(device_id);
CREATE INDEX IF NOT EXISTS idx_sessions_device_id ON sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_deleted_exercises_device_id ON deleted_exercises(device_id);

-- Enable Row Level Security (RLS)
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_exercises ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations for now (device-based, no auth)
-- These allow any client with the anon key to read/write their own data

CREATE POLICY "Allow all operations on exercises" ON exercises
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on workouts" ON workouts
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on sessions" ON sessions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on deleted_exercises" ON deleted_exercises
  FOR ALL USING (true) WITH CHECK (true);
