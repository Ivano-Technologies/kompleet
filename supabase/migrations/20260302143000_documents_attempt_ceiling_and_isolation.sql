-- Processing attempt ceiling + entity isolation performance hardening.

DO $$
BEGIN
  IF to_regclass('public.documents') IS NOT NULL THEN
    EXECUTE '
      ALTER TABLE public.documents
      ADD COLUMN IF NOT EXISTS processing_attempt_count integer NOT NULL DEFAULT 0
    ';

    EXECUTE '
      ALTER TABLE public.documents
      DROP CONSTRAINT IF EXISTS documents_processing_attempt_count_nonnegative
    ';

    EXECUTE '
      ALTER TABLE public.documents
      ADD CONSTRAINT documents_processing_attempt_count_nonnegative
      CHECK (processing_attempt_count >= 0)
    ';

    EXECUTE '
      CREATE INDEX IF NOT EXISTS documents_user_status_updated_idx
      ON public.documents (user_id, status, updated_at DESC)
    ';
  END IF;
END $$;
