-- Reuse the existing atomic soft-delete/refund flow while allowing a verified
-- superadmin to remove a track owned by another user. Refunds always go to the
-- track owner, never to the acting admin.
create or replace function public.remove_submitted_track(p_track_id uuid)
returns table(
  success boolean,
  message text,
  listens_returned integer,
  credits_balance integer,
  status text,
  already_removed boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_owner_user_id uuid;
  v_locked_owner_user_id uuid;
  v_is_superadmin boolean := false;
  v_track_status text;
  v_deleted_at timestamp with time zone;
  v_listens_returned integer;
  v_credits_balance integer;
begin
  if p_track_id is null then
    return query select
      false,
      'Track ID is required'::text,
      0,
      null::integer,
      null::text,
      false;
    return;
  end if;

  if v_actor_user_id is null then
    return query select
      false,
      'You must be signed in to remove a track'::text,
      0,
      null::integer,
      null::text,
      false;
    return;
  end if;

  v_is_superadmin := public.has_role('superadmin'::public.app_role);

  -- Resolve the owner before locking so the existing profile -> track lock
  -- order remains consistent with the credit allocation RPCs.
  select tracks.user_id
  into v_owner_user_id
  from public.submitted_tracks as tracks
  where tracks.id = p_track_id;

  if not found then
    return query select
      false,
      'Track not found'::text,
      0,
      null::integer,
      null::text,
      false;
    return;
  end if;

  if v_owner_user_id <> v_actor_user_id and not v_is_superadmin then
    return query select
      false,
      'You can only remove your own tracks'::text,
      0,
      null::integer,
      null::text,
      false;
    return;
  end if;

  insert into public.profiles (id, credits)
  values (v_owner_user_id, 0)
  on conflict (id) do nothing;

  select profiles.credits
  into v_credits_balance
  from public.profiles as profiles
  where profiles.id = v_owner_user_id
  for update;

  select
    tracks.user_id,
    tracks.status,
    tracks.deleted_at,
    tracks.credits_remaining
  into
    v_locked_owner_user_id,
    v_track_status,
    v_deleted_at,
    v_listens_returned
  from public.submitted_tracks as tracks
  where tracks.id = p_track_id
  for update;

  if not found then
    return query select
      false,
      'Track not found'::text,
      0,
      v_credits_balance,
      null::text,
      false;
    return;
  end if;

  if v_locked_owner_user_id <> v_actor_user_id and not v_is_superadmin then
    return query select
      false,
      'You can only remove your own tracks'::text,
      0,
      null::integer,
      null::text,
      false;
    return;
  end if;

  if v_track_status = 'deleted' or v_deleted_at is not null then
    return query select
      true,
      case
        when v_locked_owner_user_id = v_actor_user_id
          then 'Track already removed. 0 listens returned to your balance.'
        else 'Track already removed. 0 listens returned to the owner balance.'
      end::text,
      0,
      v_credits_balance,
      'deleted'::text,
      true;
    return;
  end if;

  v_listens_returned := greatest(v_listens_returned, 0);

  if v_listens_returned > 0 then
    update public.profiles as profiles
    set credits = profiles.credits + v_listens_returned,
        updated_at = now()
    where profiles.id = v_locked_owner_user_id
    returning profiles.credits into v_credits_balance;
  end if;

  update public.submitted_tracks as tracks
  set credits_remaining = 0,
      status = 'deleted',
      deleted_at = now()
  where tracks.id = p_track_id;

  if v_listens_returned > 0 then
    insert into public.credit_transactions (
      user_id,
      track_id,
      amount,
      type,
      description
    )
    values (
      v_locked_owner_user_id,
      p_track_id,
      v_listens_returned,
      'refund',
      'Returned ' || v_listens_returned::text ||
        ' unused listen' || case when v_listens_returned = 1 then '' else 's' end ||
        ' when track was removed'
    );
  end if;

  return query select
    true,
    'Track removed. ' || v_listens_returned::text || ' listen' ||
      case when v_listens_returned = 1 then '' else 's' end ||
      case
        when v_locked_owner_user_id = v_actor_user_id
          then ' returned to your balance.'
        else ' returned to the owner balance.'
      end::text,
    v_listens_returned,
    v_credits_balance,
    'deleted'::text,
    false;
exception
  when others then
    return query select
      false,
      case
        when v_owner_user_id = v_actor_user_id
          then 'The track could not be removed. Your balance was not changed.'
        else 'The track could not be removed. The owner balance was not changed.'
      end::text,
      0,
      null::integer,
      null::text,
      false;
end;
$$;

revoke all on function public.remove_submitted_track(uuid)
  from public, anon, authenticated;
grant execute on function public.remove_submitted_track(uuid)
  to authenticated, service_role;
