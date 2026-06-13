-- ============================================================
-- Migration 003: WhatsApp + Push notification rules
-- Run this in Supabase SQL Editor
--
-- Adds last_whatsapp_sent_at to sos_alerts so the server can
-- enforce "at most one WhatsApp reminder per 24h while an
-- incident is active". Push reminders continue every 5 minutes
-- independent of this column.
-- ============================================================

ALTER TABLE sos_alerts
  ADD COLUMN IF NOT EXISTS last_whatsapp_sent_at TIMESTAMPTZ;
