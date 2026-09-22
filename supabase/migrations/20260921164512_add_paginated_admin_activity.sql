-- Dedicated paginated activity feed for the admin activity page. The dashboard
-- keeps its small recent-activity preview while this endpoint returns at most
-- 100 events per request.

CREATE FUNCTION public.get_admin_activity(
  p_offset INTEGER DEFAULT 0,
  p_limit INTEGER DEFAULT 100
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  payload JSONB;
  safe_offset INTEGER := GREATEST(COALESCE(p_offset, 0), 0);
  safe_limit INTEGER := LEAST(GREATEST(COALESCE(p_limit, 100), 1), 100);
BEGIN
  IF NOT public.has_role('superadmin'::public.app_role) THEN
    RAISE EXCEPTION 'Superadmin access required' USING ERRCODE = '42501';
  END IF;

  WITH activity AS (
    SELECT
      'signup'::TEXT AS event_type,
      users.created_at AS occurred_at,
      users.email::TEXT AS actor_email,
      'New account'::TEXT AS title,
      users.email::TEXT AS detail,
      'active'::TEXT AS status
    FROM auth.users AS users

    UNION ALL

    SELECT
      'track_submitted',
      tracks.created_at,
      users.email::TEXT,
      'Track submitted',
      tracks.title,
      tracks.status
    FROM public.submitted_tracks AS tracks
    LEFT JOIN auth.users AS users ON users.id = tracks.user_id

    UNION ALL

    SELECT
      CASE
        WHEN sessions.status IN ('completed', 'rewarded')
          THEN 'listening_completed'
        ELSE 'listening_rejected'
      END,
      COALESCE(sessions.completed_at, sessions.updated_at),
      users.email::TEXT,
      CASE
        WHEN sessions.status IN ('completed', 'rewarded')
          THEN 'Listening completed'
        ELSE 'Listening rejected'
      END,
      COALESCE(tracks.title, sessions.spotify_track_id),
      sessions.status
    FROM public.listening_sessions AS sessions
    LEFT JOIN auth.users AS users ON users.id = sessions.user_id
    LEFT JOIN public.submitted_tracks AS tracks
      ON tracks.id = sessions.submitted_track_id
    WHERE sessions.status <> 'active'

    UNION ALL

    SELECT
      'feedback_submitted',
      feedbacks.created_at,
      users.email::TEXT,
      'Feedback submitted',
      COALESCE(track.title, feedbacks.track_id),
      'submitted'
    FROM public.track_feedbacks AS feedbacks
    LEFT JOIN auth.users AS users ON users.id = feedbacks.user_id
    LEFT JOIN LATERAL (
      SELECT submitted.title
      FROM public.submitted_tracks AS submitted
      WHERE submitted.track_id = feedbacks.track_id
      ORDER BY submitted.created_at
      LIMIT 1
    ) AS track ON TRUE

    UNION ALL

    SELECT
      'contact_message',
      messages.created_at,
      messages.email,
      'Contact message',
      messages.subject,
      messages.status
    FROM public.contact_messages AS messages
  ),
  paged_activity AS (
    SELECT *
    FROM activity
    ORDER BY occurred_at DESC, event_type, title, detail
    OFFSET safe_offset
    LIMIT safe_limit
  )
  SELECT JSONB_BUILD_OBJECT(
    'activities', COALESCE((
      SELECT JSONB_AGG(
        TO_JSONB(paged_activity)
        ORDER BY occurred_at DESC, event_type, title, detail
      )
      FROM paged_activity
    ), '[]'::JSONB),
    'total_count', (SELECT COUNT(*) FROM activity)
  ) INTO payload;

  RETURN payload;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_activity(INTEGER, INTEGER)
  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_admin_activity(INTEGER, INTEGER)
  TO authenticated, service_role;
