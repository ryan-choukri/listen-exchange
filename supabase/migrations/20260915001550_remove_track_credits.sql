
-- Remove credits from a track (refund)
-- This allows users to reduce allocated credits and get them back
CREATE OR REPLACE FUNCTION public.remove_track_credits(
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
      'You can only remove credits from your own tracks'::TEXT,
      NULL::INTEGER,
      NULL::INTEGER,
      NULL::TEXT;
    RETURN;
  END IF;
  
  -- Check if track has enough credits to remove
  IF v_track_credits_remaining < p_amount THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      'Track has only ' || v_track_credits_remaining::TEXT || ' credits but you want to remove ' || p_amount::TEXT,
      NULL::INTEGER,
      v_track_credits_remaining,
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
  
  -- Add credits back to user profile
  UPDATE public.profiles AS pr
  SET credits = pr.credits + p_amount
  WHERE pr.id = v_user_id;
  
  -- Remove credits from track
  UPDATE public.submitted_tracks AS st
  SET credits_remaining = st.credits_remaining - p_amount
  WHERE st.id = p_track_id;
  
  -- Determine new status (becomes pending if no more credits)
  v_new_status := CASE 
    WHEN (v_track_credits_remaining - p_amount) > 0 THEN 'active'
    ELSE 'pending'
  END;
  
  -- Update track status if needed
  UPDATE public.submitted_tracks AS st
  SET status = v_new_status
  WHERE st.id = p_track_id;
  
  -- Record transaction as refund
  INSERT INTO public.credit_transactions (user_id, track_id, amount, type, description)
  VALUES (v_user_id, p_track_id, p_amount, 'refund', 
    'Removed ' || p_amount::TEXT || ' credits from track');
  
  -- Return success with new values
  RETURN QUERY SELECT 
    TRUE::BOOLEAN,
    'Credits removed successfully'::TEXT,
    (v_user_credits + p_amount)::INTEGER,
    (v_track_credits_remaining - p_amount)::INTEGER,
    v_new_status::TEXT;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT 
    FALSE::BOOLEAN,
    'An error occurred while removing credits: ' || SQLERRM::TEXT,
    NULL::INTEGER,
    NULL::INTEGER,
    NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

ALTER FUNCTION "public"."remove_track_credits"("p_track_id" "uuid", "p_amount" integer) OWNER TO "postgres";

-- Remove public execute permission
REVOKE EXECUTE ON FUNCTION public.remove_track_credits(UUID, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.remove_track_credits(UUID, INTEGER) FROM anon;

-- Grant to authenticated users only
GRANT EXECUTE ON FUNCTION public.remove_track_credits(UUID, INTEGER) TO authenticated;



