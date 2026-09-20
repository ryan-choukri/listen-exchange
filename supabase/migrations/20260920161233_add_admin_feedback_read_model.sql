-- Read-only feedback list for the existing superadmin dashboard.
CREATE INDEX IF NOT EXISTS idx_track_feedbacks_created_at
  ON public.track_feedbacks (created_at DESC);

CREATE FUNCTION public.get_admin_feedback()
RETURNS TABLE (
  feedback_id UUID,
  user_id UUID,
  user_email TEXT,
  track_id TEXT,
  track_title TEXT,
  artist_name TEXT,
  feedback TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.has_role('superadmin'::public.app_role) THEN
    RAISE EXCEPTION 'Superadmin access required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    feedbacks.id,
    feedbacks.user_id,
    users.email::TEXT,
    feedbacks.track_id,
    track.title,
    track.artist_name,
    feedbacks.feedback,
    feedbacks.created_at
  FROM public.track_feedbacks AS feedbacks
  LEFT JOIN auth.users AS users ON users.id = feedbacks.user_id
  LEFT JOIN LATERAL (
    SELECT
      submitted.title,
      submitted.artist_name
    FROM public.submitted_tracks AS submitted
    WHERE submitted.track_id = feedbacks.track_id
    ORDER BY submitted.created_at DESC
    LIMIT 1
  ) AS track ON TRUE
  ORDER BY feedbacks.created_at DESC
  LIMIT 200;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_feedback()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_feedback()
  TO authenticated, service_role;
