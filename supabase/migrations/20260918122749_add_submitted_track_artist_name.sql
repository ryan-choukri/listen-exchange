-- Store Spotify artist attribution separately from the track title.
-- Existing rows stay nullable and use an application-level fallback.
alter table public.submitted_tracks
  add column artist_name text;

alter table public.submitted_tracks
  add constraint submitted_tracks_artist_name_check
  check (
    artist_name is null
    or length(trim(artist_name)) between 1 and 300
  );

comment on column public.submitted_tracks.artist_name is
  'Artist name retrieved from Spotify metadata at submission time.';

-- Require artist metadata for all new submissions.
drop function if exists public.create_submitted_track(text, text, text, text[]);

create function public.create_submitted_track(
  p_track_id text,
  p_title text,
  p_artist_name text,
  p_cover_url text,
  p_genres text[]
)
returns table (
  success boolean,
  message text,
  submitted_track_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_submitted_track_id uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    return query select
      false,
      'You must be logged in to submit a track'::text,
      null::uuid;
    return;
  end if;

  if p_track_id is null or p_track_id !~ '^[A-Za-z0-9]{22}$' then
    return query select false, 'Invalid Spotify track ID'::text, null::uuid;
    return;
  end if;

  if p_title is null
    or length(trim(p_title)) = 0
    or length(trim(p_title)) > 500
  then
    return query select false, 'Invalid track title'::text, null::uuid;
    return;
  end if;

  if p_artist_name is null
    or length(trim(p_artist_name)) = 0
    or length(trim(p_artist_name)) > 300
  then
    return query select false, 'Invalid artist name'::text, null::uuid;
    return;
  end if;

  if p_cover_url is null or p_cover_url !~* '^https?://' then
    return query select false, 'Invalid cover URL'::text, null::uuid;
    return;
  end if;

  if p_genres is null
    or cardinality(p_genres) not between 1 and 3
    or array_position(p_genres, null) is not null
    or not (
      p_genres <@ array[
        'Pop',
        'Hip-Hop / Rap',
        'Electronic',
        'R&B / Soul',
        'Rock',
        'Latin',
        'Afrobeats',
        'Country',
        'Folk',
        'Jazz',
        'Classical',
        'Other'
      ]::text[]
    )
    or (
      select count(*) <> count(distinct selected_genre.genre)
      from unnest(p_genres) as selected_genre(genre)
    )
  then
    return query select false, 'Select between 1 and 3 valid genres'::text, null::uuid;
    return;
  end if;

  insert into public.submitted_tracks (
    user_id,
    track_id,
    title,
    artist_name,
    cover_url,
    credits_remaining,
    status,
    genres
  )
  values (
    v_user_id,
    p_track_id,
    trim(p_title),
    trim(p_artist_name),
    p_cover_url,
    0,
    'pending',
    p_genres
  )
  on conflict (user_id, track_id) do nothing
  returning id into v_submitted_track_id;

  if v_submitted_track_id is null then
    return query select
      false,
      'You have already submitted this track'::text,
      null::uuid;
    return;
  end if;

  return query select
    true,
    'Track submitted. Allocate credits to add it to Discovery.'::text,
    v_submitted_track_id;
end;
$$;

revoke all on function public.create_submitted_track(
  text, text, text, text, text[]
) from public, anon, authenticated;
grant execute on function public.create_submitted_track(
  text, text, text, text, text[]
) to authenticated, service_role;

-- A previously removed track receives fresh Spotify metadata when restored.
drop function if exists public.reactivate_submitted_track(uuid, text, text, text[]);

create function public.reactivate_submitted_track(
  p_track_id uuid,
  p_title text,
  p_artist_name text,
  p_cover_url text,
  p_genres text[]
)
returns table(
  success boolean,
  message text,
  reactivated_track_id uuid,
  status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_track_user_id uuid;
  v_track_status text;
  v_deleted_at timestamp with time zone;
begin
  if p_track_id is null then
    return query select false, 'Track ID is required'::text, null::uuid, null::text;
    return;
  end if;

  if p_title is null or length(trim(p_title)) = 0 or length(p_title) > 500 then
    return query select false, 'Invalid track title'::text, null::uuid, null::text;
    return;
  end if;

  if p_artist_name is null
    or length(trim(p_artist_name)) = 0
    or length(trim(p_artist_name)) > 300
  then
    return query select false, 'Invalid artist name'::text, null::uuid, null::text;
    return;
  end if;

  if p_cover_url is null or p_cover_url !~ '^https?://' then
    return query select false, 'Invalid cover URL'::text, null::uuid, null::text;
    return;
  end if;

  if p_genres is null
    or cardinality(p_genres) not between 1 and 3
    or array_position(p_genres, null) is not null
    or not (
      p_genres <@ array[
        'Pop',
        'Hip-Hop / Rap',
        'Electronic',
        'R&B / Soul',
        'Rock',
        'Latin',
        'Afrobeats',
        'Country',
        'Folk',
        'Jazz',
        'Classical',
        'Other'
      ]::text[]
    )
    or (
      select count(*) <> count(distinct selected_genre.genre)
      from unnest(p_genres) as selected_genre(genre)
    )
  then
    return query select false, 'Select between 1 and 3 valid genres'::text, null::uuid, null::text;
    return;
  end if;

  v_user_id := auth.uid();

  if v_user_id is null then
    return query select false, 'You must be signed in to submit a track'::text, null::uuid, null::text;
    return;
  end if;

  select st.user_id, st.status, st.deleted_at
  into v_track_user_id, v_track_status, v_deleted_at
  from public.submitted_tracks as st
  where st.id = p_track_id
  for update;

  if not found then
    return query select false, 'Track not found'::text, null::uuid, null::text;
    return;
  end if;

  if v_track_user_id <> v_user_id then
    return query select false, 'You can only reactivate your own tracks'::text, null::uuid, null::text;
    return;
  end if;

  if v_track_status <> 'deleted' or v_deleted_at is null then
    return query select false, 'You have already submitted this track'::text, p_track_id, v_track_status;
    return;
  end if;

  update public.submitted_tracks as st
  set title = trim(p_title),
      artist_name = trim(p_artist_name),
      cover_url = p_cover_url,
      credits_remaining = 0,
      status = 'pending',
      deleted_at = null,
      genres = p_genres
  where st.id = p_track_id;

  return query select
    true,
    'Track reactivated. Allocate listens to return it to Discovery.'::text,
    p_track_id,
    'pending'::text;
exception
  when others then
    return query select
      false,
      'The track could not be reactivated. Please try again.'::text,
      null::uuid,
      null::text;
end;
$$;

revoke all on function public.reactivate_submitted_track(
  uuid, text, text, text, text[]
) from public, anon, authenticated;
grant execute on function public.reactivate_submitted_track(
  uuid, text, text, text, text[]
) to authenticated, service_role;

-- Include artist attribution in the owner track list.
drop function if exists public.get_owner_submitted_tracks_with_feedbacks();

create function public.get_owner_submitted_tracks_with_feedbacks()
returns table (
  id uuid,
  track_id text,
  title text,
  artist_name text,
  cover_url text,
  created_at timestamptz,
  credits_remaining integer,
  status text,
  genres text[],
  feedback_count integer,
  feedbacks jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    st.id,
    st.track_id,
    st.title,
    st.artist_name,
    st.cover_url,
    st.created_at,
    st.credits_remaining,
    st.status,
    st.genres,
    coalesce(feedback_summary.feedback_count, 0)::integer as feedback_count,
    coalesce(feedback_summary.feedbacks, '[]'::jsonb) as feedbacks
  from public.submitted_tracks as st
  left join lateral (
    select
      count(*)::integer as feedback_count,
      jsonb_agg(
        jsonb_build_object(
          'id', tf.id,
          'feedback', tf.feedback,
          'created_at', tf.created_at
        )
        order by tf.created_at desc
      ) as feedbacks
    from public.track_feedbacks as tf
    where tf.track_id = st.track_id
  ) as feedback_summary on true
  where (select auth.uid()) is not null
    and st.user_id = (select auth.uid())
    and st.deleted_at is null
  order by st.created_at desc;
$$;

revoke all on function public.get_owner_submitted_tracks_with_feedbacks()
  from public, anon, authenticated;
grant execute on function public.get_owner_submitted_tracks_with_feedbacks()
  to authenticated, service_role;

-- Include artist attribution in the paginated Discover queue.
drop function if exists public.get_discover_tracks(
  integer, timestamp with time zone, uuid
);

create function public.get_discover_tracks(
  p_limit integer default 25,
  p_before_created_at timestamp with time zone default null,
  p_before_id uuid default null
)
returns table (
  id uuid,
  track_id text,
  title text,
  artist_name text,
  cover_url text,
  created_at timestamp with time zone,
  credits_remaining integer,
  status text,
  genres text[]
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    st.id,
    st.track_id,
    st.title,
    st.artist_name,
    st.cover_url,
    st.created_at,
    st.credits_remaining,
    st.status,
    st.genres
  from public.submitted_tracks as st
  cross join lateral (
    select auth.uid() as user_id
  ) as listener
  where listener.user_id is not null
    and st.status = 'active'
    and st.deleted_at is null
    and st.credits_remaining > 0
    and st.user_id <> listener.user_id
    and (
      (
        p_before_created_at is null
        and p_before_id is null
      )
      or (
        p_before_created_at is not null
        and p_before_id is not null
        and (st.created_at, st.id) < (p_before_created_at, p_before_id)
      )
    )
    and not exists (
      select 1
      from public.listening_sessions as ls
      where ls.user_id = listener.user_id
        and ls.spotify_track_id = st.track_id
        and ls.status = 'rewarded'
        and ls.rewarded_at is not null
    )
  order by st.created_at desc, st.id desc
  limit least(greatest(coalesce(p_limit, 25), 1), 50);
$$;

revoke all on function public.get_discover_tracks(
  integer, timestamp with time zone, uuid
) from public, anon, authenticated;
grant execute on function public.get_discover_tracks(
  integer, timestamp with time zone, uuid
) to authenticated, service_role;

-- Keep the existing superadmin read models aligned with the new column.
drop function if exists public.get_admin_tracks();

create function public.get_admin_tracks()
returns table (
  track_id uuid,
  title text,
  artist_name text,
  cover_url text,
  owner_email text,
  added_date timestamptz,
  status text,
  listens bigint,
  feedbacks bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.has_role('superadmin'::public.app_role) then
    raise exception 'Superadmin access required' using errcode = '42501';
  end if;

  return query
  select
    tracks.id,
    tracks.title,
    tracks.artist_name,
    tracks.cover_url,
    users.email::text,
    tracks.created_at,
    tracks.status,
    count(sessions.id) filter (
      where sessions.status in ('completed', 'rewarded')
    ),
    coalesce(feedback_counts.feedbacks, 0)
  from public.submitted_tracks as tracks
  left join auth.users as users on users.id = tracks.user_id
  left join public.listening_sessions as sessions
    on sessions.submitted_track_id = tracks.id
  left join (
    select feedbacks.track_id, count(*) as feedbacks
    from public.track_feedbacks as feedbacks
    group by feedbacks.track_id
  ) as feedback_counts on feedback_counts.track_id = tracks.track_id
  group by
    tracks.id,
    tracks.title,
    tracks.artist_name,
    tracks.cover_url,
    users.email,
    tracks.created_at,
    tracks.status,
    feedback_counts.feedbacks
  order by tracks.created_at desc
  limit 200;
end;
$$;

revoke all on function public.get_admin_tracks()
  from public, anon, authenticated;
grant execute on function public.get_admin_tracks()
  to authenticated, service_role;

drop function if exists public.get_admin_listening();

create function public.get_admin_listening()
returns table (
  session_id uuid,
  user_email text,
  track_title text,
  artist_name text,
  started_at timestamptz,
  validated_duration_ms bigint,
  status text,
  reward_status text,
  invalid_reason text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.has_role('superadmin'::public.app_role) then
    raise exception 'Superadmin access required' using errcode = '42501';
  end if;

  return query
  select
    sessions.id,
    users.email::text,
    tracks.title,
    tracks.artist_name,
    sessions.started_at,
    sessions.listened_ms,
    sessions.status,
    case
      when sessions.rewarded_at is not null then 'issued'
      when sessions.status = 'completed' then 'pending'
      else 'not_eligible'
    end,
    sessions.invalid_reason
  from public.listening_sessions as sessions
  left join auth.users as users on users.id = sessions.user_id
  left join public.submitted_tracks as tracks
    on tracks.id = sessions.submitted_track_id
  order by sessions.started_at desc
  limit 200;
end;
$$;

revoke all on function public.get_admin_listening()
  from public, anon, authenticated;
grant execute on function public.get_admin_listening()
  to authenticated, service_role;
