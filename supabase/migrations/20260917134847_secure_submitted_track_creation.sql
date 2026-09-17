-- Submitted tracks must be created through this RPC so ownership, credits and
-- initial status can never be supplied by the browser.
drop policy if exists "Users can insert their own tracks"
  on public.submitted_tracks;

revoke insert on table public.submitted_tracks from public, anon, authenticated;

create function public.create_submitted_track(
  p_track_id text,
  p_title text,
  p_cover_url text
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

  insert into public.submitted_tracks (
    user_id,
    track_id,
    title,
    cover_url,
    credits_remaining,
    status
  )
  values (
    v_user_id,
    p_track_id,
    trim(p_title),
    p_cover_url,
    0,
    'pending'
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

revoke all on function public.create_submitted_track(text, text, text)
  from public, anon;
grant execute on function public.create_submitted_track(text, text, text)
  to authenticated, service_role;
