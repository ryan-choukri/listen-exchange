-- A deliberate Spotify pause must stop validation traffic without expiring the
-- active session. The next genuine playback progression resumes it.
alter table public.listening_sessions
  add column if not exists paused_at timestamp with time zone;

create or replace function public.start_listening_session(
  p_track_id uuid,
  p_spotify_position_ms bigint,
  p_playing_uri text
)
returns table (
  success boolean,
  session_id uuid,
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
  v_track public.submitted_tracks%rowtype;
  v_existing public.listening_sessions%rowtype;
  v_session_id uuid;
  v_min_duration_ms integer;
  v_heartbeat_interval_ms integer;
  v_tolerance_ms integer;
  v_max_gap_ms integer;
  v_gap_ms bigint;
  v_now timestamp with time zone := clock_timestamp();
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    return query select
      false, null::uuid, null::text, 0::bigint, null::integer, null::integer,
      'You must be signed in to start listening.'::text;
    return;
  end if;

  if p_track_id is null
    or p_spotify_position_ms is null
    or p_spotify_position_ms < 0
    or p_spotify_position_ms > 86400000
    or p_playing_uri is null
  then
    return query select
      false, null::uuid, null::text, 0::bigint, null::integer, null::integer,
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

  if not found then
    return query select
      false, null::uuid, null::text, 0::bigint, null::integer, null::integer,
      'Listening is temporarily unavailable.'::text;
    return;
  end if;

  select st.*
  into v_track
  from public.submitted_tracks as st
  where st.id = p_track_id
  for share;

  if not found then
    return query select
      false, null::uuid, null::text, 0::bigint, v_min_duration_ms,
      v_heartbeat_interval_ms, 'Track not found.'::text;
    return;
  end if;

  if v_track.user_id = v_user_id then
    return query select
      false, null::uuid, null::text, 0::bigint, v_min_duration_ms,
      v_heartbeat_interval_ms, 'You cannot earn a reward from your own track.'::text;
    return;
  end if;

  if v_track.status <> 'active'
    or v_track.deleted_at is not null
    or v_track.credits_remaining <= 0
  then
    return query select
      false, null::uuid, null::text, 0::bigint, v_min_duration_ms,
      v_heartbeat_interval_ms, 'This track is not currently available.'::text;
    return;
  end if;

  if p_playing_uri <> 'spotify:track:' || v_track.track_id then
    return query select
      false, null::uuid, null::text, 0::bigint, v_min_duration_ms,
      v_heartbeat_interval_ms, 'Spotify is playing a different track.'::text;
    return;
  end if;

  if exists (
    select 1
    from public.track_feedbacks as tf
    where tf.user_id = v_user_id
      and tf.track_id = v_track.track_id
  ) then
    return query select
      false, null::uuid, 'rewarded'::text, v_min_duration_ms::bigint,
      v_min_duration_ms, v_heartbeat_interval_ms,
      'You have already submitted feedback for this track.'::text;
    return;
  end if;

  select ls.*
  into v_existing
  from public.listening_sessions as ls
  where ls.user_id = v_user_id
    and ls.submitted_track_id = p_track_id
    and ls.status = 'completed'
  order by ls.completed_at desc
  limit 1;

  if found then
    return query select
      true, v_existing.id, v_existing.status, v_existing.listened_ms,
      v_existing.required_listen_ms, v_heartbeat_interval_ms,
      'Listening already verified.'::text;
    return;
  end if;

  select ls.*
  into v_existing
  from public.listening_sessions as ls
  where ls.user_id = v_user_id
    and ls.submitted_track_id = p_track_id
    and ls.status = 'active'
  order by ls.started_at desc
  limit 1
  for update;

  if found then
    v_gap_ms := floor(
      extract(epoch from (v_now - v_existing.last_heartbeat_at)) * 1000
    )::bigint;

    if (
      v_existing.paused_at is not null
      and abs(p_spotify_position_ms - v_existing.last_spotify_position_ms)
        <= v_heartbeat_interval_ms + v_tolerance_ms
    ) or (
      v_existing.paused_at is null
      and v_gap_ms <= v_max_gap_ms
      and abs(p_spotify_position_ms - v_existing.last_spotify_position_ms)
        <= v_tolerance_ms
    ) then
      return query select
        true, v_existing.id, v_existing.status, v_existing.listened_ms,
        v_existing.required_listen_ms, v_heartbeat_interval_ms,
        'Listening session resumed.'::text;
      return;
    end if;

    update public.listening_sessions as ls
    set status = 'abandoned',
        invalid_reason = 'playback_interrupted',
        updated_at = v_now
    where ls.id = v_existing.id;
  end if;

  insert into public.listening_sessions (
    user_id,
    submitted_track_id,
    spotify_track_id,
    status,
    started_at,
    last_heartbeat_at,
    required_listen_ms,
    listened_ms,
    last_spotify_position_ms,
    created_at,
    updated_at
  )
  values (
    v_user_id,
    p_track_id,
    v_track.track_id,
    'active',
    v_now,
    v_now,
    v_min_duration_ms,
    0,
    p_spotify_position_ms,
    v_now,
    v_now
  )
  returning id into v_session_id;

  return query select
    true, v_session_id, 'active'::text, 0::bigint, v_min_duration_ms,
    v_heartbeat_interval_ms, 'Listening session started.'::text;
exception
  when unique_violation then
    select ls.*
    into v_existing
    from public.listening_sessions as ls
    where ls.user_id = v_user_id
      and ls.submitted_track_id = p_track_id
      and ls.status in ('active', 'completed')
    order by ls.created_at desc
    limit 1;

    if found then
      return query select
        true, v_existing.id, v_existing.status, v_existing.listened_ms,
        v_existing.required_listen_ms, v_heartbeat_interval_ms,
        'Listening session already exists.'::text;
      return;
    end if;

    return query select
      false, null::uuid, null::text, 0::bigint, v_min_duration_ms,
      v_heartbeat_interval_ms, 'Listening session could not be started.'::text;
end;
$$;

revoke all on function public.start_listening_session(uuid, bigint, text)
  from public, anon;
grant execute on function public.start_listening_session(uuid, bigint, text)
  to authenticated, service_role;

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
    if v_position_delta < -v_tolerance_ms
      or (
        v_session.paused_at is null
        and v_position_delta > v_elapsed_ms + v_tolerance_ms
      )
      or (
        v_session.paused_at is not null
        and v_position_delta > v_heartbeat_interval_ms + v_tolerance_ms
      )
    then
      update public.listening_sessions as ls
      set status = 'invalid',
          invalid_reason = 'incoherent_position',
          updated_at = v_now
      where ls.id = v_session.id;

      return query select
        false, 'invalid'::text, v_session.listened_ms, v_min_duration_ms,
        v_heartbeat_interval_ms,
        'Playback progression was inconsistent. Start listening again.'::text;
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
