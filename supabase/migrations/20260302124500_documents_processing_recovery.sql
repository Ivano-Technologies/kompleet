-- Stuck-processing recovery support for document intelligence worker.

DO $$
BEGIN
  IF to_regclass('public.documents') IS NOT NULL THEN
    EXECUTE '
      ALTER TABLE public.documents
      ADD COLUMN IF NOT EXISTS processing_started_at timestamptz
    ';

    EXECUTE '
      CREATE INDEX IF NOT EXISTS documents_status_processing_started_at_idx
      ON public.documents (status, processing_started_at)
    ';
  END IF;
END $$;
