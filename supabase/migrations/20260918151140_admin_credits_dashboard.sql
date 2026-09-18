-- Read-only credit overview for the existing superadmin dashboard.
-- Current balances come from the authoritative counters; transactions remain
-- the immutable history and are not replayed to rebuild those balances.
create function public.get_admin_credits()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  dashboard jsonb;
begin
  if not public.has_role('superadmin'::public.app_role) then
    raise exception 'Superadmin access required' using errcode = '42501';
  end if;

  with credit_totals as (
    select
      coalesce((select sum(profiles.credits) from public.profiles), 0)::bigint
        as available_credits,
      coalesce((
        select sum(tracks.credits_remaining)
        from public.submitted_tracks as tracks
      ), 0)::bigint as allocated_credits,
      (
        select count(*)
        from public.submitted_tracks as tracks
        where tracks.credits_remaining > 0
      )::bigint as funded_tracks
  ),
  top_tracks as (
    select
      tracks.id as track_id,
      tracks.title,
      tracks.artist_name,
      tracks.credits_remaining::bigint as credits_allocated
    from public.submitted_tracks as tracks
    where tracks.credits_remaining > 0
    order by tracks.credits_remaining desc, tracks.created_at asc
    limit 10
  ),
  top_users as (
    select
      profiles.id as user_id,
      users.email::text,
      profiles.credits::bigint as credits_available
    from public.profiles as profiles
    left join auth.users as users on users.id = profiles.id
    where profiles.credits > 0
    order by profiles.credits desc, profiles.created_at asc
    limit 10
  )
  select jsonb_build_object(
    'summary', jsonb_build_object(
      'available_credits', credit_totals.available_credits,
      'allocated_credits', credit_totals.allocated_credits,
      'total_credits',
        credit_totals.available_credits + credit_totals.allocated_credits,
      'funded_tracks', credit_totals.funded_tracks
    ),
    'top_tracks', coalesce((
      select jsonb_agg(
        to_jsonb(top_tracks)
        order by top_tracks.credits_allocated desc, top_tracks.title asc
      )
      from top_tracks
    ), '[]'::jsonb),
    'top_users', coalesce((
      select jsonb_agg(
        to_jsonb(top_users)
        order by top_users.credits_available desc, top_users.email asc
      )
      from top_users
    ), '[]'::jsonb)
  )
  into dashboard
  from credit_totals;

  return dashboard;
end;
$$;

revoke all on function public.get_admin_credits() from public, anon;
grant execute on function public.get_admin_credits()
  to authenticated, service_role;
