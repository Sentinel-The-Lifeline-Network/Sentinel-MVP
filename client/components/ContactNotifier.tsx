'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Contact } from '@/services/contactsService';

interface Props {
  contacts: Contact[];
  trackingUrl: string | null;
  userName: string;
  alertTime: string;
}

const buildMessage = (userName: string, trackingUrl: string | null, alertTime: string) => {
  const time = new Date(alertTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const date = new Date(alertTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return [
    `🚨 EMERGENCY ALERT`,
    ``,
    `${userName} has triggered an emergency SOS and needs immediate help.`,
    ``,
    trackingUrl ? `📍 Live location tracking:\n${trackingUrl}` : `📍 Location tracking unavailable`,
    ``,
    `⏰ Alert triggered: ${time} · ${date}`,
    ``,
    `Please respond immediately or contact emergency services (199/112/911).`,
    ``,
    `— Sent via Sentinel Emergency App`,
  ].join('\n');
};

interface NotifyState {
  [contactId: string]: 'idle' | 'sent';
}

export default function ContactNotifier({ contacts, trackingUrl, userName, alertTime }: Props) {
  const [notified, setNotified] = useState<NotifyState>({});
  const [copied, setCopied] = useState(false);

  const enabledContacts = contacts.filter((c) => c.notification_enabled);
  const message = buildMessage(userName, trackingUrl, alertTime);
  const encodedMessage = encodeURIComponent(message);

  const markSent = (id: string) => setNotified((n) => ({ ...n, [id]: 'sent' }));

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  const smsUrl = (phone: string) => `sms:${phone}?body=${encodedMessage}`;

  if (enabledContacts.length === 0) {
    return (
      <div className="sentinel-card rounded-2xl p-4 text-center">
        <p className="text-sm text-muted">No contacts set for notification.</p>
        <a href="/contacts" className="text-xs font-semibold mt-1 block" style={{ color: '#0B3D2E' }}>
          Add emergency contacts →
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Copy message button */}
      <button
        onClick={copyMessage}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-[0.98]"
        style={{
          background: copied ? '#F7F4EE' : '#FFFFFF',
          color: copied ? '#0B3D2E' : '#6B6B6B',
          border: '1px solid #E7E0D7',
        }}
      >
        {copied ? (
          <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Message Copied</>
        ) : (
          <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy Emergency Message</>
        )}
      </button>

      {/* Contact rows */}
      {enabledContacts.map((contact, i) => {
        const isSent = notified[contact.id] === 'sent';
        const initials = contact.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

        return (
          <motion.div
            key={contact.id}
            className="sentinel-card rounded-2xl p-3"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: '#F7F4EE', color: '#0B3D2E', border: '1px solid #E7E0D7' }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: '#151515' }}>{contact.full_name}</p>
                <p className="text-xs text-muted truncate">{contact.relationship} · {contact.phone}</p>
              </div>
              {isSent && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: '#F7F4EE', color: '#0B3D2E', border: '1px solid #E7E0D7' }}
                >
                  NOTIFIED
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <a
                href={smsUrl(contact.phone)}
                onClick={() => markSent(contact.id)}
                className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-bold transition-all active:scale-95"
                style={{ background: '#EDE0DD', color: '#C53A2D', border: '1px solid #E7E0D7' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                SMS
              </a>

              <a
                href={`tel:${contact.phone}`}
                className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-bold transition-all active:scale-95"
                style={{ background: '#F7F4EE', color: '#0B3D2E', border: '1px solid #E7E0D7' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l1.06-1.06a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                Call
              </a>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
