-- Create submitted_tracks table to store user-submitted Spotify tracks
-- Users submit tracks via the /submit page, which are then available in /discover
CREATE TABLE IF NOT EXISTS submitted_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id TEXT NOT NULL, -- Spotify track ID
  title TEXT NOT NULL, -- Track title from oEmbed
  cover_url TEXT NOT NULL, -- Album cover URL from oEmbed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate submissions: one user can only submit each track once
  UNIQUE(user_id, track_id)
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_submitted_tracks_user_id ON submitted_tracks(user_id);
CREATE INDEX IF NOT EXISTS idx_submitted_tracks_track_id ON submitted_tracks(track_id);

-- Enable RLS on submitted_tracks
ALTER TABLE submitted_tracks ENABLE ROW LEVEL SECURITY;

-- Create policies for submitted_tracks
-- Users can read all submitted tracks (needed for discovery)
CREATE POLICY "Anyone can read submitted tracks"
  ON submitted_tracks
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can only insert their own tracks
CREATE POLICY "Users can insert their own tracks"
  ON submitted_tracks
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can only delete their own tracks
CREATE POLICY "Users can delete their own tracks"
  ON submitted_tracks
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Users cannot update tracks (immutable once submitted)
CREATE POLICY "No updates on submitted tracks"
  ON submitted_tracks
  FOR UPDATE
  TO authenticated
  USING (FALSE)
  WITH CHECK (FALSE);
