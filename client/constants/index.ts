export const COLORS = {
  background: '#020617',
  surface: '#0F172A',
  card: '#111827',
  securityBlue: '#0F4C81',
  emergencyRed: '#EF4444',
  successGreen: '#10B981',
  accentTeal: '#00C2A8',
  text: '#FFFFFF',
  muted: '#94A3B8',
} as const;

export const ALERT_STATUS = {
  active: 'active',
  resolved: 'resolved',
  cancelled: 'cancelled',
} as const;

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const ROUTES = {
  home: '/',
  activeAlert: '/active-alert',
  contacts: '/contacts',
  history: '/history',
  profile: '/profile',
  track: (token: string) => `/track/${token}`,
  responder: '/responder',
  responderAlert: (id: string) => `/responder/alerts/${id}`,
} as const;
