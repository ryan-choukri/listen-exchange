-- Create track_feedbacks table to store user feedback on tracks
-- Each user can give feedback on each track exactly once
CREATE TABLE IF NOT EXISTS track_feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id TEXT NOT NULL, -- Spotify track ID
  feedback TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one feedback per user per track
  UNIQUE(user_id, track_id),
  
  -- Validate feedback length (3-2000 chars)
  CONSTRAINT feedback_length CHECK (
    LENGTH(TRIM(feedback)) >= 3 AND 
    LENGTH(feedback) <= 2000
  )
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_track_feedbacks_user_id ON track_feedbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_track_feedbacks_track_id ON track_feedbacks(track_id);
CREATE INDEX IF NOT EXISTS idx_track_feedbacks_user_track ON track_feedbacks(user_id, track_id);

-- Enable RLS on track_feedbacks
ALTER TABLE track_feedbacks ENABLE ROW LEVEL SECURITY;

-- Create policies for track_feedbacks
-- Users can read their own feedbacks
CREATE POLICY "Users can read their own feedbacks"
  ON track_feedbacks
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Users cannot directly insert (must use RPC)
CREATE POLICY "No direct insert on feedbacks"
  ON track_feedbacks
  FOR INSERT
  TO authenticated
  WITH CHECK (FALSE);

-- Users cannot directly update
CREATE POLICY "No direct update on feedbacks"
  ON track_feedbacks
  FOR UPDATE
  TO authenticated
  USING (FALSE)
  WITH CHECK (FALSE);

-- Users cannot directly delete
CREATE POLICY "No direct delete on feedbacks"
  ON track_feedbacks
  FOR DELETE
  TO authenticated
  USING (FALSE);
