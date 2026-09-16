-- Preserve submitted-track history while refunding unused listens atomically.

alter table public.submitted_tracks
  add column if not exists deleted_at timestamp with time zone;

alter table public.submitted_tracks
  drop constraint if exists submitted_tracks_status_check;

alter table public.submitted_tracks
  add constraint submitted_tracks_status_check
  check (status = any (array['active'::text, 'pending'::text, 'deleted'::text]));

alter table public.submitted_tracks
  drop constraint if exists submitted_tracks_deleted_state_check;

alter table public.submitted_tracks
  add constraint submitted_tracks_deleted_state_check
  check (
    (status = 'deleted' and deleted_at is not null and credits_remaining = 0)
    or
    (status <> 'deleted' and deleted_at is null)
  );

create index if not exists idx_submitted_tracks_user_visible
  on public.submitted_tracks (user_id, created_at desc)
  where deleted_at is null;

-- Deleted and pending submissions are private to their owner. Other signed-in
-- users only need to read tracks that are currently available in discovery.
drop policy if exists "Anyone can read submitted tracks"
  on public.submitted_tracks;

drop policy if exists "Users can read available tracks and own submissions"
  on public.submitted_tracks;

create policy "Users can read available tracks and own submissions"
  on public.submitted_tracks
  for select
  to authenticated
  using (
    (select auth.uid()) = user_id
    or (
      deleted_at is null
      and status = 'active'
      and credits_remaining > 0
    )
  );

-- All removals must go through remove_submitted_track so a direct Data API
-- delete can never bypass the refund.
drop policy if exists "Users can delete their own tracks"
  on public.submitted_tracks;

drop policy if exists "No direct deletes on submitted tracks"
  on public.submitted_tracks;

create policy "No direct deletes on submitted tracks"
  on public.submitted_tracks
  for delete
  to authenticated
  using (false);

