-- Paginate the eligible Discover queue with a stable keyset cursor.

create index if not exists submitted_tracks_discover_cursor_idx
  on public.submitted_tracks (created_at desc, id desc)
  where status = 'active'
    and deleted_at is null
    and credits_remaining > 0;

drop function public.get_discover_tracks();

create function public.get_discover_tracks(
  p_limit integer default 25,
  p_before_created_at timestamp with time zone default null,
  p_before_id uuid default null
)
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
