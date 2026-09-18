-- Include the track genres in the existing owner-only submitted track read model.
drop function if exists public.get_owner_submitted_tracks_with_feedbacks();

create function public.get_owner_submitted_tracks_with_feedbacks()
returns table (
  id uuid,
  track_id text,
  title text,
  cover_url text,
  created_at timestamptz,
  credits_remaining integer,
  status text,
  genres text[],
  feedback_count integer,
  feedbacks jsonb
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
    st.genres,
    coalesce(feedback_summary.feedback_count, 0)::integer as feedback_count,
    coalesce(feedback_summary.feedbacks, '[]'::jsonb) as feedbacks
  from public.submitted_tracks as st
  left join lateral (
    select
      count(*)::integer as feedback_count,
      jsonb_agg(
        jsonb_build_object(
          'id', tf.id,
          'feedback', tf.feedback,
          'created_at', tf.created_at
        )
        order by tf.created_at desc
      ) as feedbacks
    from public.track_feedbacks as tf
    where tf.track_id = st.track_id
  ) as feedback_summary on true
  where (select auth.uid()) is not null
    and st.user_id = (select auth.uid())
    and st.deleted_at is null
  order by st.created_at desc;
$$;

revoke execute on function public.get_owner_submitted_tracks_with_feedbacks() from public;
revoke execute on function public.get_owner_submitted_tracks_with_feedbacks() from anon;
grant execute on function public.get_owner_submitted_tracks_with_feedbacks() to authenticated;
grant execute on function public.get_owner_submitted_tracks_with_feedbacks() to service_role;
