-- FitTracker Programs Migration
-- Run this in the Supabase SQL Editor to add program support

-- Programs table (training programs with sequential workouts)
CREATE TABLE IF NOT EXISTS programs (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  workouts JSONB NOT NULL DEFAULT '[]',
  last_completed_workout_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

-- Add program_id column to sessions table
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS program_id TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_programs_device_id ON programs(device_id);
CREATE INDEX IF NOT EXISTS idx_sessions_program_id ON sessions(program_id);

-- Enable RLS
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow all operations on programs" ON programs
  FOR ALL USING (true) WITH CHECK (true);
