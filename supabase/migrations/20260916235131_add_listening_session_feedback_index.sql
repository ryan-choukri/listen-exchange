create index listening_sessions_feedback_id_idx
  on public.listening_sessions (feedback_id)
  where feedback_id is not null;
