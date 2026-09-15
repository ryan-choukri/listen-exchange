-- Add credit system to submitted_tracks table
-- Tracks can now have allocated credits that get rewarded to feedback authors

-- Add columns for credit tracking
ALTER TABLE submitted_tracks
ADD COLUMN IF NOT EXISTS credits_remaining INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending'));

-- Create index for filtering by status
CREATE INDEX IF NOT EXISTS idx_submitted_tracks_status ON submitted_tracks(status);

-- Create index for efficient queries of active tracks with remaining credits
CREATE INDEX IF NOT EXISTS idx_submitted_tracks_active_credits 
  ON submitted_tracks(status, credits_remaining) 
  WHERE status = 'active' AND credits_remaining > 0;

-- Add constraint to prevent negative credits
ALTER TABLE submitted_tracks
ADD CONSTRAINT credits_remaining_non_negative CHECK (credits_remaining >= 0);
