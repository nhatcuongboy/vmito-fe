import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NODE_ENV === 'production'
      ? process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'https://csbadminton.vercel.app/'
      : 'http://localhost:3000'
  ),
  title: 'Badminton Session Management',
  description: 'Manage badminton sessions, players, and courts efficiently',
  manifest: '/manifest.json',
  keywords: [
    'badminton',
    'session',
    'management',
    'sports',
    'court',
    'players',
  ],
  authors: [{ name: 'Badminton App Team' }],
  creator: 'Badminton App Team',
  publisher: 'Badminton App Team',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Badminton App',
  },
  openGraph: {
    type: 'website',
    siteName: 'Badminton Session Management',
    title: 'Badminton Session Management',
    description: 'Manage badminton sessions, players, and courts efficiently',
    images: [
      {
        url: '/icons/icon-512x512.png',
        width: 512,
        height: 512,
        alt: 'Badminton App',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Badminton Session Management',
    description: 'Manage badminton sessions, players, and courts efficiently',
    images: ['/icons/icon-512x512.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#2563eb',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
