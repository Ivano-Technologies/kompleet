-- 1. No app call sites for these; service_role keeps access.
--    Closes IDOR in get_tax_year_summary (client-supplied p_user_id) and
--    audit-log forgery via log_audit_event.
revoke execute on function public.bulk_insert_transactions(jsonb) from authenticated;
revoke execute on function public.get_tax_year_summary(uuid, integer) from authenticated;
revoke execute on function public.log_audit_event(uuid, text, text, uuid, jsonb, jsonb) from authenticated;

-- 2. get_next_invoice_number stays app-callable but no longer trusts p_user_id:
--    an authenticated caller must match the identity resolved from their JWT.
create or replace function public.get_next_invoice_number(p_user_id uuid, p_tax_year integer)
returns text
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
DECLARE
  v_seq integer;
  v_invoice_number text;
  v_caller uuid;
BEGIN
  -- Identity guard: authenticated callers may only act as themselves.
  -- service_role requests carry role 'service_role' and skip the check.
  IF (current_setting('request.jwt.claims', true)::json->>'role') = 'authenticated' THEN
    v_caller := public.get_current_user_id();
    IF v_caller IS NULL OR v_caller <> p_user_id THEN
      RAISE EXCEPTION 'permission denied: p_user_id does not match caller identity';
    END IF;
  END IF;

  INSERT INTO public.invoice_sequences (user_id, tax_year, last_sequence)
  VALUES (p_user_id, p_tax_year, 1)
  ON CONFLICT (user_id, tax_year) DO UPDATE
    SET last_sequence = invoice_sequences.last_sequence + 1,
        updated_at = now()
  RETURNING last_sequence INTO v_seq;

  v_invoice_number := 'INV-' || p_tax_year::text || '-' || LPAD(v_seq::text, 4, '0');
  RETURN v_invoice_number;
END;
$function$;
