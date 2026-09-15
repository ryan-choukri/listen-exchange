-- Create credit_transactions table for audit trail
-- Tracks all credit movements: allocations, rewards, and penalties

CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id UUID REFERENCES submitted_tracks(id) ON DELETE SET NULL,
  feedback_id UUID REFERENCES track_feedbacks(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('feedback_reward', 'track_allocation', 'refund')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_track_id ON credit_transactions(track_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_feedback_id ON credit_transactions(feedback_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_created 
  ON credit_transactions(user_id, created_at);

-- Enable RLS on credit_transactions
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Users can read their own transactions
CREATE POLICY "Users can read their own credit transactions"
  ON credit_transactions
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- No direct write access (only via RPC)
CREATE POLICY "No direct insert on credit_transactions"
  ON credit_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (FALSE);

CREATE POLICY "No update on credit_transactions"
  ON credit_transactions
  FOR UPDATE
  TO authenticated
  USING (FALSE)
  WITH CHECK (FALSE);

CREATE POLICY "No delete on credit_transactions"
  ON credit_transactions
  FOR DELETE
  TO authenticated
  USING (FALSE);
