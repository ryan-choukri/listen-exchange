-- Update submit_track_feedback RPC to handle track credits
-- Now integrates with the credit system:
-- - Checks if track has active credits
-- - Transfers credits from track to feedback author
-- - Records transaction
-- - Updates track status if credits depleted

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
  v_submitted_track_id UUID;
  v_track_owner_id UUID;
  v_track_credits_remaining INTEGER;
  v_track_status TEXT;
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
  
  -- Check if this track exists as a submitted track and if user owns it
  SELECT id, user_id, credits_remaining, status 
  INTO v_submitted_track_id, v_track_owner_id, v_track_credits_remaining, v_track_status
  FROM submitted_tracks
  WHERE track_id = p_track_id
  LIMIT 1;
  
  -- If track exists as a submitted track:
  IF v_submitted_track_id IS NOT NULL THEN
    -- User cannot feedback their own track
    IF v_track_owner_id = v_user_id THEN
      RETURN QUERY SELECT 
        FALSE::BOOLEAN,
        NULL::UUID,
        'You cannot give feedback on your own track'::TEXT,
        (SELECT credits FROM profiles WHERE id = v_user_id)::INTEGER;
      RETURN;
    END IF;
    
    -- Track must be active
    IF v_track_status != 'active' THEN
      RETURN QUERY SELECT 
        FALSE::BOOLEAN,
        NULL::UUID,
        'This track is not currently accepting feedback'::TEXT,
        (SELECT credits FROM profiles WHERE id = v_user_id)::INTEGER;
      RETURN;
    END IF;
    
    -- Track must have credits remaining
    IF v_track_credits_remaining <= 0 THEN
      RETURN QUERY SELECT 
        FALSE::BOOLEAN,
        NULL::UUID,
        'This track has no more credits available'::TEXT,
        (SELECT credits FROM profiles WHERE id = v_user_id)::INTEGER;
      RETURN;
    END IF;
  END IF;
  
  -- Insert feedback
  INSERT INTO track_feedbacks (user_id, track_id, feedback)
  VALUES (v_user_id, p_track_id, v_feedback_trimmed)
  RETURNING id INTO v_feedback_id;
  
  -- Award credit to feedback author
  UPDATE profiles
  SET credits = profiles.credits + 1
  WHERE id = v_user_id
  RETURNING credits INTO v_new_credits;
  
  -- If this is a submitted track, transfer credit and update track status
  IF v_submitted_track_id IS NOT NULL THEN
    -- Calculate new credits value
    v_track_credits_remaining := v_track_credits_remaining - 1;
    
    -- Decrease track credits
    UPDATE submitted_tracks
    SET credits_remaining = credits_remaining - 1,
        status = CASE 
          WHEN (credits_remaining - 1) <= 0 THEN 'pending'
          ELSE 'active'
        END
    WHERE id = v_submitted_track_id;
    
    -- Record feedback reward transaction for feedback author
    INSERT INTO credit_transactions (user_id, track_id, feedback_id, amount, type, description)
    VALUES (v_user_id, v_submitted_track_id, v_feedback_id, 1, 'feedback_reward',
      'Received credit for feedback on track');
  ELSE
    -- For non-submitted tracks, just record the transaction
    INSERT INTO credit_transactions (user_id, feedback_id, amount, type, description)
    VALUES (v_user_id, v_feedback_id, 1, 'feedback_reward',
      'Received credit for feedback');
  END IF;
  
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