revoke delete on table public.submitted_tracks from anon, authenticated;

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
  v_user_id uuid;
  v_track_user_id uuid;
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

  v_user_id := auth.uid();

  if v_user_id is null then
    return query select
      false,
      'You must be signed in to remove a track'::text,
      0,
      null::integer,
      null::text,
      false;
    return;
  end if;

  -- Keep the lock order consistent with allocation RPCs: profile, then track.
  insert into public.profiles (id, credits)
  values (v_user_id, 0)
  on conflict (id) do nothing;

  select pr.credits
  into v_credits_balance
  from public.profiles as pr
  where pr.id = v_user_id
  for update;

  select st.user_id, st.status, st.deleted_at, st.credits_remaining
  into v_track_user_id, v_track_status, v_deleted_at, v_listens_returned
  from public.submitted_tracks as st
  where st.id = p_track_id
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

  if v_track_user_id <> v_user_id then
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
      'Track already removed. 0 listens returned to your balance.'::text,
      0,
      v_credits_balance,
      'deleted'::text,
      true;
    return;
  end if;

  v_listens_returned := greatest(v_listens_returned, 0);

  if v_listens_returned > 0 then
    update public.profiles as pr
    set credits = pr.credits + v_listens_returned,
        updated_at = now()
    where pr.id = v_user_id
    returning pr.credits into v_credits_balance;
  end if;

  update public.submitted_tracks as st
  set credits_remaining = 0,
      status = 'deleted',
      deleted_at = now()
  where st.id = p_track_id;

  if v_listens_returned > 0 then
    insert into public.credit_transactions (
      user_id,
      track_id,
      amount,
      type,
      description
    )
    values (
      v_user_id,
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
      ' returned to your balance.'::text,
    v_listens_returned,
    v_credits_balance,
    'deleted'::text,
    false;
exception
  when others then
    return query select
      false,
      'The track could not be removed. Your balance was not changed.'::text,
      0,
      null::integer,
      null::text,
      false;
end;
$$;

revoke execute on function public.remove_submitted_track(uuid) from public, anon;
grant execute on function public.remove_submitted_track(uuid) to authenticated, service_role;

create or replace function public.reactivate_submitted_track(
  p_track_id uuid,
  p_title text,
  p_cover_url text
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
      deleted_at = null
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

revoke execute on function public.reactivate_submitted_track(uuid, text, text) from public, anon;
grant execute on function public.reactivate_submitted_track(uuid, text, text) to authenticated, service_role;

-- Recreate allocation so deleted tracks cannot be reactivated by allocating
-- directly, and keep the lock order aligned with removal.
create or replace function public.allocate_track_credits(
  p_track_id uuid,
  p_amount integer
)
returns table(
  success boolean,
  message text,
  credits_balance integer,
  credits_remaining integer,
  status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_track_user_id uuid;
  v_user_credits integer;
  v_track_credits_remaining integer;
  v_track_status text;
  v_deleted_at timestamp with time zone;
begin
  if p_track_id is null then
    return query select false, 'Track ID is required'::text, null::integer, null::integer, null::text;
    return;
  end if;

  if p_amount is null or p_amount <= 0 then
    return query select false, 'Amount must be greater than 0'::text, null::integer, null::integer, null::text;
    return;
  end if;

  v_user_id := auth.uid();

  if v_user_id is null then
    return query select false, 'User not authenticated'::text, null::integer, null::integer, null::text;
    return;
  end if;

  insert into public.profiles (id, credits)
  values (v_user_id, 0)
  on conflict (id) do nothing;

  select pr.credits
  into v_user_credits
  from public.profiles as pr
  where pr.id = v_user_id
  for update;

  select st.user_id, st.credits_remaining, st.status, st.deleted_at
  into v_track_user_id, v_track_credits_remaining, v_track_status, v_deleted_at
  from public.submitted_tracks as st
  where st.id = p_track_id
  for update;

  if not found then
    return query select false, 'Track not found'::text, v_user_credits, null::integer, null::text;
    return;
  end if;

  if v_track_user_id <> v_user_id then
    return query select false, 'You can only allocate listens to your own tracks'::text, null::integer, null::integer, null::text;
    return;
  end if;

  if v_track_status = 'deleted' or v_deleted_at is not null then
    return query select false, 'Reactivate this track before allocating listens'::text, v_user_credits, 0, 'deleted'::text;
    return;
  end if;

  if v_user_credits < p_amount then
    return query select
      false,
      'Insufficient listens. You have ' || v_user_credits::text || ' but need ' || p_amount::text,
      v_user_credits,
      v_track_credits_remaining,
      v_track_status;
    return;
  end if;

  update public.profiles as pr
  set credits = pr.credits - p_amount,
      updated_at = now()
  where pr.id = v_user_id;

  update public.submitted_tracks as st
  set credits_remaining = st.credits_remaining + p_amount,
      status = 'active'
  where st.id = p_track_id;

  insert into public.credit_transactions (user_id, track_id, amount, type, description)
  values (
    v_user_id,
    p_track_id,
    -p_amount,
    'track_allocation',
    'Allocated ' || p_amount::text || ' listens to track'
  );

  return query select
    true,
    'Listens allocated successfully'::text,
    v_user_credits - p_amount,
    v_track_credits_remaining + p_amount,
    'active'::text;
exception
  when others then
    return query select false, 'The listens could not be allocated.'::text, null::integer, null::integer, null::text;
end;
$$;

revoke execute on function public.allocate_track_credits(uuid, integer) from public, anon;
grant execute on function public.allocate_track_credits(uuid, integer) to authenticated, service_role;

-- Keep manual listen refunds compatible with removal by using the same lock
-- order and by rejecting soft-deleted tracks.
create or replace function public.remove_track_credits(
  p_track_id uuid,
  p_amount integer
)
returns table(
  success boolean,
  message text,
  credits_balance integer,
  credits_remaining integer,
  status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_track_user_id uuid;
  v_user_credits integer;
  v_track_credits_remaining integer;
  v_track_status text;
  v_deleted_at timestamp with time zone;
  v_new_status text;
begin
  if p_track_id is null then
    return query select false, 'Track ID is required'::text, null::integer, null::integer, null::text;
    return;
  end if;

  if p_amount is null or p_amount <= 0 then
    return query select false, 'Amount must be greater than 0'::text, null::integer, null::integer, null::text;
    return;
  end if;

  v_user_id := auth.uid();

  if v_user_id is null then
    return query select false, 'User not authenticated'::text, null::integer, null::integer, null::text;
    return;
  end if;

  insert into public.profiles (id, credits)
  values (v_user_id, 0)
  on conflict (id) do nothing;

  select pr.credits
  into v_user_credits
  from public.profiles as pr
  where pr.id = v_user_id
  for update;

  select st.user_id, st.credits_remaining, st.status, st.deleted_at
  into v_track_user_id, v_track_credits_remaining, v_track_status, v_deleted_at
  from public.submitted_tracks as st
  where st.id = p_track_id
  for update;

  if not found then
    return query select false, 'Track not found'::text, v_user_credits, null::integer, null::text;
    return;
  end if;

  if v_track_user_id <> v_user_id then
    return query select false, 'You can only remove listens from your own tracks'::text, null::integer, null::integer, null::text;
    return;
  end if;

  if v_track_status = 'deleted' or v_deleted_at is not null then
    return query select false, 'This track has been removed'::text, v_user_credits, 0, 'deleted'::text;
    return;
  end if;

  if v_track_credits_remaining < p_amount then
    return query select
      false,
      'Track has only ' || v_track_credits_remaining::text || ' listens available',
      v_user_credits,
      v_track_credits_remaining,
      v_track_status;
    return;
  end if;

  update public.profiles as pr
  set credits = pr.credits + p_amount,
      updated_at = now()
  where pr.id = v_user_id;

  v_new_status := case
    when v_track_credits_remaining - p_amount > 0 then 'active'
    else 'pending'
  end;

  update public.submitted_tracks as st
  set credits_remaining = st.credits_remaining - p_amount,
      status = v_new_status
  where st.id = p_track_id;

  insert into public.credit_transactions (user_id, track_id, amount, type, description)
  values (
    v_user_id,
    p_track_id,
    p_amount,
    'refund',
    'Removed ' || p_amount::text || ' listens from track'
  );

  return query select
    true,
    'Listens returned successfully'::text,
    v_user_credits + p_amount,
    v_track_credits_remaining - p_amount,
    v_new_status;
exception
  when others then
    return query select false, 'The listens could not be returned.'::text, null::integer, null::integer, null::text;
end;
$$;

revoke execute on function public.remove_track_credits(uuid, integer) from public, anon;
grant execute on function public.remove_track_credits(uuid, integer) to authenticated, service_role;
