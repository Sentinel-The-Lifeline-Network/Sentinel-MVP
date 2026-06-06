'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useSOS } from '@/hooks/useSOS';

const navItems = [
  {
    href: '/',
    label: 'Home',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: '/contacts',
    label: 'Contacts',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: '/history',
    label: 'History',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    href: '/responder',
    label: 'Responder',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { state } = useSOS();
  const isEmergencyActive = state === 'active';

  return (
    <aside
      className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 z-40"
      style={{
        background: 'linear-gradient(180deg, #080E1C 0%, #050A14 100%)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Logo */}
      <div className="px-6 pt-8 pb-6">
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #DC2626, #991B1B)',
              boxShadow: '0 0 20px rgba(220,38,38,0.4)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight">Sentinel</h1>
            <p className="text-[10px] text-muted tracking-widest uppercase -mt-0.5">Lifeline Network</p>
          </div>
        </div>
      </div>

      {/* Emergency status banner */}
      {isEmergencyActive && (
        <motion.div
          className="mx-4 mb-4 rounded-xl px-3 py-2.5 flex items-center gap-2"
          style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: '#EF4444' }}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
          <Link href="/active-alert" className="text-xs font-bold text-emergency-red">
            Alert Active — View →
          </Link>
        </motion.div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group"
              style={{
                background: isActive ? 'rgba(239,68,68,0.1)' : 'transparent',
                color: isActive ? '#F87171' : '#64748B',
              }}
            >
              <span
                className="transition-colors"
                style={{ color: isActive ? '#EF4444' : '#64748B' }}
              >
                {item.icon}
              </span>
              <span
                className="text-sm font-medium transition-colors"
                style={{ color: isActive ? '#F1F5F9' : '#64748B' }}
              >
                {item.label}
              </span>
              {isActive && (
                <div className="ml-auto w-1 h-4 rounded-full" style={{ background: '#EF4444' }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* System status */}
      <div className="px-4 pb-6 pt-4 border-t border-white/5">
        <div className="glass-card rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: isEmergencyActive ? '#EF4444' : '#10B981',
                boxShadow: isEmergencyActive ? '0 0 8px rgba(239,68,68,0.8)' : '0 0 8px rgba(16,185,129,0.8)',
              }}
            />
            <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: isEmergencyActive ? '#F87171' : '#10B981' }}>
              {isEmergencyActive ? 'Emergency Mode' : 'System Ready'}
            </span>
          </div>
          <p className="text-[11px] text-muted leading-relaxed">
            {isEmergencyActive
              ? 'Active emergency in progress. Contacts notified.'
              : 'All systems operational. Ready to protect you.'}
          </p>
        </div>
      </div>
    </aside>
  );
}
