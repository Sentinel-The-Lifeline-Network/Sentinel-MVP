'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Contact } from '@/services/contactsService';

interface ContactCardProps {
  contact: Contact;
  index: number;
  onToggle: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (contact: Contact) => void;
}

export default function ContactCard({ contact, index, onToggle, onDelete, onEdit }: ContactCardProps) {
  const [showActions, setShowActions] = useState(false);

  const initials = contact.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

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
          <p className="text-sm font-semibold truncate" style={{ color: '#151515' }}>{contact.full_name}</p>
          <p className="text-xs text-muted truncate">{contact.relationship} · {contact.phone}</p>
        </div>

        {/* Notification toggle */}
        <button
          onClick={() => onToggle(contact.id, !contact.notification_enabled)}
          className="relative w-10 h-6 rounded-full transition-all flex-shrink-0"
          style={{
            background: contact.notification_enabled ? '#1F5A47' : '#E7E0D7',
            border: '2px solid #E7E0D7',
          }}
          aria-label={contact.notification_enabled ? 'Disable notifications' : 'Enable notifications'}
        >
          <motion.div
            className="absolute top-0.5 w-4 h-4 rounded-full bg-white"
            animate={{ left: contact.notification_enabled ? '18px' : '2px' }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </button>

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

      <AnimatePresence>
        {showActions && (
          <motion.div
            className="flex gap-2 mt-3 pt-3"
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
              href={`tel:${contact.phone}`}
              className="flex-1 py-2 rounded-xl text-xs font-semibold text-center transition-all active:scale-95"
              style={{ background: '#F7F4EE', color: '#0B3D2E' }}
            >
              Call
            </a>
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
