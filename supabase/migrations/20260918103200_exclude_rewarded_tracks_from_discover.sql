-- Discover must not offer the same Spotify track again once the current user
-- has actually received its listening reward. Incomplete, abandoned and
-- invalid sessions remain eligible.

create index if not exists listening_sessions_user_rewarded_spotify_idx
  on public.listening_sessions (user_id, spotify_track_id)
  where status = 'rewarded';

create function public.get_discover_tracks()
returns table (
  id uuid,
  track_id text,
  title text,
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
    and not exists (
      select 1
      from public.listening_sessions as ls
      where ls.user_id = listener.user_id
        and ls.spotify_track_id = st.track_id
        and ls.status = 'rewarded'
        and ls.rewarded_at is not null
    )
  order by st.created_at desc;
$$;

revoke all on function public.get_discover_tracks()
  from public, anon, authenticated;
grant execute on function public.get_discover_tracks()
  to authenticated, service_role;
