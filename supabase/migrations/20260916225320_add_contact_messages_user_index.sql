create index contact_messages_user_id_idx
  on public.contact_messages (user_id)
  where user_id is not null;
