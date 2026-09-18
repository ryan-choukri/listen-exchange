-- Store a small, validated set of genres on every submitted track.

alter table public.submitted_tracks
  add column genres text[];

update public.submitted_tracks
set genres = array['Other']::text[]
where genres is null or cardinality(genres) = 0;

alter table public.submitted_tracks
  alter column genres set default array['Other']::text[],
  alter column genres set not null;

alter table public.submitted_tracks
  add constraint submitted_tracks_genres_count_check
  check (cardinality(genres) between 1 and 3),
  add constraint submitted_tracks_genres_values_check
  check (
    array_position(genres, null) is null
    and genres <@ array[
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
  );

-- Remove the old overloads so callers cannot create or reactivate a track
-- without explicitly supplying a validated genre selection.
drop function if exists public.create_submitted_track(text, text, text);

create function public.create_submitted_track(
  p_track_id text,
  p_title text,
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
    cover_url,
    credits_remaining,
    status,
    genres
  )
  values (
    v_user_id,
    p_track_id,
    trim(p_title),
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

revoke all on function public.create_submitted_track(text, text, text, text[])
  from public, anon, authenticated;
grant execute on function public.create_submitted_track(text, text, text, text[])
  to authenticated, service_role;

drop function if exists public.reactivate_submitted_track(uuid, text, text);

create function public.reactivate_submitted_track(
  p_track_id uuid,
  p_title text,
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

revoke all on function public.reactivate_submitted_track(uuid, text, text, text[])
  from public, anon, authenticated;
grant execute on function public.reactivate_submitted_track(uuid, text, text, text[])
  to authenticated, service_role;
