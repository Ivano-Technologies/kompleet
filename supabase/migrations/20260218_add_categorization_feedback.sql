-- Create categorization_feedback table
CREATE TABLE IF NOT EXISTS categorization_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_category TEXT NOT NULL,
  corrected_category TEXT NOT NULL,
  original_confidence DECIMAL(3,2) DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categorization_predictions table
CREATE TABLE IF NOT EXISTS categorization_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  predicted_category TEXT NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  reasoning TEXT,
  alternatives JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_learning_profiles table
CREATE TABLE IF NOT EXISTS user_learning_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  learning_data JSONB DEFAULT '{}',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_categorization_feedback_user_id ON categorization_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_categorization_feedback_transaction_id ON categorization_feedback(transaction_id);
CREATE INDEX IF NOT EXISTS idx_categorization_feedback_created_at ON categorization_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_categorization_predictions_user_id ON categorization_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_categorization_predictions_transaction_id ON categorization_predictions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_categorization_predictions_created_at ON categorization_predictions(created_at);

-- Enable RLS
ALTER TABLE categorization_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorization_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_learning_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for categorization_feedback
CREATE POLICY "Users can view their own feedback"
  ON categorization_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback"
  ON categorization_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback"
  ON categorization_feedback FOR UPDATE
  USING (auth.uid() = user_id);

-- Create RLS policies for categorization_predictions
CREATE POLICY "Users can view their own predictions"
  ON categorization_predictions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own predictions"
  ON categorization_predictions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for user_learning_profiles
CREATE POLICY "Users can view their own learning profile"
  ON user_learning_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning profile"
  ON user_learning_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learning profile"
  ON user_learning_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);
