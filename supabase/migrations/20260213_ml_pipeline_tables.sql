-- ML Pipeline Tables Migration
-- Creates 6 tables referenced by existing ML code that were never migrated

-- 1. ml_corrections: User feedback on AI categorization (continuous learning)
CREATE TABLE IF NOT EXISTS ml_corrections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transaction_data JSONB NOT NULL,
  predicted_category TEXT NOT NULL,
  corrected_category TEXT NOT NULL,
  confidence DECIMAL(5,2),
  inference_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. recurring_patterns: Detected recurring transactions
CREATE TABLE IF NOT EXISTS recurring_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  merchant_normalized TEXT NOT NULL,
  interval_days DECIMAL(10,2) NOT NULL,
  amount_mean DECIMAL(15,2) NOT NULL,
  amount_stddev DECIMAL(15,2),
  confidence DECIMAL(5,4) NOT NULL,
  last_occurrence_date DATE,
  next_expected_date DATE,
  occurrence_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ml_models: Registered model versions
CREATE TABLE IF NOT EXISTS ml_models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'deployed', 'archived')),
  provider TEXT,
  metrics JSONB,
  deployed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. ml_retraining_jobs: Retraining triggers
CREATE TABLE IF NOT EXISTS ml_retraining_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trigger_reason TEXT NOT NULL,
  corrections_count INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 5. ml_inference_logs: Per-prediction tracking
CREATE TABLE IF NOT EXISTS ml_inference_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  model_version TEXT,
  provider TEXT,
  input JSONB,
  output JSONB,
  confidence DECIMAL(5,2),
  latency_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. ml_drift_alerts: Performance drift monitoring
CREATE TABLE IF NOT EXISTS ml_drift_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  drift_type TEXT NOT NULL CHECK (drift_type IN ('concept', 'prediction', 'latency', 'error_rate')),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  metric_name TEXT NOT NULL,
  current_value DECIMAL(10,4),
  baseline_value DECIMAL(10,4),
  details JSONB,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ml_corrections_user_id ON ml_corrections(user_id);
CREATE INDEX IF NOT EXISTS idx_ml_corrections_created_at ON ml_corrections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recurring_patterns_user_id ON recurring_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_ml_inference_logs_user_id ON ml_inference_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ml_inference_logs_created_at ON ml_inference_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ml_drift_alerts_resolved ON ml_drift_alerts(resolved) WHERE NOT resolved;

-- Row Level Security
ALTER TABLE ml_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_inference_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can only access their own data
CREATE POLICY "Users manage own corrections"
  ON ml_corrections FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own patterns"
  ON recurring_patterns FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users see own inference logs"
  ON ml_inference_logs FOR ALL
  USING (auth.uid() = user_id);

-- ml_models, ml_retraining_jobs, ml_drift_alerts are admin-only (no user-scoped RLS)
-- Service role access only for these tables
ALTER TABLE ml_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_retraining_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_drift_alerts ENABLE ROW LEVEL SECURITY;
