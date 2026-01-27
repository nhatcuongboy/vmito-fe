import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NODE_ENV === 'production'
      ? process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'https://csbadminton.vercel.app/'
      : 'http://localhost:3000'
  ),
  title: 'LenKeo24h',
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
  authors: [{ name: 'LenKeo24h' }],
  creator: 'LenKeo24h',
  publisher: 'LenKeo24h',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icons/app-logo.png?v=1', type: 'image/png' },
    ],
    shortcut: ['/icons/app-logo.png?v=1'],
    apple: [
      { url: '/icons/app-logo.png?v=1', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Badminton App',
  },
  openGraph: {
    type: 'website',
    siteName: 'LenKeo24h',
    title: 'LenKeo24h',
    description: 'Manage badminton sessions, players, and courts efficiently',
    images: [
      {
        url: '/icons/app-logo.png',
        width: 512,
        height: 512,
        alt: 'LenKeo24h',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'LenKeo24h',
    description: 'Manage badminton sessions, players, and courts efficiently',
    images: ['/icons/app-logo.png'],
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
