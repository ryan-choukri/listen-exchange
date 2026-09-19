-- Keep the backend as the single source of truth for the listen duration.
alter table public.listening_config
  alter column min_listen_duration_ms set default 45000;

update public.listening_config
set min_listen_duration_ms = 45000,
    updated_at = clock_timestamp()
where id = true;

-- Active sessions were created with the previous requirement and cannot be
-- treated as a new uninterrupted 45-second listen.
update public.listening_sessions
set status = 'abandoned',
    invalid_reason = 'listening_requirement_changed',
    paused_at = null,
    updated_at = clock_timestamp()
where status = 'active';
