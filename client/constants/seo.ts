export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sentinel.app';

export const SEO = {
  title: 'Sentinel - Fast Emergency Response & Safety Network',
  template: '%s | Sentinel',
  description:
    'Sentinel is a mobile-first emergency response platform that helps users send instant SOS alerts, share live location, notify trusted contacts, and connect with responders during emergencies.',
  keywords: [
    'emergency response app',
    'SOS alert app',
    'personal safety app',
    'live location tracking',
    'community safety',
    'security app',
    'emergency contacts',
    'safety network',
    'Sentinel app',
  ],
  ogImage: '/og-image.svg',
};

export const PUBLIC_ROUTES = [
  { path: '/', priority: 1 },
  { path: '/contacts', priority: 0.7 },
  { path: '/history', priority: 0.6 },
  { path: '/profile', priority: 0.5 },
];
