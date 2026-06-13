'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ContactCard from '@/components/ContactCard';
import { useContacts } from '@/hooks/useContacts';
import { Contact, ContactInput, MAX_CONTACTS } from '@/services/contactsService';

const RELATIONSHIP_PRESETS = ['Spouse', 'Parent', 'Sibling', 'Friend', 'Colleague', 'Other'];

const COUNTRY_CODES = [
  { code: '+234', label: '🇳🇬 +234' },
  { code: '+1', label: '🇺🇸 +1' },
  { code: '+44', label: '🇬🇧 +44' },
  { code: '+233', label: '🇬🇭 +233' },
  { code: '+254', label: '🇰🇪 +254' },
  { code: '+27', label: '🇿🇦 +27' },
  { code: '+91', label: '🇮🇳 +91' },
];

const PRIORITY_OPTIONS = [
  { value: 1, label: 'High' },
  { value: 2, label: 'Medium' },
  { value: 3, label: 'Low' },
];

interface FormState {
  contact_name: string;
  countryCode: string;
  nationalNumber: string;
  relationship: string;
  priority: number;
}

const emptyForm: FormState = {
  contact_name: '',
  countryCode: '+234',
  nationalNumber: '',
  relationship: '',
  priority: 3,
};

const splitPhoneNumber = (phoneNumber: string): { countryCode: string; nationalNumber: string } => {
  const match = COUNTRY_CODES.find((c) => phoneNumber.startsWith(c.code));
  if (match) return { countryCode: match.code, nationalNumber: phoneNumber.slice(match.code.length) };
  return { countryCode: '+234', nationalNumber: phoneNumber.replace(/^\+/, '') };
};

