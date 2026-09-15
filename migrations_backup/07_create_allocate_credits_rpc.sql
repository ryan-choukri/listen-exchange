-- RPC function to allocate credits to a track
-- This is the primary way users activate tracks for discovery
-- Ensures atomic operation: user credits decrease, track credits increase, status updates

CREATE OR REPLACE FUNCTION public.allocate_track_credits(
  p_track_id UUID,
  p_amount INTEGER
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  credits_balance INTEGER,
  credits_remaining INTEGER,
  status TEXT
) AS $$
DECLARE
  v_user_id UUID;
  v_track_user_id UUID;
  v_user_credits INTEGER;
  v_track_credits INTEGER;
  v_new_status TEXT;
BEGIN
  -- Get the authenticated user ID
  v_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      'User not authenticated'::TEXT,
      NULL::INTEGER,
      NULL::INTEGER,
      NULL::TEXT;
    RETURN;
  END IF;
  
  -- Validate amount
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      'Amount must be greater than 0'::TEXT,
      NULL::INTEGER,
      NULL::INTEGER,
      NULL::TEXT;
    RETURN;
  END IF;
  
  -- Validate track_id
  IF p_track_id IS NULL THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      'Track ID is required'::TEXT,
      NULL::INTEGER,
      NULL::INTEGER,
      NULL::TEXT;
    RETURN;
  END IF;
  
  -- Check if track exists and get its owner
  SELECT user_id INTO v_track_user_id
  FROM submitted_tracks
  WHERE id = p_track_id;
  
  IF v_track_user_id IS NULL THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      'Track not found'::TEXT,
      NULL::INTEGER,
      NULL::INTEGER,
      NULL::TEXT;
    RETURN;
  END IF;
  
  -- Check if user owns the track
  IF v_track_user_id != v_user_id THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      'You can only allocate credits to your own tracks'::TEXT,
      NULL::INTEGER,
      NULL::INTEGER,
      NULL::TEXT;
    RETURN;
  END IF;
  
  -- Get user's current credits
  SELECT credits INTO v_user_credits
  FROM profiles
  WHERE id = v_user_id;
  
  -- Check if user has enough credits
  IF v_user_credits < p_amount THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      'Insufficient credits. You have ' || v_user_credits::TEXT || ' but need ' || p_amount::TEXT,
      v_user_credits,
      NULL::INTEGER,
      NULL::TEXT;
    RETURN;
  END IF;
  
  -- Get current track credits
  SELECT submitted_tracks.credits_remaining INTO v_track_credits
  FROM submitted_tracks
  WHERE id = p_track_id;
  
  -- Start transaction: decrease user credits, increase track credits
  UPDATE profiles
  SET credits = profiles.credits - p_amount
  WHERE id = v_user_id;
  
  -- Determine new status: track becomes active if it has credits
  v_new_status := CASE 
    WHEN (v_track_credits + p_amount) > 0 THEN 'active'
    ELSE 'pending'
  END;
  
  -- Update track credits and status
  UPDATE submitted_tracks
  SET credits_remaining = submitted_tracks.credits_remaining + p_amount,
      status = v_new_status
  WHERE id = p_track_id;
  
  -- Record the transaction
  INSERT INTO credit_transactions (user_id, track_id, amount, type, description)
  VALUES (v_user_id, p_track_id, -p_amount, 'track_allocation', 
    'Allocated ' || p_amount::TEXT || ' credits to track');
  
  -- Return success with updated values
  RETURN QUERY SELECT 
    TRUE::BOOLEAN,
    'Credits allocated successfully'::TEXT,
    (v_user_credits - p_amount)::INTEGER,
    (v_track_credits + p_amount)::INTEGER,
    v_new_status::TEXT;

EXCEPTION WHEN OTHERS THEN
  -- Handle any errors - transaction rolls back automatically
  RETURN QUERY SELECT 
    FALSE::BOOLEAN,
    'An error occurred while allocating credits: ' || SQLERRM::TEXT,
    NULL::INTEGER,
    NULL::INTEGER,
    NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.allocate_track_credits(UUID, INTEGER) TO authenticated;
