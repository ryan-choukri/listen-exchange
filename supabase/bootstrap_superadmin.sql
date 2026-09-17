One-time bootstrap script. This file is intentionally not a migration:
replace the placeholder with the UUID from Supabase Dashboard > Authentication
> Users, uncomment the statement, then run it in the Supabase SQL Editor.

INSERT INTO public.user_roles (user_id, role)
VALUES ('REPLACE_WITH_YOUR_AUTH_USER_UUID'::UUID, 'superadmin')
ON CONFLICT (user_id, role) DO NOTHING;
