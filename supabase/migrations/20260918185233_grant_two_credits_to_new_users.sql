-- Grant launch credits exactly once, when Auth inserts a new user. The
-- existing on_auth_user_created trigger remains unchanged and only fires on
-- INSERT, so login, token refresh and normal session refreshes cannot re-run
-- this grant.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, credits)
  values (new.id, 2);

  return new;
end;
$$;

-- This function is an Auth trigger implementation, not a public RPC.
revoke execute on function public.handle_new_user()
  from public, anon, authenticated, service_role;