export default function ContactsPage() {
  const { contacts, loading, addContact, updateContact, removeContact, resendInvite } = useContacts();
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const atLimit = contacts.length >= MAX_CONTACTS;

  const openAdd = () => {
    setEditingContact(null);
    setForm(emptyForm);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (contact: Contact) => {
    setEditingContact(contact);
    const { countryCode, nationalNumber } = splitPhoneNumber(contact.phone_number);
    setForm({
      contact_name: contact.contact_name,
      countryCode,
      nationalNumber,
      relationship: contact.relationship,
      priority: contact.priority,
    });
    setFormError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    const nationalDigits = form.nationalNumber.replace(/\D/g, '');
    if (!form.contact_name.trim() || !nationalDigits || !form.relationship.trim()) {
      setFormError('Name, phone number, and relationship are required.');
      return;
    }

    const payload: ContactInput = {
      contact_name: form.contact_name.trim(),
      phone_number: `${form.countryCode}${nationalDigits}`,
      relationship: form.relationship.trim(),
      priority: form.priority,
    };

    try {
      setSaving(true);
      if (editingContact) {
        await updateContact(editingContact.id, payload);
      } else {
        await addContact(payload);
      }
      setShowForm(false);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col mesh-bg">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 lg:pt-10">
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted mb-1">Emergency</p>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight" style={{ color: '#151515' }}>Guardian Circle</h1>
            <p className="text-muted text-xs mt-1">{contacts.length}/{MAX_CONTACTS} contacts added</p>
          </div>

          <motion.button
            onClick={openAdd}
            disabled={atLimit}
            whileTap={{ scale: 0.9 }}
            className="w-9 h-9 rounded-2xl flex items-center justify-center transition-all disabled:opacity-40"
            style={{ background: '#EDE0DD', border: '1px solid #E7E0D7' }}
            aria-label="Add contact"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#C53A2D" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </motion.button>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: '#E7E0D7' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${(contacts.length / MAX_CONTACTS) * 100}%`, background: '#0B3D2E' }}
          />
        </div>

        {atLimit && (
          <p className="text-xs text-muted mt-2">
            You&apos;ve reached the maximum of {MAX_CONTACTS} emergency contacts. Remove one to add another.
          </p>
        )}
      </div>

      {/* List */}
      <div className="flex-1 px-5 pb-28 space-y-2.5">
        {loading ? (
          <div className="flex items-center justify-center pt-16">
            <div className="w-7 h-7 rounded-full border-2 border-emergency-red border-t-transparent animate-spin" />
          </div>
        ) : contacts.length === 0 ? (
          <motion.div className="text-center pt-16" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5"
              style={{ background: '#FFFFFF', border: '1px solid #E7E0D7' }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0B3D2E" strokeWidth="1.5" strokeLinecap="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <line x1="23" y1="11" x2="17" y2="11"/><line x1="20" y1="8" x2="20" y2="14"/>
              </svg>
            </div>
            <p className="font-bold text-lg" style={{ color: '#151515' }}>No contacts yet</p>
            <p className="text-muted text-sm mt-1 max-w-[220px] mx-auto leading-relaxed">
              Add people who should be alerted when you trigger SOS
            </p>
            <div className="flex gap-2 justify-center mt-5">
              <button
                onClick={openAdd}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all active:scale-95"
                style={{ background: '#C53A2D' }}
              >
                Add Contact
              </button>
            </div>
          </motion.div>
        ) : (
          <AnimatePresence>
            {contacts.map((c, i) => (
              <ContactCard
                key={c.id}
                contact={c}
                index={i}
                onDelete={removeContact}
                onEdit={openEdit}
                onResendInvite={resendInvite}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Add/Edit sheet */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end lg:items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0"
              style={{ background: 'rgba(21,21,21,0.36)' }}
              onClick={() => setShowForm(false)}
            />
            <motion.div
              className="relative w-full max-w-sm sentinel-surface rounded-t-3xl lg:rounded-3xl p-5 pb-10 lg:pb-6"
              style={{ maxHeight: '90dvh', overflowY: 'auto' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            >
              <div className="w-10 h-1 rounded-full mx-auto mb-5 lg:hidden" style={{ background: '#E7E0D7' }} />
              <h3 className="text-base font-black mb-2" style={{ color: '#151515' }}>
                {editingContact ? 'Edit Contact' : 'New Contact'}
              </h3>

              {/* WhatsApp invite notice */}
              <div className="rounded-xl px-3 py-2.5 mb-5" style={{ background: '#E2F4F3', border: '1px solid #BFE5E3' }}>
                <p className="text-xs leading-relaxed" style={{ color: '#0E7C7B' }}>
                  Sentinel will send an invite link to your emergency contacts on WhatsApp. Once they join and enable notifications, they can receive instant push alerts whenever you trigger an SOS.
                </p>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="text-[10px] text-muted tracking-widest uppercase block mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    placeholder="Jane Doe"
                    value={form.contact_name}
                    onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))}
                    className="sentinel-input w-full px-4 py-3 rounded-xl text-sm outline-none"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="text-[10px] text-muted tracking-widest uppercase block mb-1.5">Phone Number *</label>
                  <div className="flex gap-2">
                    <select
                      value={form.countryCode}
                      onChange={(e) => setForm((f) => ({ ...f, countryCode: e.target.value }))}
                      className="sentinel-input px-2 py-3 rounded-xl text-sm outline-none"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>{c.label}</option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      placeholder="800 000 0000"
                      value={form.nationalNumber}
                      onChange={(e) => setForm((f) => ({ ...f, nationalNumber: e.target.value }))}
                      className="sentinel-input flex-1 px-4 py-3 rounded-xl text-sm outline-none"
                    />
                  </div>
                </div>

                {/* Relationship presets */}
                <div>
                  <label className="text-[10px] text-muted tracking-widest uppercase block mb-1.5">Relationship *</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {RELATIONSHIP_PRESETS.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, relationship: r }))}
                        className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                        style={{
                          background: form.relationship === r ? '#EDE0DD' : '#FFFFFF',
                          color: form.relationship === r ? '#C53A2D' : '#6B6B6B',
                          border: '1px solid #E7E0D7',
                        }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Or type custom..."
                    value={form.relationship}
                    onChange={(e) => setForm((f) => ({ ...f, relationship: e.target.value }))}
                    className="sentinel-input w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="text-[10px] text-muted tracking-widest uppercase block mb-1.5">Priority</label>
                  <div className="flex gap-1.5">
                    {PRIORITY_OPTIONS.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, priority: p.value }))}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                        style={{
                          background: form.priority === p.value ? '#EDE0DD' : '#FFFFFF',
                          color: form.priority === p.value ? '#C53A2D' : '#6B6B6B',
                          border: '1px solid #E7E0D7',
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {formError && <p className="text-sm font-medium text-center" style={{ color: '#C53A2D' }}>{formError}</p>}

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60"
                  style={{ background: '#0B3D2E' }}
                >
                  {saving ? 'Saving...' : editingContact ? 'Save Changes' : 'Add Contact'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
