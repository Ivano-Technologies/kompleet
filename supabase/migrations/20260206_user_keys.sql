-- User Cryptographic Keys Table for Digital Signatures

CREATE TABLE IF NOT EXISTS user_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- RSA Keys
  public_key TEXT NOT NULL,
  private_key_encrypted TEXT NOT NULL, -- AES-256-GCM encrypted
  
  -- Key Metadata
  key_type VARCHAR(20) DEFAULT 'RSA-2048',
  key_algorithm VARCHAR(50) DEFAULT 'RSASSA-PKCS1-v1_5',
  hash_algorithm VARCHAR(20) DEFAULT 'SHA-256',
  
  -- Key Rotation
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_keys_user_id ON user_keys(user_id);
CREATE INDEX idx_user_keys_is_active ON user_keys(is_active);

-- RLS Policies
ALTER TABLE user_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_keys_user_policy ON user_keys
  FOR ALL USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_keys_updated_at
  BEFORE UPDATE ON user_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE user_keys IS 'Encrypted storage for user cryptographic keys used in digital signatures';
