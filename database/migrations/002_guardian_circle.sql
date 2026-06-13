-- ============================================================
-- Migration 002: Guardian Circle — WhatsApp invites + push
-- Run this in Supabase SQL Editor
--
-- Replaces email/SMS notifications with WhatsApp invite links
-- and Firebase push notifications. Raises contact limit to 10
-- (enforced in application code) and replaces alert_notifications
-- with notifications_log.
-- ============================================================

-- ------------------------------------------------------------
-- EMERGENCY CONTACTS: rename + new columns
-- ------------------------------------------------------------
ALTER TABLE emergency_contacts RENAME COLUMN full_name TO contact_name;
ALTER TABLE emergency_contacts RENAME COLUMN phone TO phone_number;

ALTER TABLE emergency_contacts
  DROP COLUMN IF EXISTS email,
  DROP COLUMN IF EXISTS notification_enabled;

ALTER TABLE emergency_contacts
  ADD COLUMN IF NOT EXISTS priority INT NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS invite_status TEXT NOT NULL DEFAULT 'pending_invite',
  ADD COLUMN IF NOT EXISTS invite_token TEXT,
  ADD COLUMN IF NOT EXISTS invite_link TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_invite_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS push_token TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Backfill invite tokens for any existing rows before enforcing NOT NULL/UNIQUE
UPDATE emergency_contacts
SET invite_token = replace(uuid_generate_v4()::text, '-', '')
WHERE invite_token IS NULL;

ALTER TABLE emergency_contacts
  ALTER COLUMN invite_token SET NOT NULL,
  ALTER COLUMN invite_token SET DEFAULT replace(uuid_generate_v4()::text, '-', '');

ALTER TABLE emergency_contacts
  ADD CONSTRAINT emergency_contacts_invite_token_key UNIQUE (invite_token);

ALTER TABLE emergency_contacts
  ADD CONSTRAINT emergency_contacts_invite_status_check
    CHECK (invite_status IN ('pending_invite', 'accepted', 'push_enabled', 'push_disabled', 'whatsapp_only'));

ALTER TABLE emergency_contacts
  ADD CONSTRAINT emergency_contacts_priority_check CHECK (priority BETWEEN 1 AND 3);

-- Prevent duplicate contacts per user (run only if no existing duplicates)
ALTER TABLE emergency_contacts
  ADD CONSTRAINT emergency_contacts_user_phone_key UNIQUE (user_id, phone_number);

-- Auto-maintain updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_emergency_contacts_updated_at ON emergency_contacts;
CREATE TRIGGER set_emergency_contacts_updated_at
  BEFORE UPDATE ON emergency_contacts
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ------------------------------------------------------------
-- NOTIFICATIONS LOG: replaces alert_notifications
-- ------------------------------------------------------------
ALTER TABLE alert_notifications RENAME TO notifications_log;
ALTER TABLE notifications_log RENAME COLUMN alert_id TO incident_id;

ALTER TABLE notifications_log
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS message TEXT,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Drop legacy rows from the old email/SMS notification system; they predate
-- the whatsapp/push-only model and would violate the new channel check.
DELETE FROM notifications_log WHERE channel NOT IN ('whatsapp', 'push');

ALTER TABLE notifications_log DROP CONSTRAINT IF EXISTS alert_notifications_channel_check;
ALTER TABLE notifications_log
  ADD CONSTRAINT notifications_log_channel_check CHECK (channel IN ('whatsapp', 'push'));

ALTER TABLE notifications_log DROP CONSTRAINT IF EXISTS alert_notifications_status_check;
ALTER TABLE notifications_log
  ADD CONSTRAINT notifications_log_status_check CHECK (status IN ('pending', 'sent', 'delivered', 'failed'));

ALTER INDEX IF EXISTS idx_alert_notifications_alert_id RENAME TO idx_notifications_log_incident_id;

-- RLS policy already follows sos_alerts via incident_id; re-create referencing new column name
DROP POLICY IF EXISTS "notifications_via_alert" ON notifications_log;
CREATE POLICY "notifications_via_incident" ON notifications_log
  USING (
    EXISTS (
      SELECT 1 FROM sos_alerts sa
      WHERE sa.id = incident_id AND sa.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('responder', 'admin'))
  );
