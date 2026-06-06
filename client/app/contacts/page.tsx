'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ContactCard from '@/components/ContactCard';
import { useContacts } from '@/hooks/useContacts';
import { Contact, ContactInput } from '@/services/contactsService';

const emptyForm: ContactInput = {
  full_name: '',
  phone: '',
  email: '',
  relationship: '',
  notification_enabled: true,
};

const RELATIONSHIP_PRESETS = ['Spouse', 'Parent', 'Sibling', 'Friend', 'Colleague', 'Other'];

export default function ContactsPage() {
  const { contacts, loading, addContact, updateContact, removeContact } = useContacts();
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [form, setForm] = useState<ContactInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  const openAdd = () => {
    setEditingContact(null);
    setForm(emptyForm);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (contact: Contact) => {
    setEditingContact(contact);
    setForm({ full_name: contact.full_name, phone: contact.phone, email: contact.email || '', relationship: contact.relationship, notification_enabled: contact.notification_enabled });
    setFormError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.full_name.trim() || !form.phone.trim() || !form.email.trim() || !form.relationship.trim()) {
      setFormError('Name, WhatsApp number, working email, and relationship are required.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      setFormError('Enter a working email address for automatic SOS alerts.');
      return;
    }
    try {
      setSaving(true);
      if (editingContact) {
        await updateContact(editingContact.id, form);
      } else {
        await addContact(form);
      }
      setShowForm(false);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Web Contacts API import
  const importFromDevice = async () => {
    setImportResult(null);
    if (!('contacts' in navigator) || !('ContactsManager' in window)) {
      setImportResult('Your browser does not support device contact import. Add contacts manually.');
      return;
    }
    try {
      setImporting(true);
      const selected: any[] = await (navigator as any).contacts.select(['name', 'tel', 'email'], { multiple: true });
      if (!selected.length) { setImportResult('No contacts selected.'); return; }
      let added = 0;
      for (const c of selected) {
        const name = c.name?.[0] || 'Unknown';
        const phone = c.tel?.[0] || '';
        if (!phone) continue;
        const email = c.email?.[0] || '';
        if (!email) continue;
        await addContact({ full_name: name, phone, email, relationship: 'Contact', notification_enabled: true }).catch(() => {});
        added++;
      }
      setImportResult(`${added} contact${added !== 1 ? 's' : ''} imported successfully.`);
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setImportResult(null);
      } else {
        setImportResult('Import failed. Please add contacts manually.');
      }
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col mesh-bg">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 lg:pt-10">
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted mb-1">Emergency</p>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Contacts</h1>
            <p className="text-muted text-xs mt-1">
              {contacts.filter((c) => c.notification_enabled).length} active ·{' '}
              {contacts.length} total
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Import button */}
            <motion.button
              onClick={importFromDevice}
              disabled={importing}
              whileTap={{ scale: 0.92 }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
              style={{ background: 'rgba(0,194,168,0.12)', color: '#00C2A8', border: '1px solid rgba(0,194,168,0.2)' }}
            >
              {importing ? (
                <div className="w-3 h-3 rounded-full border border-t-transparent border-accent-teal animate-spin" />
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="17" y1="11" x2="23" y2="11"/><line x1="20" y1="8" x2="20" y2="14"/></svg>
              )}
              Import
            </motion.button>

            {/* Add button */}
            <motion.button
              onClick={openAdd}
              whileTap={{ scale: 0.9 }}
              className="w-9 h-9 rounded-2xl flex items-center justify-center transition-all"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </motion.button>
          </div>
        </div>

        {/* Import result toast */}
        <AnimatePresence>
          {importResult && (
            <motion.div
              className="mt-3 rounded-xl px-3 py-2 flex items-center gap-2"
              style={{ background: 'rgba(0,194,168,0.1)', border: '1px solid rgba(0,194,168,0.15)' }}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00C2A8" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
              <p className="text-xs font-medium" style={{ color: '#00C2A8' }}>{importResult}</p>
              <button onClick={() => setImportResult(null)} className="ml-auto text-muted text-xs">✕</button>
            </motion.div>
          )}
        </AnimatePresence>
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
              style={{ background: 'linear-gradient(135deg, rgba(15,76,129,0.2), rgba(0,194,168,0.1))', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#grad)" strokeWidth="1.5" strokeLinecap="round">
                <defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#0F4C81"/><stop offset="100%" stopColor="#00C2A8"/></linearGradient></defs>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <line x1="23" y1="11" x2="17" y2="11"/><line x1="20" y1="8" x2="20" y2="14"/>
              </svg>
            </div>
            <p className="text-white font-bold text-lg">No contacts yet</p>
            <p className="text-muted text-sm mt-1 max-w-[220px] mx-auto leading-relaxed">
              Add people who should be alerted when you trigger SOS
            </p>
            <div className="flex gap-2 justify-center mt-5">
              <button
                onClick={importFromDevice}
                className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                style={{ background: 'rgba(0,194,168,0.12)', color: '#00C2A8', border: '1px solid rgba(0,194,168,0.2)' }}
              >
                Import from Phone
              </button>
              <button
                onClick={openAdd}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all active:scale-95"
                style={{ background: '#EF4444' }}
              >
                Add Manually
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
                onToggle={(id, enabled) => updateContact(id, { notification_enabled: enabled })}
                onDelete={removeContact}
                onEdit={openEdit}
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
              style={{ background: 'rgba(2,6,23,0.8)', backdropFilter: 'blur(8px)' }}
              onClick={() => setShowForm(false)}
            />
            <motion.div
              className="relative w-full max-w-sm glass rounded-t-3xl lg:rounded-3xl p-5 pb-10 lg:pb-6"
              style={{ maxHeight: '90dvh', overflowY: 'auto' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            >
              <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-5 lg:hidden" />
              <h3 className="text-base font-black text-white mb-2">
                {editingContact ? 'Edit Contact' : 'New Contact'}
              </h3>
              <p className="text-xs text-muted leading-relaxed mb-5">
                Use a WhatsApp-enabled phone number and a working email. Sentinel sends SOS alerts automatically through both channels and repeats them every 5 minutes until you mark safe or cancel.
              </p>

              <div className="space-y-4">
                {[
                  { key: 'full_name', label: 'Full Name *', placeholder: 'Jane Doe', type: 'text' },
                  { key: 'phone', label: 'WhatsApp Number *', placeholder: '+234 800 000 0000', type: 'tel' },
                  { key: 'email', label: 'Working Email *', placeholder: 'jane@email.com', type: 'email' },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="text-[10px] text-muted tracking-widest uppercase block mb-1.5">{field.label}</label>
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={(form as any)[field.key]}
                      onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                      style={{ background: '#0A0E1A', border: '1px solid rgba(255,255,255,0.08)', caretColor: '#EF4444' }}
                    />
                  </div>
                ))}

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
                          background: form.relationship === r ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)',
                          color: form.relationship === r ? '#F87171' : '#64748B',
                          border: `1px solid ${form.relationship === r ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.07)'}`,
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
                    className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none"
                    style={{ background: '#0A0E1A', border: '1px solid rgba(255,255,255,0.08)', caretColor: '#EF4444' }}
                  />
                </div>

                {/* Notify toggle */}
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-semibold text-white">Alert on SOS</p>
                    <p className="text-xs text-muted">Automatically message this contact on WhatsApp and email</p>
                  </div>
                  <button
                    onClick={() => setForm((f) => ({ ...f, notification_enabled: !f.notification_enabled }))}
                    className="relative w-12 h-6 rounded-full transition-all flex-shrink-0"
                    style={{ background: form.notification_enabled ? '#10B981' : '#1E293B' }}
                  >
                    <motion.div
                      className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow"
                      animate={{ left: form.notification_enabled ? '26px' : '2px' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>

                {formError && <p className="text-sm font-medium text-center" style={{ color: '#F87171' }}>{formError}</p>}

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #DC2626, #991B1B)', boxShadow: '0 4px 20px rgba(220,38,38,0.25)' }}
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
