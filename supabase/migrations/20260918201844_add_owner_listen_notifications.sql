-- Existing profiles start at migration time so the first notification only
-- contains listens completed after this feature is enabled. New profiles use
-- the same default and therefore never inherit historical activity.
alter table public.profiles
  add column last_listen_notification_at timestamp with time zone
  not null default now();

create index listening_sessions_owner_notification_idx
  on public.listening_sessions (submitted_track_id, completed_at)
  where status in ('completed', 'rewarded')
    and completed_at is not null;

-- Claiming and advancing the notification cursor happen in one transaction.
-- The profile row lock serializes simultaneous checks from multiple tabs so a
-- completed listen can be announced at most once.
create or replace function public.claim_new_listen_notification()
returns table (
  listen_count bigint,
  track_count bigint,
  track_title text,
  latest_completed_at timestamp with time zone
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_cursor timestamp with time zone;
  v_checked_at timestamp with time zone := clock_timestamp();
  v_listen_count bigint := 0;
  v_track_count bigint := 0;
  v_track_title text;
  v_latest_completed_at timestamp with time zone;
begin
  if v_user_id is null then
    return;
  end if;

  select p.last_listen_notification_at
  into v_cursor
  from public.profiles as p
  where p.id = v_user_id
  for update;

  if not found then
    return;
  end if;

  select
    count(*),
    count(distinct ls.submitted_track_id),
    min(st.title),
    max(ls.completed_at)
  into
    v_listen_count,
    v_track_count,
    v_track_title,
    v_latest_completed_at
  from public.listening_sessions as ls
  inner join public.submitted_tracks as st
    on st.id = ls.submitted_track_id
  where st.user_id = v_user_id
    and ls.status in ('completed', 'rewarded')
    and ls.completed_at > v_cursor
    and ls.completed_at <= v_checked_at;

  if v_listen_count > 0 and v_latest_completed_at is not null then
    update public.profiles as p
    set last_listen_notification_at = v_latest_completed_at,
        updated_at = v_checked_at
    where p.id = v_user_id;
  end if;

  return query
  select
    v_listen_count,
    v_track_count,
    case when v_track_count = 1 then v_track_title else null end,
    v_latest_completed_at;
end;
$$;

revoke all on function public.claim_new_listen_notification()
  from public, anon;
grant execute on function public.claim_new_listen_notification()
  to authenticated, service_role;
