-- Expose only the safe display fields needed to mix application tracks
-- into the public Music Blog. Ownership and role data remain private.
create function public.get_public_music_blog_submitted_tracks()
returns table (
  id uuid,
  spotify_track_id text,
  title text,
  artist_name text,
  cover_url text,
  genres text[],
  nb_listens bigint,
  created_at timestamp with time zone
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    tracks.id,
    tracks.track_id,
    tracks.title,
    coalesce(nullif(btrim(tracks.artist_name), ''), 'Unknown artist'),
    tracks.cover_url,
    tracks.genres,
    (
      select count(*)
      from public.listening_sessions as sessions
      where sessions.submitted_track_id = tracks.id
        and sessions.status = 'rewarded'
        and sessions.rewarded_at is not null
    ) as nb_listens,
    tracks.created_at
  from public.submitted_tracks as tracks
  where tracks.status in ('active', 'pending')
    and tracks.deleted_at is null
    and not exists (
      select 1
      from public.user_roles as roles
      where roles.user_id = tracks.user_id
        and roles.role::text in ('superadmin', 'moderator')
    )
  order by tracks.created_at desc, tracks.id desc;
$$;

revoke all on function public.get_public_music_blog_submitted_tracks()
  from public, anon, authenticated;
grant execute on function public.get_public_music_blog_submitted_tracks()
  to anon, authenticated, service_role;

comment on function public.get_public_music_blog_submitted_tracks() is
  'Read-only public Music Blog projection of active and pending submitted tracks, excluding moderator-owned tracks.';
