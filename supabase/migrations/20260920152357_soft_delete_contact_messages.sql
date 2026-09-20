ALTER TABLE public.contact_messages
ADD COLUMN removed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.contact_messages.removed_at IS
  'Soft-delete timestamp. Removed messages remain stored for history.';

CREATE INDEX contact_messages_active_created_at_idx
  ON public.contact_messages (created_at DESC)
  WHERE removed_at IS NULL;

CREATE OR REPLACE FUNCTION public.get_admin_messages()
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
  WHERE messages.removed_at IS NULL
  ORDER BY messages.created_at DESC
  LIMIT 200;
END;
$$;

CREATE FUNCTION public.remove_admin_message(p_message_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.has_role('superadmin'::public.app_role) THEN
    RAISE EXCEPTION 'Superadmin access required' USING ERRCODE = '42501';
  END IF;

  UPDATE public.contact_messages AS messages
  SET removed_at = COALESCE(messages.removed_at, NOW())
  WHERE messages.id = p_message_id;

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_messages() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_messages()
  TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.remove_admin_message(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.remove_admin_message(UUID)
  TO authenticated, service_role;
