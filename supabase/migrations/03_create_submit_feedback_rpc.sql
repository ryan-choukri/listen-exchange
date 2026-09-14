-- RPC function to submit feedback and award credit atomically
-- This ensures that both operations succeed or both fail together
CREATE OR REPLACE FUNCTION public.submit_track_feedback(
  p_track_id TEXT,
  p_feedback TEXT
)
RETURNS TABLE(
  success BOOLEAN,
  feedback_id UUID,
  message TEXT,
  new_credits INTEGER
) AS $$
DECLARE
  v_user_id UUID;
  v_feedback_id UUID;
  v_feedback_trimmed TEXT;
  v_new_credits INTEGER;
BEGIN
  -- Get the authenticated user ID
  v_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      NULL::UUID,
      'User not authenticated'::TEXT,
      NULL::INTEGER;
    RETURN;
  END IF;
  
  -- Validate track_id
  IF p_track_id IS NULL OR LENGTH(TRIM(p_track_id)) = 0 THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      NULL::UUID,
      'Track ID cannot be empty'::TEXT,
      NULL::INTEGER;
    RETURN;
  END IF;
  
  -- Trim and validate feedback
  v_feedback_trimmed := TRIM(p_feedback);
  
  IF LENGTH(v_feedback_trimmed) < 3 THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      NULL::UUID,
      'Feedback must be at least 3 characters'::TEXT,
      NULL::INTEGER;
    RETURN;
  END IF;
  
  IF LENGTH(v_feedback_trimmed) > 2000 THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      NULL::UUID,
      'Feedback must be less than 2000 characters'::TEXT,
      NULL::INTEGER;
    RETURN;
  END IF;
  
  -- Check if user already gave feedback on this track
  IF EXISTS(
    SELECT 1 FROM track_feedbacks 
    WHERE user_id = v_user_id AND track_id = p_track_id
  ) THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      NULL::UUID,
      'You have already given feedback on this track'::TEXT,
      (SELECT credits FROM profiles WHERE id = v_user_id)::INTEGER;
    RETURN;
  END IF;
  
  -- Ensure user profile exists
  INSERT INTO profiles (id, credits)
  VALUES (v_user_id, 0)
  ON CONFLICT (id) DO NOTHING;
  
  -- Insert feedback (will fail if duplicate due to UNIQUE constraint, caught below)
  INSERT INTO track_feedbacks (user_id, track_id, feedback)
  VALUES (v_user_id, p_track_id, v_feedback_trimmed)
  RETURNING id INTO v_feedback_id;
  
  -- Award credit
  UPDATE profiles
  SET credits = credits + 1
  WHERE id = v_user_id
  RETURNING credits INTO v_new_credits;
  
  -- Return success
  RETURN QUERY SELECT 
    TRUE::BOOLEAN,
    v_feedback_id::UUID,
    'Feedback submitted successfully'::TEXT,
    v_new_credits::INTEGER;

EXCEPTION WHEN unique_violation THEN
  -- Handle race condition where feedback was already inserted
  RETURN QUERY SELECT 
    FALSE::BOOLEAN,
    NULL::UUID,
    'You have already given feedback on this track'::TEXT,
    (SELECT credits FROM profiles WHERE id = v_user_id)::INTEGER;

EXCEPTION WHEN OTHERS THEN
  -- Handle other errors
  RETURN QUERY SELECT 
    FALSE::BOOLEAN,
    NULL::UUID,
    'An error occurred while submitting feedback: ' || SQLERRM::TEXT,
    NULL::INTEGER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.submit_track_feedback(TEXT, TEXT) TO authenticated;
