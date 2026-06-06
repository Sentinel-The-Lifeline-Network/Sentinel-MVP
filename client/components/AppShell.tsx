'use client';
import { useState, useEffect, ReactNode } from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import ProfileSetupSheet from './ProfileSetupSheet';
import { useAuth } from '@/lib/authContext';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';

export default function AppShell({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const [needsProfile, setNeedsProfile] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);

  useEffect(() => {
    if (!session || profileChecked) return;
    api.get('/api/auth/profile')
      .then(() => setProfileChecked(true))
      .catch((err: any) => {
        // Profile not found — prompt setup
        if (err.message?.includes('Profile not set up') || err.message?.includes('not found')) {
          setNeedsProfile(true);
        }
        setProfileChecked(true);
      });
  }, [session, profileChecked]);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: '#020617' }}>
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #DC2626, #991B1B)', boxShadow: '0 0 30px rgba(220,38,38,0.4)' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: '#EF4444' }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh" style={{ background: '#020617' }}>
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 lg:pl-64 flex flex-col">
        {/* Mobile: constrain + center like a phone app */}
        <div className="lg:hidden flex-1 flex flex-col max-w-[430px] w-full mx-auto">
          {children}
        </div>
        {/* Desktop: full width */}
        <div className="hidden lg:flex flex-1 flex-col">
          {children}
        </div>
      </div>

      <BottomNav />

      {needsProfile && (
        <ProfileSetupSheet onComplete={() => setNeedsProfile(false)} />
      )}
    </div>
  );
}
