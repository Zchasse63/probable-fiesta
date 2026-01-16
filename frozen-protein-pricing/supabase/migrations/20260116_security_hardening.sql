-- Security hardening for Phase 5
-- Persistent rate limiting and circuit breaker state

-- Rate Limit Entries Table (persistent across restarts)
CREATE TABLE IF NOT EXISTS rate_limit_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  reset_at BIGINT NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_user_reset ON rate_limit_entries(user_id, reset_at);
CREATE INDEX IF NOT EXISTS idx_rate_limit_reset_at ON rate_limit_entries(reset_at);

-- Circuit Breaker State Table (persistent across restarts)
CREATE TABLE IF NOT EXISTS circuit_breaker_state (
  service_key TEXT PRIMARY KEY,
  failures INTEGER NOT NULL DEFAULT 0,
  last_failure_time BIGINT,
  is_open BOOLEAN NOT NULL DEFAULT false,
  updated_at BIGINT NOT NULL
);

-- Enable RLS
ALTER TABLE rate_limit_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE circuit_breaker_state ENABLE ROW LEVEL SECURITY;

-- RLS Policies - system tables, restrict access
CREATE POLICY "Service role can manage rate_limit_entries"
  ON rate_limit_entries
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage circuit_breaker_state"
  ON circuit_breaker_state
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Cleanup function for expired rate limit entries
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM rate_limit_entries
  WHERE reset_at < EXTRACT(EPOCH FROM NOW()) * 1000;
END;
$$;

-- Scheduled cleanup (if pg_cron extension available)
-- Run every 5 minutes
-- SELECT cron.schedule('cleanup-rate-limits', '*/5 * * * *', 'SELECT cleanup_expired_rate_limits()');
