-- ============================================================
-- Sentinel MVP — Supabase Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  phone         TEXT,
  email         TEXT,
  security_pin_hash TEXT,
  role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'responder', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: Users can only read/write their own row
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own" ON users
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- EMERGENCY CONTACTS
-- ============================================================
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_name            TEXT NOT NULL,
  phone_number            TEXT NOT NULL,
  relationship            TEXT NOT NULL,
  priority                INT NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 3),
  invite_status           TEXT NOT NULL DEFAULT 'pending_invite'
                            CHECK (invite_status IN ('pending_invite', 'accepted', 'push_enabled', 'push_disabled', 'whatsapp_only')),
  invite_token            TEXT NOT NULL UNIQUE DEFAULT replace(uuid_generate_v4()::text, '-', ''),
  invite_link             TEXT,
  whatsapp_invite_sent_at TIMESTAMPTZ,
  accepted_at             TIMESTAMPTZ,
  push_enabled            BOOLEAN NOT NULL DEFAULT FALSE,
  push_token              TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, phone_number)
);

ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contacts_own" ON emergency_contacts
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

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

-- ============================================================
-- SOS ALERTS
-- ============================================================
CREATE TABLE IF NOT EXISTS sos_alerts (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status                    TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'cancelled')),
  started_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at                  TIMESTAMPTZ,
  last_latitude             DOUBLE PRECISION,
  last_longitude            DOUBLE PRECISION,
  last_location_timestamp   TIMESTAMPTZ,
  last_whatsapp_sent_at     TIMESTAMPTZ,
  tracking_token            TEXT NOT NULL UNIQUE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE sos_alerts ENABLE ROW LEVEL SECURITY;

-- Users see their own alerts; responders see all
CREATE POLICY "alerts_own" ON sos_alerts
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('responder', 'admin')
    )
  );

CREATE POLICY "alerts_insert_own" ON sos_alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "alerts_update_own" ON sos_alerts
  FOR UPDATE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('responder', 'admin')
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sos_alerts_user_id ON sos_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_status ON sos_alerts(status);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_tracking_token ON sos_alerts(tracking_token);

-- ============================================================
-- LOCATION UPDATES
-- ============================================================
CREATE TABLE IF NOT EXISTS location_updates (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id   UUID NOT NULL REFERENCES sos_alerts(id) ON DELETE CASCADE,
  latitude   DOUBLE PRECISION NOT NULL,
  longitude  DOUBLE PRECISION NOT NULL,
  accuracy   DOUBLE PRECISION,
  speed      DOUBLE PRECISION,
  heading    DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE location_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "location_via_alert" ON location_updates
  USING (
    EXISTS (
      SELECT 1 FROM sos_alerts sa
      WHERE sa.id = alert_id
        AND (
          sa.user_id = auth.uid()
          OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('responder', 'admin'))
        )
    )
  );

CREATE INDEX IF NOT EXISTS idx_location_updates_alert_id ON location_updates(alert_id);
CREATE INDEX IF NOT EXISTS idx_location_updates_created_at ON location_updates(created_at);

-- ============================================================
-- NOTIFICATIONS LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications_log (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id   UUID NOT NULL REFERENCES sos_alerts(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  contact_id    UUID NOT NULL REFERENCES emergency_contacts(id) ON DELETE CASCADE,
  channel       TEXT NOT NULL CHECK (channel IN ('whatsapp', 'push')),
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  message       TEXT,
  sent_at       TIMESTAMPTZ,
  delivered_at  TIMESTAMPTZ,
  error_message TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notifications_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_via_incident" ON notifications_log
  USING (
    EXISTS (
      SELECT 1 FROM sos_alerts sa
      WHERE sa.id = incident_id AND sa.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('responder', 'admin'))
  );

CREATE INDEX IF NOT EXISTS idx_notifications_log_incident_id ON notifications_log(incident_id);

-- ============================================================
-- EVIDENCE RECORDS
-- ============================================================
CREATE TABLE IF NOT EXISTS evidence_records (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id   UUID NOT NULL REFERENCES sos_alerts(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('audio', 'image', 'video', 'location_snapshot', 'other')),
  file_url   TEXT,
  metadata   JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE evidence_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "evidence_via_alert" ON evidence_records
  USING (
    EXISTS (
      SELECT 1 FROM sos_alerts sa
      WHERE sa.id = alert_id AND sa.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('responder', 'admin'))
  );

CREATE INDEX IF NOT EXISTS idx_evidence_records_alert_id ON evidence_records(alert_id);

-- ============================================================
-- RESPONDER ACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS responder_actions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id     UUID NOT NULL REFERENCES sos_alerts(id) ON DELETE CASCADE,
  responder_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action       TEXT NOT NULL,
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE responder_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "responder_actions_policy" ON responder_actions
  USING (
    responder_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('responder', 'admin'))
    OR EXISTS (SELECT 1 FROM sos_alerts sa WHERE sa.id = alert_id AND sa.user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_responder_actions_alert_id ON responder_actions(alert_id);

-- ============================================================
-- TRACKING LINK VIEWS
-- Records each view of a shared live-tracking link (admin dashboard)
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

-- ============================================================
-- SUPABASE REALTIME
-- Enable realtime for live tracking
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE sos_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE location_updates;

-- ============================================================
-- HELPER FUNCTION: Auto-create user profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
