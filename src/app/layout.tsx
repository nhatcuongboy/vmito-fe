import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NODE_ENV === 'production'
      ? process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'https://vmito.com/'
      : 'http://localhost:3000'
  ),
  title: 'Vmito',
  description: 'Quản lý kèo, giải đấu cầu lông chuyên nghiệp',
  manifest: '/manifest.json',
  keywords: [
    'badminton',
    'session',
    'management',
    'sports',
    'court',
    'players',
    'tournament',
    'match'
  ],
  authors: [{ name: 'Vmito' }],
  creator: 'Vmito',
  publisher: 'Vmito',
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
      { url: '/icons/app-logo.png?v=1', type: 'image/png', sizes: '180x180' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Vmito',
  },
  openGraph: {
    type: 'website',
    siteName: 'Vmito',
    title: 'Vmito',
    description: 'Quản lý kèo, giải đấu cầu lông chuyên nghiệp',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Vmito',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vmito',
    description: 'Quản lý kèo, giải đấu cầu lông chuyên nghiệp',
    images: ['/og-image.png'],
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
