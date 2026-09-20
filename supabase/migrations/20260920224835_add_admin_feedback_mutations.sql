-- Administrative feedback mutations stay behind the existing database role
-- check. Feedback edits are content-only; deletes reverse the authoritative
-- reward transaction and listening-session state atomically.

-- A reviewer may already have spent a reward before an administrator removes
-- its feedback. Allow the exact reversal to leave a temporary negative balance;
-- normal allocation RPCs already reject spending more than the current balance,
-- and future rewards naturally repay that balance.
alter table public.profiles
  drop constraint if exists credits_non_negative;

comment on column public.profiles.credits is
  'Available credit balance. May be negative only after an administrative reward reversal.';

create function public.update_admin_feedback(
  p_feedback_id uuid,
  p_feedback text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_feedback text;
begin
  if not public.has_role('superadmin'::public.app_role) then
    raise exception 'Superadmin access required' using errcode = '42501';
  end if;

  if p_feedback_id is null then
    raise exception 'Feedback ID is required' using errcode = '22023';
  end if;

  if p_feedback is null then
    raise exception 'Feedback is required' using errcode = '22023';
  end if;

  v_feedback := trim(p_feedback);

  if length(v_feedback) < 10 or length(v_feedback) > 500 then
    raise exception 'Feedback must contain between 10 and 500 characters'
      using errcode = '22023';
  end if;

  update public.track_feedbacks as feedbacks
  set feedback = v_feedback
  where feedbacks.id = p_feedback_id
  returning feedbacks.feedback into v_feedback;

  if not found then
    raise exception 'Feedback not found' using errcode = 'P0002';
  end if;

  return v_feedback;
end;
$$;

revoke all on function public.update_admin_feedback(uuid, text)
  from public, anon, authenticated;
grant execute on function public.update_admin_feedback(uuid, text)
  to authenticated, service_role;

create function public.delete_admin_feedback(p_feedback_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reviewer_id uuid;
  v_locked_reviewer_id uuid;
  v_track_id uuid;
  v_track_owner_id uuid;
  v_track_status text;
  v_track_deleted_at timestamp with time zone;
  v_session_id uuid;
  v_reward_transaction_id uuid;
  v_transfer_transaction_id uuid;
  v_reward_amount integer;
  v_feedback_count bigint;
  v_bonus_credits bigint;
  v_allowed_bonus_credits bigint;
  v_bonus_removed integer := 0;
  v_credits_to_remove integer := 1;
  v_difference integer;
begin
  if not public.has_role('superadmin'::public.app_role) then
    raise exception 'Superadmin access required' using errcode = '42501';
  end if;

  if p_feedback_id is null then
    raise exception 'Feedback ID is required' using errcode = '22023';
  end if;

  -- Read identifiers first, then acquire all profile locks before the track and
  -- session locks. This preserves the same ordering as the credit RPCs.
  select feedbacks.user_id
  into v_reviewer_id
  from public.track_feedbacks as feedbacks
  where feedbacks.id = p_feedback_id;

  if not found then
    return jsonb_build_object(
      'success', true,
      'already_deleted', true,
      'message', 'Feedback already deleted.'
    );
  end if;

  select
    transactions.id,
    transactions.track_id,
    transactions.listening_session_id,
    transactions.amount
  into
    v_reward_transaction_id,
    v_track_id,
    v_session_id,
    v_reward_amount
  from public.credit_transactions as transactions
  where transactions.feedback_id = p_feedback_id
    and transactions.type = 'feedback_reward'
  order by transactions.created_at desc
  limit 1;

  if not found or v_track_id is null or v_reward_amount < 1 then
    raise exception 'Feedback reward transaction is missing or invalid'
      using errcode = '23514';
  end if;

  select tracks.user_id, tracks.status, tracks.deleted_at
  into v_track_owner_id, v_track_status, v_track_deleted_at
  from public.submitted_tracks as tracks
  where tracks.id = v_track_id;

  if not found then
    raise exception 'Rewarded track not found' using errcode = 'P0002';
  end if;

  insert into public.profiles (id, credits)
  values (v_reviewer_id, 0), (v_track_owner_id, 0)
  on conflict (id) do nothing;

  perform profiles.id
  from public.profiles as profiles
  where profiles.id = any(array[v_reviewer_id, v_track_owner_id])
  order by profiles.id
  for update;

  select feedbacks.user_id
  into v_locked_reviewer_id
  from public.track_feedbacks as feedbacks
  where feedbacks.id = p_feedback_id
  for update;

  if not found then
    return jsonb_build_object(
      'success', true,
      'already_deleted', true,
      'message', 'Feedback already deleted.'
    );
  end if;

  if v_locked_reviewer_id <> v_reviewer_id then
    raise exception 'Feedback ownership changed during deletion'
      using errcode = '40001';
  end if;

  select tracks.user_id, tracks.status, tracks.deleted_at
  into v_track_owner_id, v_track_status, v_track_deleted_at
  from public.submitted_tracks as tracks
  where tracks.id = v_track_id
  for update;

  if not found then
    raise exception 'Rewarded track not found' using errcode = 'P0002';
  end if;

  if v_session_id is null then
    select sessions.id
    into v_session_id
    from public.listening_sessions as sessions
    where sessions.feedback_id = p_feedback_id
    order by sessions.created_at desc
    limit 1;
  end if;

  if v_session_id is not null then
    perform sessions.id
    from public.listening_sessions as sessions
    where sessions.id = v_session_id
    for update;
  end if;

  select transactions.amount
  into v_reward_amount
  from public.credit_transactions as transactions
  where transactions.id = v_reward_transaction_id
    and transactions.feedback_id = p_feedback_id
    and transactions.type = 'feedback_reward'
  for update;

  if not found or v_reward_amount < 1 then
    raise exception 'Feedback reward transaction is missing or invalid'
      using errcode = '23514';
  end if;

  select count(*)
  into v_feedback_count
  from public.track_feedbacks as feedbacks
  where feedbacks.user_id = v_reviewer_id;

  select coalesce(sum(greatest(transactions.amount - 1, 0)), 0)
  into v_bonus_credits
  from public.credit_transactions as transactions
  inner join public.track_feedbacks as feedbacks
    on feedbacks.id = transactions.feedback_id
  where transactions.user_id = v_reviewer_id
    and transactions.type = 'feedback_reward';

  v_allowed_bonus_credits := greatest(v_feedback_count - 1, 0) / 10;

  if v_bonus_credits > v_allowed_bonus_credits then
    v_bonus_removed := 1;
    v_credits_to_remove := 2;
  end if;

  -- The milestone bonus is aggregate user state. If the deleted feedback is
  -- not the row currently carrying that bonus, move/remove the extra amount so
  -- transaction history still matches the remaining feedback count.
  if v_reward_amount > v_credits_to_remove then
    v_difference := v_reward_amount - v_credits_to_remove;

    select transactions.id
    into v_transfer_transaction_id
    from public.credit_transactions as transactions
    where transactions.user_id = v_reviewer_id
      and transactions.type = 'feedback_reward'
      and transactions.feedback_id is not null
      and transactions.feedback_id <> p_feedback_id
      and transactions.amount = 1
    order by transactions.created_at desc
    limit 1
    for update;

    if not found then
      raise exception 'Unable to preserve the existing milestone bonus'
        using errcode = '23514';
    end if;

    update public.credit_transactions as transactions
    set amount = transactions.amount + v_difference,
        description =
          'Earned credit from verified listening feedback plus 10-feedback milestone bonus'
    where transactions.id = v_transfer_transaction_id;
  elsif v_reward_amount < v_credits_to_remove then
    v_difference := v_credits_to_remove - v_reward_amount;

    select transactions.id
    into v_transfer_transaction_id
    from public.credit_transactions as transactions
    where transactions.user_id = v_reviewer_id
      and transactions.type = 'feedback_reward'
      and transactions.feedback_id is not null
      and transactions.feedback_id <> p_feedback_id
      and transactions.amount >= 1 + v_difference
    order by transactions.created_at desc
    limit 1
    for update;

    if not found then
      raise exception 'Unable to reverse the milestone bonus'
        using errcode = '23514';
    end if;

    update public.credit_transactions as transactions
    set amount = transactions.amount - v_difference,
        description = case
          when transactions.amount - v_difference = 1 then
            'Earned credit from verified listening feedback'
          else transactions.description
        end
    where transactions.id = v_transfer_transaction_id;
  end if;

  delete from public.credit_transactions as transactions
  where transactions.feedback_id = p_feedback_id;

  update public.profiles as profiles
  set credits = profiles.credits - v_credits_to_remove,
      updated_at = clock_timestamp()
  where profiles.id = v_reviewer_id;

  if v_track_status = 'deleted' or v_track_deleted_at is not null then
    update public.profiles as profiles
    set credits = profiles.credits + 1,
        updated_at = clock_timestamp()
    where profiles.id = v_track_owner_id;

    insert into public.credit_transactions (
      user_id,
      track_id,
      amount,
      type,
      description
    )
    values (
      v_track_owner_id,
      v_track_id,
      1,
      'refund',
      'Restored consumed credit after admin feedback deletion ' ||
        p_feedback_id::text
    );
  else
    update public.submitted_tracks as tracks
    set credits_remaining = tracks.credits_remaining + 1,
        status = 'active'
    where tracks.id = v_track_id;
  end if;

  update public.listening_sessions as sessions
  set status = 'completed',
      feedback_id = null,
      rewarded_at = null,
      updated_at = clock_timestamp()
  where sessions.feedback_id = p_feedback_id
    and sessions.status = 'rewarded';

  delete from public.track_feedbacks as feedbacks
  where feedbacks.id = p_feedback_id;

  if not found then
    raise exception 'Feedback disappeared during deletion'
      using errcode = '40001';
  end if;

  return jsonb_build_object(
    'success', true,
    'already_deleted', false,
    'credits_removed', v_credits_to_remove,
    'bonus_removed', v_bonus_removed,
    'track_credit_restored', 1,
    'message', 'Feedback deleted and credit effects reversed.'
  );
end;
$$;

revoke all on function public.delete_admin_feedback(uuid)
  from public, anon, authenticated;
grant execute on function public.delete_admin_feedback(uuid)
  to authenticated, service_role;
