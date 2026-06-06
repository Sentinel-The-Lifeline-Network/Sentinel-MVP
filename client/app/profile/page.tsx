'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';

interface Profile {
  full_name: string;
  phone: string;
  email: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ full_name: '', phone: '', security_pin: '', confirm_pin: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Profile>('/api/auth/profile').then((p) => {
      setProfile(p);
      setForm((f) => ({ ...f, full_name: p.full_name || '', phone: p.phone || '' }));
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setError('');
    if (form.security_pin && form.security_pin !== form.confirm_pin) { setError('PINs do not match.'); return; }
    if (form.security_pin && form.security_pin.length < 4) { setError('PIN must be at least 4 digits.'); return; }
    try {
      setSaving(true);
      await api.put('/api/auth/profile', {
        full_name: form.full_name || undefined,
        phone: form.phone || undefined,
        security_pin: form.security_pin || undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const initials = form.full_name ? form.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <div className="min-h-dvh flex flex-col mesh-bg">
      <div className="px-5 pt-14 pb-4 lg:pt-10">
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted mb-1">My</p>
        <h1 className="text-3xl font-black text-white tracking-tight">Profile</h1>
      </div>

      <div className="flex-1 px-5 pb-28 space-y-4 max-w-lg">
        {/* Avatar */}
        <motion.div
          className="flex items-center gap-4 glass-card rounded-2xl p-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div
            className="w-16 h-16 rounded-3xl flex items-center justify-center text-xl font-black flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #DC2626, #991B1B)', boxShadow: '0 0 24px rgba(220,38,38,0.35)' }}
          >
            {initials}
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-tight">{form.full_name || 'Your Name'}</p>
            <p className="text-muted text-xs mt-0.5">{profile?.email || 'Sentinel User'}</p>
            <div
              className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(16,185,129,0.12)' }}
            >
              <div className="w-1 h-1 rounded-full" style={{ background: '#10B981' }} />
              <span className="text-[10px] font-semibold text-success-green">Protected</span>
            </div>
          </div>
        </motion.div>

        {/* Personal info */}
        <div className="glass-card rounded-2xl p-4 space-y-4">
          <p className="text-xs font-bold text-white tracking-widest uppercase">Personal Info</p>
          {[
            { key: 'full_name', label: 'Full Name', placeholder: 'John Doe', type: 'text' },
            { key: 'phone', label: 'Phone Number', placeholder: '+234 800 000 0000', type: 'tel' },
          ].map((field) => (
            <div key={field.key}>
              <label className="text-[10px] text-muted uppercase tracking-widest block mb-1.5">{field.label}</label>
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
        </div>

        {/* Security PIN */}
        <div className="glass-card rounded-2xl p-4 space-y-4">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(0,194,168,0.12)' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00C2A8" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div>
              <p className="text-xs font-bold text-white tracking-widest uppercase">Security PIN</p>
              <p className="text-[11px] text-muted">Required to stop or cancel an emergency alert</p>
            </div>
          </div>
          {[
            { key: 'security_pin', label: 'New PIN', placeholder: '••••' },
            { key: 'confirm_pin', label: 'Confirm PIN', placeholder: '••••' },
          ].map((field) => (
            <div key={field.key}>
              <label className="text-[10px] text-muted uppercase tracking-widest block mb-1.5">{field.label}</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={8}
                placeholder={field.placeholder}
                value={(form as any)[field.key]}
                onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value.replace(/\D/g, '') }))}
                className="w-full px-4 py-3 rounded-xl text-white text-center text-2xl font-mono tracking-[0.4em] outline-none"
                style={{ background: '#0A0E1A', border: '1px solid rgba(255,255,255,0.08)', caretColor: '#EF4444' }}
              />
            </div>
          ))}
        </div>

        {error && <p className="text-sm font-medium text-center" style={{ color: '#F87171' }}>{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60"
          style={{
            background: saved
              ? 'linear-gradient(135deg, #059669, #047857)'
              : 'linear-gradient(135deg, #DC2626, #991B1B)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}
        >
          {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
