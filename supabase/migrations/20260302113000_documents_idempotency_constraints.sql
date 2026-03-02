-- Document intelligence idempotency guardrails.
-- Safe to run before/after documents table creation due conditional checks.

DO $$
BEGIN
  IF to_regclass('public.documents') IS NOT NULL THEN
    EXECUTE '
      CREATE UNIQUE INDEX IF NOT EXISTS documents_user_id_idempotency_key_uniq
      ON public.documents (user_id, idempotency_key)
    ';
  END IF;
END $$;
