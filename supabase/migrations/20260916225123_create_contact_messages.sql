create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  subject text not null,
  message text not null,
  status text not null default 'new',
  created_at timestamp with time zone not null default now(),
  constraint contact_messages_email_check check (
    email = btrim(email)
    and char_length(email) between 5 and 320
    and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  constraint contact_messages_subject_check check (
    subject = any (array['Bug'::text, 'Question'::text, 'Suggestion'::text, 'Partnership'::text])
  ),
  constraint contact_messages_message_check check (
    message = btrim(message)
    and char_length(message) between 10 and 5000
  ),
  constraint contact_messages_status_check check (
    status = any (array['new'::text, 'read'::text, 'closed'::text])
  )
);

create index contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

create index contact_messages_status_created_at_idx
  on public.contact_messages (status, created_at desc);

alter table public.contact_messages enable row level security;

-- Anonymous visitors can submit a message, but can never attach it to a user.
create policy "Anonymous visitors can submit contact messages"
  on public.contact_messages
  for insert
  to anon
  with check (
    user_id is null
    and status = 'new'
  );

-- Signed-in users can only submit messages associated with their own account.
create policy "Authenticated users can submit contact messages"
  on public.contact_messages
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'new'
  );

-- No SELECT, UPDATE, or DELETE policies are intentionally defined. RLS therefore
-- denies those operations to anon and authenticated users by default.
revoke all on table public.contact_messages from anon, authenticated;
grant insert (user_id, email, subject, message)
  on table public.contact_messages
  to anon, authenticated;

grant select, insert, update, delete
  on table public.contact_messages
  to service_role;
