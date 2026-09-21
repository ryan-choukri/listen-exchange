-- Manual superadmin feedback is content-only: it does not consume a track
-- credit, issue a reward, or create a listening session.
alter table public.track_feedbacks
  add column is_admin_manual boolean not null default false;

comment on column public.track_feedbacks.is_admin_manual is
  'True only for feedback inserted manually through the superadmin RPC.';

-- Keep the one-feedback-per-track guarantee for the regular listening flow,
-- while allowing multiple explicitly marked administrative feedback rows.
alter table public.track_feedbacks
  drop constraint track_feedbacks_user_id_track_id_key;

create unique index track_feedbacks_regular_user_track_key
  on public.track_feedbacks (user_id, track_id)
  where is_admin_manual = false;

create function public.create_admin_track_feedback(
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
  v_spotify_track_id text;
  v_feedback text;
  v_feedback_id uuid;
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

  select tracks.track_id
  into v_spotify_track_id
  from public.submitted_tracks as tracks
  where tracks.id = p_track_id;

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
    v_spotify_track_id,
    v_feedback,
    true
  )
  returning id into v_feedback_id;

  return v_feedback_id;
end;
$$;

revoke all on function public.create_admin_track_feedback(uuid, text)
  from public, anon, authenticated;
grant execute on function public.create_admin_track_feedback(uuid, text)
  to authenticated, service_role;

-- Preserve deletion support for content-only admin feedback without changing
-- the exact credit reversal logic used for rewarded feedback.
alter function public.delete_admin_feedback(uuid)
  rename to delete_rewarded_admin_feedback;

revoke all on function public.delete_rewarded_admin_feedback(uuid)
  from public, anon, authenticated;
grant execute on function public.delete_rewarded_admin_feedback(uuid)
  to service_role;

create function public.delete_admin_feedback(p_feedback_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted_id uuid;
begin
  if not public.has_role('superadmin'::public.app_role) then
    raise exception 'Superadmin access required' using errcode = '42501';
  end if;

  if p_feedback_id is null then
    raise exception 'Feedback ID is required' using errcode = '22023';
  end if;

  delete from public.track_feedbacks as feedbacks
  where feedbacks.id = p_feedback_id
    and feedbacks.is_admin_manual = true
  returning feedbacks.id into v_deleted_id;

  if found then
    return jsonb_build_object(
      'success', true,
      'already_deleted', false,
      'credits_removed', 0,
      'bonus_removed', 0,
      'track_credit_restored', 0,
      'message', 'Administrative feedback deleted.'
    );
  end if;

  return public.delete_rewarded_admin_feedback(p_feedback_id);
end;
$$;

revoke all on function public.delete_admin_feedback(uuid)
  from public, anon, authenticated;
grant execute on function public.delete_admin_feedback(uuid)
  to authenticated, service_role;
