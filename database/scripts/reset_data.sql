-- ============================================================
-- Reset Sentinel data — DESTRUCTIVE, CANNOT BE UNDONE
-- Run in Supabase SQL Editor only when you want to wipe all
-- app data and start fresh (e.g. before a real launch).
--
-- Schema and table structure are NOT affected — only rows.
-- ============================================================

-- ------------------------------------------------------------
-- OPTION A — Wipe app data but KEEP existing login accounts
-- (auth.users untouched; everyone keeps the same email/password)
-- ------------------------------------------------------------
truncate table
  tracking_link_views,
  notifications_log,
  evidence_records,
  responder_actions,
  location_updates,
  sos_alerts,
  emergency_contacts
restart identity cascade;

-- ------------------------------------------------------------
-- OPTION B — Full reset, including login accounts
-- Deleting from auth.users cascades to public.users and every
-- table above (all have ON DELETE CASCADE back to users).
-- Uncomment to use. Anyone who signed up will need to sign up
-- again.
-- ------------------------------------------------------------
-- delete from auth.users;
