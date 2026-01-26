-- Add is_public column to tags table
ALTER TABLE tags ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
