import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AppShell from '@/components/AppShell';
import { AuthProvider } from '@/lib/authContext';
import { SEO, SITE_URL } from '@/constants/seo';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: 'Sentinel',
  title: {
    default: SEO.title,
    template: SEO.template,
  },
  description: SEO.description,
  keywords: SEO.keywords,
  alternates: {
    canonical: '/',
  },
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Sentinel' },
  icons: {
    icon: [{ url: '/icons/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icons/icon.svg', type: 'image/svg+xml' }],
  },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'Sentinel',
    title: SEO.title,
    description: SEO.description,
    images: [{ url: SEO.ogImage, width: 1200, height: 630, alt: 'Sentinel lifeline network' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SEO.title,
    description: SEO.description,
    images: [SEO.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'technology',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#020617',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Sentinel',
              applicationCategory: 'SafetyApplication',
              operatingSystem: 'Android, iOS, Web',
              description: SEO.description,
              url: SITE_URL,
            }).replace(/</g, '\\u003c'),
          }}
        />
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker'in navigator){let refreshing=false;window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').then((registration)=>{registration.update().catch(()=>{});}).catch(()=>{});navigator.serviceWorker.addEventListener('message',(event)=>{if(event.data?.type==='SENTINEL_SW_UPDATED'&&!refreshing){refreshing=true;window.location.reload();}});navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!refreshing){refreshing=true;window.location.reload();}});});}`,
          }}
        />
      </body>
    </html>
  );
}
