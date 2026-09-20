-- Award the normal feedback credit plus one extra credit on every tenth valid
-- feedback. The existing profile row lock serializes concurrent submissions
-- for one user, while the feedback/session unique indexes make retries safe.
drop function if exists public.submit_track_feedback(uuid, text);

create function public.submit_track_feedback(
  p_listening_session_id uuid,
  p_feedback text
)
returns table (
  success boolean,
  feedback_id uuid,
  message text,
  new_credits integer,
  credits_awarded integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_feedback_trimmed text;
  v_feedback_id uuid;
  v_new_credits integer;
  v_credits_awarded integer := 1;
  v_feedback_count bigint;
  v_submitted_track_id uuid;
  v_session public.listening_sessions%rowtype;
  v_track public.submitted_tracks%rowtype;
  v_min_duration_ms integer;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    return query select
      false, null::uuid, 'User not authenticated.'::text, null::integer,
      null::integer;
    return;
  end if;

  if p_listening_session_id is null or p_feedback is null then
    return query select
      false, null::uuid, 'A verified listen and feedback are required.'::text,
      null::integer, null::integer;
    return;
  end if;

  v_feedback_trimmed := trim(p_feedback);

  if length(v_feedback_trimmed) < 10 then
    return query select
      false, null::uuid, 'Feedback must be at least 10 characters.'::text,
      null::integer, null::integer;
    return;
  end if;

  if length(v_feedback_trimmed) > 500 then
    return query select
      false, null::uuid, 'Feedback must be 500 characters or fewer.'::text,
      null::integer, null::integer;
    return;
  end if;

  select ls.submitted_track_id
  into v_submitted_track_id
  from public.listening_sessions as ls
  where ls.id = p_listening_session_id
    and ls.user_id = v_user_id;

  if not found then
    return query select
      false, null::uuid, 'Verified listening session not found.'::text,
      null::integer, null::integer;
    return;
  end if;

  insert into public.profiles (id, credits)
  values (v_user_id, 0)
  on conflict (id) do nothing;

  -- Keep the established lock order: profile, track, listening session.
  -- The profile lock also serializes milestone counts for this user.
  select pr.credits
  into v_new_credits
  from public.profiles as pr
  where pr.id = v_user_id
  for update;

  select st.*
  into v_track
  from public.submitted_tracks as st
  where st.id = v_submitted_track_id
  for update;

  if not found then
    return query select
      false, null::uuid, 'Track not found.'::text, v_new_credits,
      null::integer;
    return;
  end if;

  select ls.*
  into v_session
  from public.listening_sessions as ls
  where ls.id = p_listening_session_id
    and ls.user_id = v_user_id
  for update;

  if not found then
    return query select
      false, null::uuid, 'Verified listening session not found.'::text,
      v_new_credits, null::integer;
    return;
  end if;

  v_min_duration_ms := v_session.required_listen_ms;

  if v_session.status = 'rewarded' then
    return query select
      false, v_session.feedback_id,
      'This listening reward has already been claimed.'::text,
      v_new_credits, null::integer;
    return;
  end if;

  if v_session.status <> 'completed'
    or v_session.completed_at is null
    or v_session.listened_ms < v_min_duration_ms
  then
    return query select
      false, null::uuid,
      'Complete the verified listening time before submitting feedback.'::text,
      v_new_credits, null::integer;
    return;
  end if;

  if v_track.id <> v_session.submitted_track_id
    or v_track.track_id <> v_session.spotify_track_id
  then
    return query select
      false, null::uuid, 'Listening session does not match this track.'::text,
      v_new_credits, null::integer;
    return;
  end if;

  if v_track.user_id = v_user_id then
    return query select
      false, null::uuid, 'You cannot reward your own track.'::text,
      v_new_credits, null::integer;
    return;
  end if;

  if v_track.status <> 'active'
    or v_track.deleted_at is not null
    or v_track.credits_remaining <= 0
  then
    return query select
      false, null::uuid,
      'This track is no longer accepting feedback rewards.'::text,
      v_new_credits, null::integer;
    return;
  end if;

  if exists (
    select 1
    from public.track_feedbacks as tf
    where tf.user_id = v_user_id
      and tf.track_id = v_track.track_id
  ) then
    return query select
      false, null::uuid,
      'You have already given feedback on this track.'::text,
      v_new_credits, null::integer;
    return;
  end if;

  insert into public.track_feedbacks (user_id, track_id, feedback)
  values (v_user_id, v_track.track_id, v_feedback_trimmed)
  returning id into v_feedback_id;

  select count(*)
  into v_feedback_count
  from public.track_feedbacks as tf
  where tf.user_id = v_user_id;

  if mod(v_feedback_count, 10) = 0 then
    v_credits_awarded := 2;
  end if;

  update public.profiles as pr
  set credits = pr.credits + v_credits_awarded,
      updated_at = clock_timestamp()
  where pr.id = v_user_id
  returning pr.credits into v_new_credits;

  update public.submitted_tracks as st
  set credits_remaining = st.credits_remaining - 1,
      status = case
        when st.credits_remaining - 1 > 0 then 'active'
        else 'pending'
      end
  where st.id = v_track.id;

  insert into public.credit_transactions (
    user_id,
    track_id,
    feedback_id,
    listening_session_id,
    amount,
    type,
    description
  )
  values (
    v_user_id,
    v_track.id,
    v_feedback_id,
    v_session.id,
    v_credits_awarded,
    'feedback_reward',
    case
      when v_credits_awarded = 2 then
        'Earned credit from verified listening feedback plus 10-feedback milestone bonus'
      else
        'Earned credit from verified listening feedback'
    end
  );

  update public.listening_sessions as ls
  set status = 'rewarded',
      feedback_id = v_feedback_id,
      rewarded_at = clock_timestamp(),
      updated_at = clock_timestamp()
  where ls.id = v_session.id;

  return query select
    true,
    v_feedback_id,
    case
      when v_credits_awarded = 2 then
        'Feedback submitted successfully. Milestone bonus earned.'::text
      else
        'Feedback submitted successfully.'::text
    end,
    v_new_credits,
    v_credits_awarded;
exception
  when unique_violation then
    select pr.credits
    into v_new_credits
    from public.profiles as pr
    where pr.id = v_user_id;

    return query select
      false, null::uuid,
      'This feedback or listening reward has already been submitted.'::text,
      v_new_credits, null::integer;
  when others then
    return query select
      false, null::uuid,
      'The feedback reward could not be completed.'::text,
      null::integer, null::integer;
end;
$$;

revoke all on function public.submit_track_feedback(uuid, text)
  from public, anon;
grant execute on function public.submit_track_feedback(uuid, text)
  to authenticated, service_role;
