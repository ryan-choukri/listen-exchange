-- Fix credit system RPC functions with proper locking, constraints, and security
-- This migration corrects:
-- 1. Concurrent access (FOR UPDATE locks)
-- 2. Correct INSERT ... RETURNING syntax
-- 3. Strict validation (only submitted tracks with status='active' and credits_remaining > 0)
-- 4. Proper security context (SECURITY DEFINER SET search_path = '')
-- 5. Proper column qualification (public.table_name)
-- 6. Proper permission grants (REVOKE PUBLIC, GRANT authenticated)

-- ===== ALLOCATE TRACK CREDITS RPC =====

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
  v_track_credits_remaining INTEGER;
  v_new_status TEXT;
BEGIN
  -- Validate inputs
  IF p_track_id IS NULL THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      'Track ID is required'::TEXT,
      NULL::INTEGER,
      NULL::INTEGER,
      NULL::TEXT;
    RETURN;
  END IF;
  
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      'Amount must be greater than 0'::TEXT,
      NULL::INTEGER,
      NULL::INTEGER,
      NULL::TEXT;
    RETURN;
  END IF;
  
  -- Get authenticated user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      'User not authenticated'::TEXT,
      NULL::INTEGER,
      NULL::INTEGER,
      NULL::TEXT;
    RETURN;
  END IF;
  
  -- Lock and retrieve user's profile
  SELECT pr.credits INTO v_user_credits
  FROM public.profiles AS pr
  WHERE pr.id = v_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    -- Create profile if missing (shouldn't happen, but defensive)
    INSERT INTO public.profiles (id, credits)
    VALUES (v_user_id, 0)
    ON CONFLICT (id) DO NOTHING;
    v_user_credits := 0;
  END IF;
  
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
  
  -- Lock and retrieve submitted track
  SELECT st.user_id, st.credits_remaining
  INTO v_track_user_id, v_track_credits_remaining
  FROM public.submitted_tracks AS st
  WHERE st.id = p_track_id
  FOR UPDATE;
  
  IF v_track_user_id IS NULL THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      'Track not found'::TEXT,
      NULL::INTEGER,
      NULL::INTEGER,
      NULL::TEXT;
    RETURN;
  END IF;
  
  -- Verify user owns the track
  IF v_track_user_id != v_user_id THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      'You can only allocate credits to your own tracks'::TEXT,
      NULL::INTEGER,
      NULL::INTEGER,
      NULL::TEXT;
    RETURN;
  END IF;
  
  -- Deduct credits from user profile
  UPDATE public.profiles AS pr
  SET credits = pr.credits - p_amount
  WHERE pr.id = v_user_id;
  
  -- Determine new status
  v_new_status := CASE 
    WHEN (v_track_credits_remaining + p_amount) > 0 THEN 'active'
    ELSE 'pending'
  END;
  
  -- Add credits to track
  UPDATE public.submitted_tracks AS st
  SET credits_remaining = st.credits_remaining + p_amount,
      status = v_new_status
  WHERE st.id = p_track_id;
  
  -- Record transaction
  INSERT INTO public.credit_transactions (user_id, track_id, amount, type, description)
  VALUES (v_user_id, p_track_id, -p_amount, 'track_allocation', 
    'Allocated ' || p_amount::TEXT || ' credits to track');
  
  -- Return success with new values
  RETURN QUERY SELECT 
    TRUE::BOOLEAN,
    'Credits allocated successfully'::TEXT,
    (v_user_credits - p_amount)::INTEGER,
    (v_track_credits_remaining + p_amount)::INTEGER,
    v_new_status::TEXT;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT 
    FALSE::BOOLEAN,
    'An error occurred while allocating credits: ' || SQLERRM::TEXT,
    NULL::INTEGER,
    NULL::INTEGER,
    NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Remove public execute permission
REVOKE EXECUTE ON FUNCTION public.allocate_track_credits(UUID, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.allocate_track_credits(UUID, INTEGER) FROM anon;

-- Grant to authenticated users only
GRANT EXECUTE ON FUNCTION public.allocate_track_credits(UUID, INTEGER) TO authenticated;

-- ===== SUBMIT TRACK FEEDBACK RPC (UPDATED FOR CREDIT SYSTEM) =====

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
  -- Validate feedback input
  IF p_feedback IS NULL THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      NULL::UUID,
      'Feedback cannot be empty'::TEXT,
      NULL::INTEGER;
    RETURN;
  END IF;
  
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
  
  -- Validate track_id
  IF p_track_id IS NULL OR LENGTH(TRIM(p_track_id)) = 0 THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      NULL::UUID,
      'Track ID cannot be empty'::TEXT,
      NULL::INTEGER;
    RETURN;
  END IF;
  
  -- Get authenticated user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      NULL::UUID,
      'User not authenticated'::TEXT,
      NULL::INTEGER;
    RETURN;
  END IF;
  
  -- Check if user already gave feedback on this track
  IF EXISTS(
    SELECT 1 FROM public.track_feedbacks tf
    WHERE tf.user_id = v_user_id AND tf.track_id = p_track_id
  ) THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      NULL::UUID,
      'You have already given feedback on this track'::TEXT,
      (SELECT pr.credits FROM public.profiles pr WHERE pr.id = v_user_id)::INTEGER;
    RETURN;
  END IF;
  
  -- Ensure user profile exists
  INSERT INTO public.profiles (id, credits)
  VALUES (v_user_id, 0)
  ON CONFLICT (id) DO NOTHING;
  
  -- Critical: Check if track exists in submitted_tracks and lock it
  -- This is the ONLY way to earn credits: the track must be submitted
  SELECT st.id, st.user_id, st.credits_remaining, st.status
  INTO v_submitted_track_id, v_track_owner_id, v_track_credits_remaining, v_track_status
  FROM public.submitted_tracks AS st
  WHERE st.track_id = p_track_id
  FOR UPDATE;
  
  -- If track is NOT a submitted track, refuse feedback entirely (NO credits for legacy feedback)
  IF v_submitted_track_id IS NULL THEN
    -- Insert feedback anyway (for record), but don't award credits
    INSERT INTO public.track_feedbacks (user_id, track_id, feedback)
    VALUES (v_user_id, p_track_id, v_feedback_trimmed)
    RETURNING id INTO v_feedback_id;
    
    -- Get current user credits (no change)
    SELECT pr.credits INTO v_new_credits
    FROM public.profiles pr
    WHERE pr.id = v_user_id;
    
    RETURN QUERY SELECT 
      TRUE::BOOLEAN,
      v_feedback_id::UUID,
      'Feedback submitted (no credits available for this track)'::TEXT,
      v_new_credits::INTEGER;
    RETURN;
  END IF;
  
  -- Track IS in submitted_tracks: validate credit conditions
  
  -- User cannot feedback their own track
  IF v_track_owner_id = v_user_id THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      NULL::UUID,
      'You cannot give feedback on your own track'::TEXT,
      (SELECT pr.credits FROM public.profiles pr WHERE pr.id = v_user_id)::INTEGER;
    RETURN;
  END IF;
  
  -- Track must be active
  IF v_track_status != 'active' THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      NULL::UUID,
      'This track is not currently accepting feedback'::TEXT,
      (SELECT pr.credits FROM public.profiles pr WHERE pr.id = v_user_id)::INTEGER;
    RETURN;
  END IF;
  
  -- Track must have credits remaining
  IF v_track_credits_remaining <= 0 THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      NULL::UUID,
      'This track has no more credits available'::TEXT,
      (SELECT pr.credits FROM public.profiles pr WHERE pr.id = v_user_id)::INTEGER;
    RETURN;
  END IF;
  
  -- All conditions met: proceed atomically
  
  -- 1. Insert feedback
  INSERT INTO public.track_feedbacks (user_id, track_id, feedback)
  VALUES (v_user_id, p_track_id, v_feedback_trimmed)
  RETURNING id INTO v_feedback_id;
  
  -- 2. Award credit to feedback author
  UPDATE public.profiles AS pr
  SET credits = pr.credits + 1
  WHERE pr.id = v_user_id
  RETURNING pr.credits INTO v_new_credits;
  
  -- 3. Decrement track credits
  UPDATE public.submitted_tracks AS st
  SET credits_remaining = st.credits_remaining - 1
  WHERE st.id = v_submitted_track_id;
  
  -- 4. Update track status if depleted
  UPDATE public.submitted_tracks AS st
  SET status = 'pending'
  WHERE st.id = v_submitted_track_id
    AND st.credits_remaining <= 0;
  
  -- 5. Record transaction
  INSERT INTO public.credit_transactions (user_id, track_id, feedback_id, amount, type, description)
  VALUES (v_user_id, v_submitted_track_id, v_feedback_id, 1, 'feedback_reward', 
    'Earned credit from feedback');
  
  RETURN QUERY SELECT 
    TRUE::BOOLEAN,
    v_feedback_id::UUID,
    'Feedback submitted successfully'::TEXT,
    v_new_credits::INTEGER;

EXCEPTION WHEN unique_violation THEN
  -- Duplicate feedback detected (race condition despite check above)
  RETURN QUERY SELECT 
    FALSE::BOOLEAN,
    NULL::UUID,
    'You have already given feedback on this track'::TEXT,
    (SELECT pr.credits FROM public.profiles pr WHERE pr.id = v_user_id)::INTEGER;
  WHEN OTHERS THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      NULL::UUID,
      'An error occurred: ' || SQLERRM::TEXT,
      NULL::INTEGER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Remove public execute permission
REVOKE EXECUTE ON FUNCTION public.submit_track_feedback(TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.submit_track_feedback(TEXT, TEXT) FROM anon;

-- Grant to authenticated users only
GRANT EXECUTE ON FUNCTION public.submit_track_feedback(TEXT, TEXT) TO authenticated;
