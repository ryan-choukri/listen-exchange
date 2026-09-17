-- The database is the single source of truth for listening requirements.
-- Changing this row updates both server validation and the value displayed by
-- the frontend through get_listening_config().
create table public.listening_config (
  id boolean primary key default true,
  min_listen_duration_ms integer not null default 30000,
  heartbeat_interval_ms integer not null default 3000,
  heartbeat_tolerance_ms integer not null default 2000,
  max_heartbeat_gap_ms integer not null default 10000,
  updated_at timestamp with time zone not null default now(),
  constraint listening_config_singleton_check check (id),
  constraint listening_config_min_duration_check
    check (min_listen_duration_ms between 5000 and 600000),
  constraint listening_config_heartbeat_interval_check
    check (heartbeat_interval_ms between 1000 and 30000),
  constraint listening_config_heartbeat_tolerance_check
    check (heartbeat_tolerance_ms between 250 and 10000),
  constraint listening_config_max_gap_check
    check (
      max_heartbeat_gap_ms > heartbeat_interval_ms
      and max_heartbeat_gap_ms <= 60000
    )
);

insert into public.listening_config (
  id,
  min_listen_duration_ms,
  heartbeat_interval_ms,
  heartbeat_tolerance_ms,
  max_heartbeat_gap_ms
)
values (true, 30000, 3000, 2000, 10000);

alter table public.listening_config enable row level security;

revoke all on table public.listening_config from public, anon, authenticated;
grant select, insert, update, delete on table public.listening_config to service_role;

create table public.listening_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  submitted_track_id uuid not null references public.submitted_tracks(id) on delete restrict,
  spotify_track_id text not null,
  status text not null default 'active',
  started_at timestamp with time zone not null default clock_timestamp(),
  last_heartbeat_at timestamp with time zone not null default clock_timestamp(),
  required_listen_ms integer not null,
  listened_ms bigint not null default 0,
  last_spotify_position_ms bigint not null default 0,
  completed_at timestamp with time zone,
  rewarded_at timestamp with time zone,
  feedback_id uuid references public.track_feedbacks(id) on delete set null,
  invalid_reason text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint listening_sessions_status_check check (
    status = any (
      array[
        'active'::text,
        'completed'::text,
        'rewarded'::text,
        'invalid'::text,
        'abandoned'::text
      ]
    )
  ),
  constraint listening_sessions_listened_ms_check
    check (listened_ms >= 0),
  constraint listening_sessions_required_ms_check
    check (required_listen_ms between 5000 and 600000),
  constraint listening_sessions_position_check
    check (last_spotify_position_ms >= 0),
  constraint listening_sessions_completion_state_check check (
    (
      status in ('completed', 'rewarded')
      and completed_at is not null
    )
    or (
      status in ('active', 'invalid', 'abandoned')
      and completed_at is null
    )
  ),
  constraint listening_sessions_reward_state_check check (
    (
      status = 'rewarded'
      and rewarded_at is not null
      and feedback_id is not null
    )
    or (
      status <> 'rewarded'
      and rewarded_at is null
      and feedback_id is null
    )
  )
);

create unique index listening_sessions_one_active_per_track_idx
  on public.listening_sessions (user_id, submitted_track_id)
  where status = 'active';

create unique index listening_sessions_one_completion_per_track_idx
  on public.listening_sessions (user_id, submitted_track_id)
  where status in ('completed', 'rewarded');

create index listening_sessions_user_created_idx
  on public.listening_sessions (user_id, created_at desc);

create index listening_sessions_track_status_idx
  on public.listening_sessions (submitted_track_id, status);

alter table public.listening_sessions enable row level security;

-- Sessions are intentionally RPC-only. No direct Data API access is granted to
-- browser roles, and no anon/authenticated RLS policies are defined.
revoke all on table public.listening_sessions from public, anon, authenticated;
grant select, insert, update, delete on table public.listening_sessions to service_role;

alter table public.credit_transactions
  add column listening_session_id uuid
  references public.listening_sessions(id) on delete set null;

create unique index credit_transactions_feedback_reward_once_idx
  on public.credit_transactions (feedback_id)
  where type = 'feedback_reward' and feedback_id is not null;

