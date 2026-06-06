'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';

interface Props {
  onComplete: () => void;
}

export default function ProfileSetupSheet({ onComplete }: Props) {
  const [form, setForm] = useState({ full_name: '', phone: '', security_pin: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!form.full_name.trim()) { setError('Your name is required.'); return; }
    try {
      setSaving(true);
      setError('');
      await api.post('/api/auth/profile', {
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || undefined,
        security_pin: form.security_pin || undefined,
      });
      onComplete();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end lg:items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="absolute inset-0" style={{ background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(8px)' }} />
      <motion.div
        className="relative w-full max-w-sm glass rounded-t-3xl lg:rounded-3xl p-6 pb-10 lg:pb-6"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 350, damping: 32 }}
      >
        <div className="w-10 h-1 rounded-full bg-white/10 mx-auto mb-6 lg:hidden" />

        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #DC2626, #991B1B)', boxShadow: '0 0 20px rgba(220,38,38,0.3)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Set up Sentinel</h2>
            <p className="text-xs text-muted">Quick setup — takes 30 seconds</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted tracking-widest uppercase block mb-2">Your Name *</label>
            <input
              type="text"
              autoFocus
              placeholder="Jane Doe"
              value={form.full_name}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
              style={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.08)', caretColor: '#EF4444' }}
            />
          </div>
          <div>
            <label className="text-xs text-muted tracking-widest uppercase block mb-2">Phone Number</label>
            <input
              type="tel"
              placeholder="+234..."
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
              style={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.08)', caretColor: '#EF4444' }}
            />
          </div>
          <div>
            <label className="text-xs text-muted tracking-widest uppercase block mb-1">Security PIN <span className="normal-case text-muted/60">(to stop alerts)</span></label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              placeholder="4–8 digits"
              value={form.security_pin}
              onChange={(e) => setForm((f) => ({ ...f, security_pin: e.target.value.replace(/\D/g, '') }))}
              className="w-full px-4 py-3 rounded-xl text-white text-center text-xl font-mono tracking-widest outline-none"
              style={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.08)', caretColor: '#EF4444' }}
            />
          </div>

          {error && <p className="text-sm text-center font-medium" style={{ color: '#F87171' }}>{error}</p>}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60 mt-2"
            style={{ background: 'linear-gradient(135deg, #DC2626, #991B1B)', boxShadow: '0 4px 20px rgba(220,38,38,0.3)' }}
          >
            {saving ? 'Setting up...' : 'Start Using Sentinel'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
