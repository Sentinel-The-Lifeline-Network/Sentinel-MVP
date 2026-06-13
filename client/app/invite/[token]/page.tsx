'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { inviteService, InviteInfo } from '@/services/inviteService';
import { requestPushPermissionAndToken } from '@/lib/firebase';

type Step = 'loading' | 'error' | 'invite' | 'accepted' | 'push-enabled';

export default function InvitePage({ params }: { params: { token: string } }) {
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [step, setStep] = useState<Step>('loading');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    inviteService
      .getInvite(params.token)
      .then((data) => {
        setInfo(data);
        setStep(data.status === 'push_enabled' ? 'push-enabled' : data.status === 'accepted' ? 'accepted' : 'invite');
      })
      .catch((err: any) => {
        setError(err.message);
        setStep('error');
      });
  }, [params.token]);

  const handleAccept = async () => {
    try {
      setBusy(true);
      await inviteService.acceptInvite(params.token);
      setStep('accepted');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleEnablePush = async () => {
    try {
      setBusy(true);
      const fcmToken = await requestPushPermissionAndToken();
      if (!fcmToken) {
        setError('Push permission was not granted. You can still receive alerts via WhatsApp.');
        return;
      }
      await inviteService.registerPushToken(params.token, fcmToken);
      setStep('push-enabled');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (step === 'loading') {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: '#F7F4EE' }}>
        <div className="w-10 h-10 rounded-full border-2 border-emergency-red border-t-transparent animate-spin" />
      </div>
    );
  }

  if (step === 'error' || !info) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center" style={{ background: '#F7F4EE' }}>
        <div
          className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4"
          style={{ background: '#EDE0DD', border: '1px solid #E7E0D7' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C53A2D" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <p className="font-bold text-lg" style={{ color: '#151515' }}>Invite Not Found</p>
        <p className="text-muted text-sm mt-2">{error || 'This invite link may have expired.'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center" style={{ background: '#F7F4EE' }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm sentinel-surface rounded-3xl p-6"
      >
        <div
          className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4"
          style={{ background: '#E1EFE8', border: '1px solid #E7E0D7' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0B3D2E" strokeWidth="1.5" strokeLinecap="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M22 11l-3 3-1.5-1.5" />
          </svg>
        </div>

        <h1 className="text-xl font-black" style={{ color: '#151515' }}>Sentinel – The Lifeline Network</h1>

        {step === 'invite' && (
          <>
            <p className="text-sm text-muted mt-3 leading-relaxed">
              <strong>{info.userName}</strong> added you as an emergency contact on Sentinel. Accept the invite to receive their SOS alerts.
            </p>
            <button
              onClick={handleAccept}
              disabled={busy}
              className="w-full mt-6 py-3.5 rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60"
              style={{ background: '#0B3D2E' }}
            >
              {busy ? 'Accepting...' : 'Accept Invite'}
            </button>
          </>
        )}

        {step === 'accepted' && (
          <>
            <p className="text-sm text-muted mt-3 leading-relaxed">
              You&apos;ve accepted the invite from <strong>{info.userName}</strong>. Enable push notifications to receive instant emergency alerts in addition to WhatsApp.
            </p>
            <button
              onClick={handleEnablePush}
              disabled={busy}
              className="w-full mt-6 py-3.5 rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60"
              style={{ background: '#0B3D2E' }}
            >
              {busy ? 'Enabling...' : 'Enable Push Notifications'}
            </button>
          </>
        )}

        {step === 'push-enabled' && (
          <p className="text-sm text-muted mt-3 leading-relaxed">
            You&apos;re all set. You&apos;ll receive instant emergency alerts from <strong>{info.userName}</strong> through WhatsApp and push notifications whenever they trigger an SOS.
          </p>
        )}

        {error && step !== 'error' && (
          <p className="text-sm font-medium mt-4" style={{ color: '#C53A2D' }}>{error}</p>
        )}
      </motion.div>
    </div>
  );
}
