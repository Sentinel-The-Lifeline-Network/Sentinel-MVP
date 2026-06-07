export const COLORS = {
  background: '#F7F4EE',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  securityBlue: '#0B3D2E',
  emergencyRed: '#C53A2D',
  successGreen: '#1F5A47',
  accentTeal: '#0B3D2E',
  text: '#151515',
  muted: '#6B6B6B',
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
