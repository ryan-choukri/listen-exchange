-- Application roles are stored in the database, never in user-editable metadata.
CREATE TYPE public.app_role AS ENUM ('superadmin');

CREATE TABLE public.user_roles (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, role)
);

COMMENT ON TABLE public.user_roles IS
  'Authoritative application roles. Not directly accessible through client roles.';

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles FORCE ROW LEVEL SECURITY;

-- Defense in depth: the table has no client grants and no client RLS policies.
-- Only trusted database/server administration can assign or inspect roles.
REVOKE ALL ON TABLE public.user_roles FROM PUBLIC;
REVOKE ALL ON TABLE public.user_roles FROM anon;
REVOKE ALL ON TABLE public.user_roles FROM authenticated;
GRANT ALL ON TABLE public.user_roles TO service_role;

-- Expose only a yes/no check for the currently authenticated user. The caller
-- cannot provide another user ID and cannot inspect the underlying role rows.
CREATE FUNCTION public.has_role(requested_role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT (SELECT auth.uid()) IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = (SELECT auth.uid())
        AND role = requested_role
    );
$$;

REVOKE ALL ON FUNCTION public.has_role(public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(public.app_role) TO service_role;
