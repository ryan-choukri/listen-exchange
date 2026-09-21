-- Expose the authoritative available-credit balance in the admin user list.
drop function if exists public.get_admin_users();

create function public.get_admin_users()
returns table (
  user_id uuid,
  email text,
  signup_date timestamp with time zone,
  credits integer,
  tracks bigint,
  valid_listens bigint,
  feedbacks bigint,
  status text
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
    users.id,
    users.email::text,
    users.created_at,
    coalesce(profiles.credits, 0),
    coalesce(track_counts.tracks, 0),
    coalesce(listen_counts.valid_listens, 0),
    coalesce(feedback_counts.feedbacks, 0),
    case
      when users.deleted_at is not null then 'deleted'
      when users.banned_until is not null and users.banned_until > now()
        then 'suspended'
      when users.email_confirmed_at is null then 'unconfirmed'
      else 'active'
    end
  from auth.users as users
  left join public.profiles as profiles on profiles.id = users.id
  left join (
    select
      submitted.user_id,
      count(*) filter (where submitted.status <> 'deleted') as tracks
    from public.submitted_tracks as submitted
    group by submitted.user_id
  ) as track_counts on track_counts.user_id = users.id
  left join (
    select sessions.user_id, count(*) as valid_listens
    from public.listening_sessions as sessions
    where sessions.status in ('completed', 'rewarded')
    group by sessions.user_id
  ) as listen_counts on listen_counts.user_id = users.id
  left join (
    select submitted.user_id, count(*) as feedbacks
    from public.track_feedbacks as submitted
    group by submitted.user_id
  ) as feedback_counts on feedback_counts.user_id = users.id
  order by users.created_at desc
  limit 200;
end;
$$;

revoke all on function public.get_admin_users()
  from public, anon, authenticated;
grant execute on function public.get_admin_users()
  to authenticated, service_role;

-- Adjust only the user's available balance. Credits already allocated to tracks
-- are intentionally outside the scope of this admin action.
create function public.adjust_admin_user_credits(
  p_user_id uuid,
  p_operation text,
  p_amount integer
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current_credits integer;
  v_new_credits bigint;
begin
  if not public.has_role('superadmin'::public.app_role) then
    raise exception 'Superadmin access required' using errcode = '42501';
  end if;

  if p_user_id is null then
    raise exception 'User ID is required' using errcode = '22023';
  end if;

  if p_operation is null or p_operation not in ('add', 'remove') then
    raise exception 'Operation must be add or remove' using errcode = '22023';
  end if;

  if p_amount is null or p_amount < 1 or p_amount > 1000000 then
    raise exception 'Amount must be between 1 and 1000000'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from auth.users as users
    where users.id = p_user_id
  ) then
    raise exception 'User not found' using errcode = 'P0002';
  end if;

  insert into public.profiles (id, credits)
  values (p_user_id, 0)
  on conflict (id) do nothing;

  select profiles.credits
  into v_current_credits
  from public.profiles as profiles
  where profiles.id = p_user_id
  for update;

  if p_operation = 'remove'
    and v_current_credits::bigint - p_amount < 0 then
    raise exception 'Removing this amount would make the balance negative'
      using errcode = '22003';
  end if;

  v_new_credits := case
    when p_operation = 'add' then v_current_credits::bigint + p_amount
    else v_current_credits::bigint - p_amount
  end;

  if v_new_credits > 2147483647 then
    raise exception 'Credit balance is too large' using errcode = '22003';
  end if;

  update public.profiles as profiles
  set credits = v_new_credits::integer,
      updated_at = clock_timestamp()
  where profiles.id = p_user_id
  returning profiles.credits into v_current_credits;

  return v_current_credits;
end;
$$;

revoke all on function public.adjust_admin_user_credits(uuid, text, integer)
  from public, anon, authenticated;
grant execute on function public.adjust_admin_user_credits(uuid, text, integer)
  to authenticated, service_role;