create unique index credit_transactions_listening_reward_once_idx
  on public.credit_transactions (listening_session_id)
  where type = 'feedback_reward' and listening_session_id is not null;

create or replace function public.get_listening_config()
returns table (
  min_listen_duration_ms integer,
  heartbeat_interval_ms integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    return;
  end if;

  return query
  select
    lc.min_listen_duration_ms,
    lc.heartbeat_interval_ms
  from public.listening_config as lc
  where lc.id = true;
end;
$$;

revoke all on function public.get_listening_config() from public, anon;
grant execute on function public.get_listening_config() to authenticated, service_role;

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

    if v_gap_ms <= v_max_gap_ms
      and abs(p_spotify_position_ms - v_existing.last_spotify_position_ms)
        <= v_tolerance_ms
    then
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

  -- Each session snapshots the backend requirement that was active when it
  -- started. Updating listening_config affects new sessions without breaking
  -- a listen already in progress.
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

  if v_elapsed_ms > v_max_gap_ms then
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

  v_position_delta :=
    p_spotify_position_ms - v_session.last_spotify_position_ms;

  if not p_is_paused and not p_is_buffering then
    if v_position_delta < -v_tolerance_ms
      or v_position_delta > v_elapsed_ms + v_tolerance_ms
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
      v_valid_ms := least(v_position_delta, v_elapsed_ms);
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
      updated_at = v_now
  where ls.id = v_session.id;

  return query select
    true, 'active'::text, v_new_listened_ms, v_min_duration_ms,
    v_heartbeat_interval_ms, 'Heartbeat accepted.'::text;
end;
$$;

revoke all on function public.heartbeat_listening_session(
  uuid, bigint, boolean, boolean, text
) from public, anon;
grant execute on function public.heartbeat_listening_session(
  uuid, bigint, boolean, boolean, text
) to authenticated, service_role;

create or replace function public.abandon_listening_session(
  p_session_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is null or p_session_id is null then
    return false;
  end if;

  update public.listening_sessions as ls
  set status = 'abandoned',
      invalid_reason = 'listener_reset',
      updated_at = clock_timestamp()
  where ls.id = p_session_id
    and ls.user_id = v_user_id
    and ls.status = 'active';

  return found;
end;
$$;

revoke all on function public.abandon_listening_session(uuid)
  from public, anon;
grant execute on function public.abandon_listening_session(uuid)
  to authenticated, service_role;

-- The previous two-argument function awarded a credit without requiring a
-- verified listening session. Remove that public entry point entirely.
drop function public.submit_track_feedback(text, text);

create function public.submit_track_feedback(
  p_listening_session_id uuid,
  p_feedback text
)
returns table (
  success boolean,
  feedback_id uuid,
  message text,
  new_credits integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_feedback_trimmed text;
  v_feedback_id uuid;
  v_new_credits integer;
  v_submitted_track_id uuid;
  v_session public.listening_sessions%rowtype;
  v_track public.submitted_tracks%rowtype;
  v_min_duration_ms integer;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    return query select
      false, null::uuid, 'User not authenticated.'::text, null::integer;
    return;
  end if;

  if p_listening_session_id is null or p_feedback is null then
    return query select
      false, null::uuid, 'A verified listen and feedback are required.'::text,
      null::integer;
    return;
  end if;

  v_feedback_trimmed := trim(p_feedback);

  if length(v_feedback_trimmed) < 10 then
    return query select
      false, null::uuid, 'Feedback must be at least 10 characters.'::text,
      null::integer;
    return;
  end if;

  if length(v_feedback_trimmed) > 500 then
    return query select
      false, null::uuid, 'Feedback must be 500 characters or fewer.'::text,
      null::integer;
    return;
  end if;

  select ls.submitted_track_id
  into v_submitted_track_id
  from public.listening_sessions as ls
  where ls.id = p_listening_session_id
    and ls.user_id = v_user_id;

  if not found then
    return query select
      false, null::uuid, 'Verified listening session not found.'::text,
      null::integer;
    return;
  end if;

  insert into public.profiles (id, credits)
  values (v_user_id, 0)
  on conflict (id) do nothing;

  -- Match the lock order used by allocation/removal RPCs: profile, track,
  -- then listening session. This prevents concurrent double rewards and avoids
  -- deadlocks with track deletion or credit allocation.
  select pr.credits
  into v_new_credits
  from public.profiles as pr
  where pr.id = v_user_id
  for update;

  select st.*
  into v_track
  from public.submitted_tracks as st
  where st.id = v_submitted_track_id
  for update;

  if not found then
    return query select
      false, null::uuid, 'Track not found.'::text, v_new_credits;
    return;
  end if;

  select ls.*
  into v_session
  from public.listening_sessions as ls
  where ls.id = p_listening_session_id
    and ls.user_id = v_user_id
  for update;

  if not found then
    return query select
      false, null::uuid, 'Verified listening session not found.'::text,
      v_new_credits;
    return;
  end if;

  v_min_duration_ms := v_session.required_listen_ms;

  if v_session.status = 'rewarded' then
    return query select
      false, v_session.feedback_id,
      'This listening reward has already been claimed.'::text,
      v_new_credits;
    return;
  end if;

  if v_session.status <> 'completed'
    or v_session.completed_at is null
    or v_session.listened_ms < v_min_duration_ms
  then
    return query select
      false, null::uuid,
      'Complete the verified listening time before submitting feedback.'::text,
      v_new_credits;
    return;
  end if;

  if v_track.id <> v_session.submitted_track_id
    or v_track.track_id <> v_session.spotify_track_id
  then
    return query select
      false, null::uuid, 'Listening session does not match this track.'::text,
      v_new_credits;
    return;
  end if;

  if v_track.user_id = v_user_id then
    return query select
      false, null::uuid, 'You cannot reward your own track.'::text,
      v_new_credits;
    return;
  end if;

  if v_track.status <> 'active'
    or v_track.deleted_at is not null
    or v_track.credits_remaining <= 0
  then
    return query select
      false, null::uuid,
      'This track is no longer accepting feedback rewards.'::text,
      v_new_credits;
    return;
  end if;

  if exists (
    select 1
    from public.track_feedbacks as tf
    where tf.user_id = v_user_id
      and tf.track_id = v_track.track_id
  ) then
    return query select
      false, null::uuid,
      'You have already given feedback on this track.'::text,
      v_new_credits;
    return;
  end if;

  insert into public.track_feedbacks (user_id, track_id, feedback)
  values (v_user_id, v_track.track_id, v_feedback_trimmed)
  returning id into v_feedback_id;

  update public.profiles as pr
  set credits = pr.credits + 1,
      updated_at = clock_timestamp()
  where pr.id = v_user_id
  returning pr.credits into v_new_credits;

  update public.submitted_tracks as st
  set credits_remaining = st.credits_remaining - 1,
      status = case
        when st.credits_remaining - 1 > 0 then 'active'
        else 'pending'
      end
  where st.id = v_track.id;

  insert into public.credit_transactions (
    user_id,
    track_id,
    feedback_id,
    listening_session_id,
    amount,
    type,
    description
  )
  values (
    v_user_id,
    v_track.id,
    v_feedback_id,
    v_session.id,
    1,
    'feedback_reward',
    'Earned credit from verified listening feedback'
  );

  update public.listening_sessions as ls
  set status = 'rewarded',
      feedback_id = v_feedback_id,
      rewarded_at = clock_timestamp(),
      updated_at = clock_timestamp()
  where ls.id = v_session.id;

  return query select
    true, v_feedback_id, 'Feedback submitted successfully.'::text,
    v_new_credits;
exception
  when unique_violation then
    select pr.credits
    into v_new_credits
    from public.profiles as pr
    where pr.id = v_user_id;

    return query select
      false, null::uuid,
      'This feedback or listening reward has already been submitted.'::text,
      v_new_credits;
  when others then
    return query select
      false, null::uuid,
      'The feedback reward could not be completed.'::text,
      null::integer;
end;
$$;

revoke all on function public.submit_track_feedback(uuid, text)
  from public, anon;
grant execute on function public.submit_track_feedback(uuid, text)
  to authenticated, service_role;
