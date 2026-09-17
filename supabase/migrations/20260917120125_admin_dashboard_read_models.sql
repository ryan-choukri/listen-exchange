-- Read-only admin endpoints. Every function performs its own database-backed
-- superadmin check so it remains safe when called directly through PostgREST.

CREATE FUNCTION public.get_admin_overview()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  dashboard JSONB;
BEGIN
  IF NOT public.has_role('superadmin'::public.app_role) THEN
    RAISE EXCEPTION 'Superadmin access required' USING ERRCODE = '42501';
  END IF;

  WITH terminal_sessions AS (
    SELECT COUNT(*)::NUMERIC AS total
    FROM public.listening_sessions
    WHERE status IN ('completed', 'rewarded', 'invalid', 'abandoned')
  ),
  valid_sessions AS (
    SELECT COUNT(*)::NUMERIC AS total
    FROM public.listening_sessions
    WHERE status IN ('completed', 'rewarded')
  ),
  recent_activity AS (
    SELECT *
    FROM (
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
    ) AS events
    ORDER BY occurred_at DESC
    LIMIT 12
  )
  SELECT JSONB_BUILD_OBJECT(
    'kpis', JSONB_BUILD_OBJECT(
      'total_users', (
        SELECT COUNT(*) FROM auth.users WHERE deleted_at IS NULL
      ),
      'new_users_today', (
        SELECT COUNT(*)
        FROM auth.users
        WHERE deleted_at IS NULL
          AND created_at >= DATE_TRUNC('day', NOW())
      ),
      'total_tracks', (
        SELECT COUNT(*)
        FROM public.submitted_tracks
        WHERE status <> 'deleted'
      ),
      'valid_listens_today', (
        SELECT COUNT(*)
        FROM public.listening_sessions
        WHERE status IN ('completed', 'rewarded')
          AND completed_at >= DATE_TRUNC('day', NOW())
      ),
      'feedback_today', (
        SELECT COUNT(*)
        FROM public.track_feedbacks
        WHERE created_at >= DATE_TRUNC('day', NOW())
      ),
      'completion_rate', COALESCE(
        ROUND(
          100 * (SELECT total FROM valid_sessions)
          / NULLIF((SELECT total FROM terminal_sessions), 0),
          1
        ),
        0
      )
    ),
    'listening_system', JSONB_BUILD_OBJECT(
      'active_sessions', (
        SELECT COUNT(*)
        FROM public.listening_sessions
        WHERE status = 'active'
      ),
      'completed_today', (
        SELECT COUNT(*)
        FROM public.listening_sessions
        WHERE status IN ('completed', 'rewarded')
          AND completed_at >= DATE_TRUNC('day', NOW())
      ),
      'invalid_today', (
        SELECT COUNT(*)
        FROM public.listening_sessions
        WHERE status IN ('invalid', 'abandoned')
          AND updated_at >= DATE_TRUNC('day', NOW())
      ),
      'average_validated_duration_ms', COALESCE((
        SELECT ROUND(AVG(listened_ms))
        FROM public.listening_sessions
        WHERE status IN ('completed', 'rewarded')
      ), 0),
      'rewards_issued_today', (
        SELECT COUNT(*)
        FROM public.credit_transactions
        WHERE type = 'feedback_reward'
          AND created_at >= DATE_TRUNC('day', NOW())
      )
    ),
    'recent_activity', COALESCE((
      SELECT JSONB_AGG(TO_JSONB(recent_activity) ORDER BY occurred_at DESC)
      FROM recent_activity
    ), '[]'::JSONB)
  ) INTO dashboard;

  RETURN dashboard;
END;
$$;

CREATE FUNCTION public.get_admin_users()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  signup_date TIMESTAMPTZ,
  tracks BIGINT,
  valid_listens BIGINT,
  feedbacks BIGINT,
  status TEXT
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
    users.id,
    users.email::TEXT,
    users.created_at,
    COALESCE(track_counts.tracks, 0),
    COALESCE(listen_counts.valid_listens, 0),
    COALESCE(feedback_counts.feedbacks, 0),
    CASE
      WHEN users.deleted_at IS NOT NULL THEN 'deleted'
      WHEN users.banned_until IS NOT NULL AND users.banned_until > NOW()
        THEN 'suspended'
      WHEN users.email_confirmed_at IS NULL THEN 'unconfirmed'
      ELSE 'active'
    END
  FROM auth.users AS users
  LEFT JOIN (
    SELECT
      submitted.user_id,
      COUNT(*) FILTER (WHERE submitted.status <> 'deleted') AS tracks
    FROM public.submitted_tracks AS submitted
    GROUP BY submitted.user_id
  ) AS track_counts ON track_counts.user_id = users.id
  LEFT JOIN (
    SELECT sessions.user_id, COUNT(*) AS valid_listens
    FROM public.listening_sessions AS sessions
    WHERE sessions.status IN ('completed', 'rewarded')
    GROUP BY sessions.user_id
  ) AS listen_counts ON listen_counts.user_id = users.id
  LEFT JOIN (
    SELECT submitted.user_id, COUNT(*) AS feedbacks
    FROM public.track_feedbacks AS submitted
    GROUP BY submitted.user_id
  ) AS feedback_counts ON feedback_counts.user_id = users.id
  ORDER BY users.created_at DESC
  LIMIT 200;
