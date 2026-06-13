'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Contact, InviteStatus } from '@/services/contactsService';

interface ContactCardProps {
  contact: Contact;
  index: number;
  onDelete: (id: string) => void;
  onEdit: (contact: Contact) => void;
  onResendInvite: (id: string) => void;
}

const PRIORITY_LABELS: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: 'High', color: '#C53A2D', bg: '#FBEAE7' },
  2: { label: 'Medium', color: '#A8730B', bg: '#FBF1DE' },
  3: { label: 'Low', color: '#3D6B5C', bg: '#E7F0EC' },
};

const STATUS_BADGES: Record<InviteStatus, { label: string; color: string; bg: string }> = {
  pending_invite: { label: 'Pending Invite', color: '#A8730B', bg: '#FBF1DE' },
  accepted: { label: 'Accepted', color: '#1D5DAD', bg: '#E6EEF9' },
  push_enabled: { label: 'Push Enabled', color: '#1F5A47', bg: '#E1EFE8' },
  push_disabled: { label: 'Push Disabled', color: '#6B6B6B', bg: '#F0EEEA' },
  whatsapp_only: { label: 'WhatsApp Only', color: '#0E7C7B', bg: '#E2F4F3' },
};

export default function ContactCard({ contact, index, onDelete, onEdit, onResendInvite }: ContactCardProps) {
  const [showActions, setShowActions] = useState(false);

  const initials = contact.contact_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const priority = PRIORITY_LABELS[contact.priority] || PRIORITY_LABELS[3];
  const status = STATUS_BADGES[contact.invite_status] || STATUS_BADGES.pending_invite;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      whileHover={{ y: -2 }}
      transition={{ delay: index * 0.07, duration: 0.35 }}
      className="sentinel-card sentinel-card-interactive rounded-2xl p-4"
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ background: '#F7F4EE', color: '#0B3D2E', border: '1px solid #E7E0D7' }}
        >
          {initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: '#151515' }}>{contact.contact_name}</p>
          <p className="text-xs text-muted truncate">{contact.relationship} · {contact.phone_number}</p>
        </div>

        {/* More button */}
        <button
          onClick={() => setShowActions(!showActions)}
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: '#F7F4EE' }}
          aria-expanded={showActions}
          aria-label={showActions ? 'Hide contact actions' : 'Show contact actions'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
          </svg>
        </button>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-1.5 mt-3">
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide"
          style={{ color: priority.color, background: priority.bg }}
        >
          {priority.label} Priority
        </span>
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide"
          style={{ color: status.color, background: status.bg }}
        >
          {status.label}
        </span>
      </div>

      <AnimatePresence>
        {showActions && (
          <motion.div
            className="flex gap-2 mt-3 pt-3 flex-wrap"
            style={{ borderTop: '1px solid #E7E0D7' }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button
              onClick={() => { onEdit(contact); setShowActions(false); }}
              className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
              style={{ background: '#F7F4EE', color: '#0B3D2E' }}
            >
              Edit
            </button>
            <a
              href={`tel:${contact.phone_number}`}
              className="flex-1 py-2 rounded-xl text-xs font-semibold text-center transition-all active:scale-95"
              style={{ background: '#F7F4EE', color: '#0B3D2E' }}
            >
              Call
            </a>
            {contact.invite_status !== 'push_enabled' && (
              <button
                onClick={() => { onResendInvite(contact.id); setShowActions(false); }}
                className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
                style={{ background: '#E2F4F3', color: '#0E7C7B' }}
              >
                Resend Invite
              </button>
            )}
            <button
              onClick={() => { onDelete(contact.id); setShowActions(false); }}
              className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
              style={{ background: '#EDE0DD', color: '#C53A2D' }}
            >
              Remove
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
