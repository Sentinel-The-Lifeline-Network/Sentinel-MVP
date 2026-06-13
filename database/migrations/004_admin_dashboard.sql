-- ============================================================
-- Migration 004: Admin dashboard analytics
-- Run this in Supabase SQL Editor
--
-- Adds a table to record each view of a live-tracking link so the
-- admin dashboard can report how many people open a shared SOS
-- tracking link. Written by the server using the service role key,
-- so RLS is enabled with no public policy (deny by default).
-- ============================================================

CREATE TABLE IF NOT EXISTS tracking_link_views (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id   UUID NOT NULL REFERENCES sos_alerts(id) ON DELETE CASCADE,
  viewed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent TEXT
);

ALTER TABLE tracking_link_views ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_tracking_link_views_alert_id ON tracking_link_views(alert_id);
CREATE INDEX IF NOT EXISTS idx_tracking_link_views_viewed_at ON tracking_link_views(viewed_at);