END;
$$;

CREATE FUNCTION public.get_admin_tracks()
RETURNS TABLE (
  track_id UUID,
  title TEXT,
  cover_url TEXT,
  owner_email TEXT,
  added_date TIMESTAMPTZ,
  status TEXT,
  listens BIGINT,
  feedbacks BIGINT
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
    tracks.id,
    tracks.title,
    tracks.cover_url,
    users.email::TEXT,
    tracks.created_at,
    tracks.status,
    COUNT(sessions.id) FILTER (
      WHERE sessions.status IN ('completed', 'rewarded')
    ),
    COALESCE(feedback_counts.feedbacks, 0)
  FROM public.submitted_tracks AS tracks
  LEFT JOIN auth.users AS users ON users.id = tracks.user_id
  LEFT JOIN public.listening_sessions AS sessions
    ON sessions.submitted_track_id = tracks.id
  LEFT JOIN (
    SELECT feedbacks.track_id, COUNT(*) AS feedbacks
    FROM public.track_feedbacks AS feedbacks
    GROUP BY feedbacks.track_id
  ) AS feedback_counts ON feedback_counts.track_id = tracks.track_id
  GROUP BY
    tracks.id,
    tracks.title,
    tracks.cover_url,
    users.email,
    tracks.created_at,
    tracks.status,
    feedback_counts.feedbacks
  ORDER BY tracks.created_at DESC
  LIMIT 200;
END;
$$;

CREATE FUNCTION public.get_admin_listening()
RETURNS TABLE (
  session_id UUID,
  user_email TEXT,
  track_title TEXT,
  started_at TIMESTAMPTZ,
  validated_duration_ms BIGINT,
  status TEXT,
  reward_status TEXT,
  invalid_reason TEXT
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
    sessions.id,
    users.email::TEXT,
    tracks.title,
    sessions.started_at,
    sessions.listened_ms,
    sessions.status,
    CASE
      WHEN sessions.rewarded_at IS NOT NULL THEN 'issued'
      WHEN sessions.status = 'completed' THEN 'pending'
      ELSE 'not_eligible'
    END,
    sessions.invalid_reason
  FROM public.listening_sessions AS sessions
  LEFT JOIN auth.users AS users ON users.id = sessions.user_id
  LEFT JOIN public.submitted_tracks AS tracks
    ON tracks.id = sessions.submitted_track_id
  ORDER BY sessions.started_at DESC
  LIMIT 200;
END;
$$;

CREATE FUNCTION public.get_admin_messages()
RETURNS TABLE (
  message_id UUID,
  email TEXT,
  subject TEXT,
  created_at TIMESTAMPTZ,
  status TEXT
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
    messages.id,
    messages.email,
    messages.subject,
    messages.created_at,
    messages.status
  FROM public.contact_messages AS messages
  ORDER BY messages.created_at DESC
  LIMIT 200;
END;
$$;

CREATE FUNCTION public.get_admin_settings()
RETURNS TABLE (
  min_listen_duration_ms INTEGER,
  heartbeat_interval_ms INTEGER,
  heartbeat_tolerance_ms INTEGER,
  max_heartbeat_gap_ms INTEGER,
  updated_at TIMESTAMPTZ
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
    settings.min_listen_duration_ms,
    settings.heartbeat_interval_ms,
    settings.heartbeat_tolerance_ms,
    settings.max_heartbeat_gap_ms,
    settings.updated_at
  FROM public.listening_config AS settings
  WHERE settings.id = TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_overview() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_admin_users() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_admin_tracks() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_admin_listening() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_admin_messages() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_admin_settings() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_admin_overview()
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_users()
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_tracks()
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_listening()
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_messages()
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_settings()
  TO authenticated, service_role;
