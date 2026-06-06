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

  const whatsappUrl = (phone: string) => {
    const clean = phone.replace(/\D/g, '');
    return `https://wa.me/${clean}?text=${encodedMessage}`;
  };

  const smsUrl = (phone: string) => `sms:${phone}?body=${encodedMessage}`;

  if (enabledContacts.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-4 text-center">
        <p className="text-sm text-muted">No contacts set for notification.</p>
        <a href="/contacts" className="text-xs font-semibold mt-1 block" style={{ color: '#00C2A8' }}>
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
          background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
          color: copied ? '#10B981' : '#94A3B8',
          border: '1px solid rgba(255,255,255,0.06)',
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
            className="glass-card rounded-2xl p-3"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #0F4C81, #00C2A8)' }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{contact.full_name}</p>
                <p className="text-xs text-muted truncate">{contact.relationship} · {contact.phone}</p>
              </div>
              {isSent && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}
                >
                  NOTIFIED
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <a
                href={whatsappUrl(contact.phone)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => markSent(contact.id)}
                className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-bold transition-all active:scale-95"
                style={{ background: 'rgba(37,211,102,0.12)', color: '#25D366', border: '1px solid rgba(37,211,102,0.15)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                WhatsApp
              </a>

              <a
                href={smsUrl(contact.phone)}
                onClick={() => markSent(contact.id)}
                className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-bold transition-all active:scale-95"
                style={{ background: 'rgba(96,165,250,0.1)', color: '#60A5FA', border: '1px solid rgba(96,165,250,0.12)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                SMS
              </a>

              <a
                href={`tel:${contact.phone}`}
                className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-bold transition-all active:scale-95"
                style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.12)' }}
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
