-- A manual admin feedback earns its author the normal one-credit reward only
-- when the target track still has an allocated credit to consume. The profile
-- and track locks keep concurrent admin submissions atomic.
create or replace function public.create_admin_track_feedback(
  p_track_id uuid,
  p_feedback text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid;
  v_feedback text;
  v_feedback_id uuid;
  v_track public.submitted_tracks%rowtype;
begin
  v_admin_id := auth.uid();

  if v_admin_id is null
    or not public.has_role('superadmin'::public.app_role) then
    raise exception 'Superadmin access required' using errcode = '42501';
  end if;

  if p_track_id is null or p_feedback is null then
    raise exception 'Track and feedback are required' using errcode = '22023';
  end if;

  v_feedback := trim(p_feedback);

  if length(v_feedback) < 10 or length(v_feedback) > 500 then
    raise exception 'Feedback must contain between 10 and 500 characters'
      using errcode = '22023';
  end if;

  insert into public.profiles (id, credits)
  values (v_admin_id, 0)
  on conflict (id) do nothing;

  -- Keep the same lock order as the normal feedback reward flow.
  perform profiles.id
  from public.profiles as profiles
  where profiles.id = v_admin_id
  for update;

  select tracks.*
  into v_track
  from public.submitted_tracks as tracks
  where tracks.id = p_track_id
  for update;

  if not found then
    raise exception 'Track not found' using errcode = 'P0002';
  end if;

  insert into public.track_feedbacks (
    user_id,
    track_id,
    feedback,
    is_admin_manual
  )
  values (
    v_admin_id,
    v_track.track_id,
    v_feedback,
    true
  )
  returning id into v_feedback_id;

  if v_track.deleted_at is null
    and v_track.status <> 'deleted'
    and v_track.credits_remaining > 0 then
    update public.profiles as profiles
    set credits = profiles.credits + 1,
        updated_at = clock_timestamp()
    where profiles.id = v_admin_id;

    update public.submitted_tracks as tracks
    set credits_remaining = tracks.credits_remaining - 1,
        status = case
          when tracks.credits_remaining - 1 > 0 then 'active'
          else 'pending'
        end
    where tracks.id = v_track.id;

    insert into public.credit_transactions (
      user_id,
      track_id,
      feedback_id,
      amount,
      type,
      description
    )
    values (
      v_admin_id,
      v_track.id,
      v_feedback_id,
      1,
      'feedback_reward',
      'Earned credit from administrative feedback'
    );
  end if;

  return v_feedback_id;
end;
$$;

revoke all on function public.create_admin_track_feedback(uuid, text)
  from public, anon, authenticated;
grant execute on function public.create_admin_track_feedback(uuid, text)
  to authenticated, service_role;

-- Rewarded manual feedback uses the established atomic reversal. Manual
-- feedback created while the track had no credit remains content-only.
create or replace function public.delete_admin_feedback(p_feedback_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_is_admin_manual boolean;
  v_has_reward boolean;
  v_deleted_id uuid;
begin
  if not public.has_role('superadmin'::public.app_role) then
    raise exception 'Superadmin access required' using errcode = '42501';
  end if;

  if p_feedback_id is null then
    raise exception 'Feedback ID is required' using errcode = '22023';
  end if;

  select
    feedbacks.is_admin_manual,
    exists (
      select 1
      from public.credit_transactions as transactions
      where transactions.feedback_id = feedbacks.id
        and transactions.type = 'feedback_reward'
    )
  into v_is_admin_manual, v_has_reward
  from public.track_feedbacks as feedbacks
  where feedbacks.id = p_feedback_id;

  if not found or not v_is_admin_manual or v_has_reward then
    return public.delete_rewarded_admin_feedback(p_feedback_id);
  end if;

  delete from public.track_feedbacks as feedbacks
  where feedbacks.id = p_feedback_id
    and feedbacks.is_admin_manual = true
  returning feedbacks.id into v_deleted_id;

  if not found then
    return public.delete_rewarded_admin_feedback(p_feedback_id);
  end if;

  return jsonb_build_object(
    'success', true,
    'already_deleted', false,
    'credits_removed', 0,
    'bonus_removed', 0,
    'track_credit_restored', 0,
    'message', 'Administrative feedback deleted.'
  );
end;
$$;

revoke all on function public.delete_admin_feedback(uuid)
  from public, anon, authenticated;
grant execute on function public.delete_admin_feedback(uuid)
  to authenticated, service_role;
