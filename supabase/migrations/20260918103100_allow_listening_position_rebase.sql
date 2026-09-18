-- A Spotify seek is a position discontinuity, not listened time. Keep the
-- verified duration, rebase the cursor, and let later coherent heartbeats
-- continue the same session.
create or replace function public.heartbeat_listening_session(
  p_session_id uuid,
  p_spotify_position_ms bigint,
  p_is_paused boolean,
  p_is_buffering boolean,
  p_playing_uri text
)
returns table (
  success boolean,
  status text,
  listened_ms bigint,
  min_duration_ms integer,
  heartbeat_interval_ms integer,
  message text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_session public.listening_sessions%rowtype;
  v_track public.submitted_tracks%rowtype;
  v_min_duration_ms integer;
  v_heartbeat_interval_ms integer;
  v_tolerance_ms integer;
  v_max_gap_ms integer;
  v_now timestamp with time zone := clock_timestamp();
  v_elapsed_ms bigint;
  v_position_delta bigint;
  v_valid_ms bigint := 0;
  v_new_listened_ms bigint;
  v_position_discontinuity boolean := false;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    return query select
      false, null::text, 0::bigint, null::integer, null::integer,
      'You must be signed in to continue listening.'::text;
    return;
  end if;

  if p_session_id is null
    or p_spotify_position_ms is null
    or p_spotify_position_ms < 0
    or p_spotify_position_ms > 86400000
    or p_is_paused is null
    or p_is_buffering is null
    or p_playing_uri is null
  then
    return query select
      false, null::text, 0::bigint, null::integer, null::integer,
      'Invalid playback information.'::text;
    return;
  end if;

  select
    lc.min_listen_duration_ms,
    lc.heartbeat_interval_ms,
    lc.heartbeat_tolerance_ms,
    lc.max_heartbeat_gap_ms
  into
    v_min_duration_ms,
    v_heartbeat_interval_ms,
    v_tolerance_ms,
    v_max_gap_ms
  from public.listening_config as lc
  where lc.id = true;

  select ls.*
  into v_session
  from public.listening_sessions as ls
  where ls.id = p_session_id
  for update;

  if not found or v_session.user_id <> v_user_id then
    return query select
      false, null::text, 0::bigint, v_min_duration_ms,
      v_heartbeat_interval_ms, 'Listening session not found.'::text;
    return;
  end if;

  v_min_duration_ms := v_session.required_listen_ms;

  if v_session.status in ('completed', 'rewarded') then
    return query select
      true, v_session.status, v_session.listened_ms, v_min_duration_ms,
      v_heartbeat_interval_ms, 'Listening already verified.'::text;
    return;
  end if;

  if v_session.status <> 'active' then
    return query select
      false, v_session.status, v_session.listened_ms, v_min_duration_ms,
      v_heartbeat_interval_ms,
      'This listening session is no longer valid.'::text;
    return;
  end if;

  select st.*
  into v_track
  from public.submitted_tracks as st
  where st.id = v_session.submitted_track_id;

  if not found
    or v_track.user_id = v_user_id
    or v_track.status <> 'active'
    or v_track.deleted_at is not null
    or v_track.credits_remaining <= 0
  then
    update public.listening_sessions as ls
    set status = 'invalid',
        invalid_reason = 'track_unavailable',
        updated_at = v_now
    where ls.id = v_session.id;

    return query select
      false, 'invalid'::text, v_session.listened_ms, v_min_duration_ms,
      v_heartbeat_interval_ms, 'This track is no longer available.'::text;
    return;
  end if;

  if p_playing_uri <> 'spotify:track:' || v_track.track_id
    or v_session.spotify_track_id <> v_track.track_id
  then
    update public.listening_sessions as ls
    set status = 'invalid',
        invalid_reason = 'track_mismatch',
        updated_at = v_now
    where ls.id = v_session.id;

    return query select
      false, 'invalid'::text, v_session.listened_ms, v_min_duration_ms,
      v_heartbeat_interval_ms, 'Spotify is playing a different track.'::text;
    return;
  end if;

  v_elapsed_ms := greatest(
    0,
    floor(
      extract(epoch from (v_now - v_session.last_heartbeat_at)) * 1000
    )::bigint
  );
  v_position_delta :=
    p_spotify_position_ms - v_session.last_spotify_position_ms;

  if v_session.paused_at is null and v_elapsed_ms > v_max_gap_ms then
    update public.listening_sessions as ls
    set status = 'invalid',
        invalid_reason = 'heartbeat_gap',
        updated_at = v_now
    where ls.id = v_session.id;

    return query select
      false, 'invalid'::text, v_session.listened_ms, v_min_duration_ms,
      v_heartbeat_interval_ms,
      'Playback was interrupted for too long. Start listening again.'::text;
    return;
  end if;

  if not p_is_paused and not p_is_buffering then
    v_position_discontinuity :=
      v_position_delta < -v_tolerance_ms
      or (
        v_session.paused_at is null
        and v_position_delta > v_elapsed_ms + v_tolerance_ms
      )
      or (
        v_session.paused_at is not null
        and v_position_delta > v_heartbeat_interval_ms + v_tolerance_ms
      );

    if v_position_discontinuity then
      update public.listening_sessions as ls
      set last_spotify_position_ms = p_spotify_position_ms,
          last_heartbeat_at = v_now,
          paused_at = null,
          invalid_reason = null,
          updated_at = v_now
      where ls.id = v_session.id;

      return query select
        true, 'active'::text, v_session.listened_ms, v_min_duration_ms,
        v_heartbeat_interval_ms,
        'Spotify position resynchronized.'::text;
      return;
    end if;

    if v_position_delta > 0 then
      if v_session.paused_at is null then
        v_valid_ms := least(v_position_delta, v_elapsed_ms);
      else
        v_valid_ms := least(
          v_position_delta,
          v_heartbeat_interval_ms::bigint
        );
      end if;
    end if;
  end if;

  v_new_listened_ms := least(
    v_session.listened_ms + v_valid_ms,
    v_min_duration_ms::bigint
  );

  if v_new_listened_ms >= v_min_duration_ms then
    update public.listening_sessions as ls
    set status = 'completed',
        listened_ms = v_new_listened_ms,
        last_spotify_position_ms = p_spotify_position_ms,
        last_heartbeat_at = v_now,
        paused_at = null,
        completed_at = v_now,
        invalid_reason = null,
        updated_at = v_now
    where ls.id = v_session.id;

    return query select
      true, 'completed'::text, v_new_listened_ms, v_min_duration_ms,
      v_heartbeat_interval_ms, 'Listening verified.'::text;
    return;
  end if;

  update public.listening_sessions as ls
  set listened_ms = v_new_listened_ms,
      last_spotify_position_ms = p_spotify_position_ms,
      last_heartbeat_at = v_now,
      paused_at = case
        when p_is_paused or p_is_buffering then v_now
        else null
      end,
      updated_at = v_now
  where ls.id = v_session.id;

  return query select
    true, 'active'::text, v_new_listened_ms, v_min_duration_ms,
    v_heartbeat_interval_ms,
    case
      when p_is_paused or p_is_buffering then 'Listening paused.'::text
      else 'Heartbeat accepted.'::text
    end;
end;
$$;

revoke all on function public.heartbeat_listening_session(
  uuid, bigint, boolean, boolean, text
) from public, anon;
grant execute on function public.heartbeat_listening_session(
  uuid, bigint, boolean, boolean, text
) to authenticated, service_role;
