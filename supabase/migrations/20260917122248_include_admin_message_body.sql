DROP FUNCTION public.get_admin_messages();

CREATE FUNCTION public.get_admin_messages()
RETURNS TABLE (
  message_id UUID,
  email TEXT,
  subject TEXT,
  message TEXT,
  created_at TIMESTAMPTZ,
  status TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.has_role('superadmin'::public.app_role) THEN
    RAISE EXCEPTION 'Superadmin access required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    messages.id,
    messages.email,
    messages.subject,
    messages.message,
    messages.created_at,
    messages.status
  FROM public.contact_messages AS messages
  ORDER BY messages.created_at DESC
  LIMIT 200;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_messages() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_messages()
  TO authenticated, service_role;
