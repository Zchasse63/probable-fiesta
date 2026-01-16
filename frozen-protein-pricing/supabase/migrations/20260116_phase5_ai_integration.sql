-- Phase 5: AI Integration & Export Features
-- Database schema for AI processing and manufacturer deals

-- AI Processing Log Table
CREATE TABLE IF NOT EXISTS ai_processing_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  tokens_in INTEGER NOT NULL DEFAULT 0,
  tokens_out INTEGER NOT NULL DEFAULT 0,
  task_type TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_log_created_at ON ai_processing_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_log_task_type ON ai_processing_log(task_type);
CREATE INDEX IF NOT EXISTS idx_ai_log_user_id ON ai_processing_log(user_id);

-- Manufacturer Deals Table
CREATE TABLE IF NOT EXISTS manufacturer_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  manufacturer TEXT NOT NULL,
  product_description TEXT NOT NULL,
  price_per_lb DECIMAL(10, 2) NOT NULL,
  quantity_lbs INTEGER NOT NULL,
  pack_size TEXT NOT NULL,
  expiration_date DATE,
  deal_terms TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  raw_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deals_status ON manufacturer_deals(status);
CREATE INDEX IF NOT EXISTS idx_deals_created_at ON manufacturer_deals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deals_user_id ON manufacturer_deals(user_id);

-- Enable RLS
ALTER TABLE ai_processing_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE manufacturer_deals ENABLE ROW LEVEL SECURITY;

-- RLS Policies (user-scoped access)
CREATE POLICY "Users can view own ai_processing_log"
  ON ai_processing_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai_processing_log"
  ON ai_processing_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own manufacturer_deals"
  ON manufacturer_deals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own manufacturer_deals"
  ON manufacturer_deals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own manufacturer_deals"
  ON manufacturer_deals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own manufacturer_deals"
  ON manufacturer_deals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Circuit Breaker State Table already defined in 20260116_security_hardening.sql
-- Removed duplicate definition to prevent schema conflict
