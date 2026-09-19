drop function if exists public.get_admin_tracks();

create function public.get_admin_tracks()
returns table (
  track_id uuid,
  spotify_track_id text,
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
    tracks.id as track_id,
    tracks.track_id as spotify_track_id,
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
    tracks.track_id,
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
