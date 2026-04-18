import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NODE_ENV === 'production'
      ? 'https://vmito.com'
      : 'http://localhost:3000'
  ),
  title: {
    default: 'Vmito — Tìm kèo cầu lông',
    template: '%s | Vmito',
  },
  description:
    'Tìm kèo cầu lông, giao lưu, quản lý giải đấu chuyên nghiệp tại Việt Nam. Dạy sớm healthy, cầu lông dưỡng sinh, giao lưu cuối tuần.',
  manifest: '/manifest.json',
  keywords: [
    'cầu lông',
    'tìm kèo',
    'giao lưu cầu lông',
    'giải đấu cầu lông',
    'sân cầu lông',
    'kèo cầu lông',
    'quản lý kèo',
    'cầu lông dưỡng sinh',
    'giao lưu cuối tuần',
    'badminton',
    'badminton Vietnam',
    'tournament',
    'sports',
    'Vmito',
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
    icon: [{ url: '/icons/app-logo.png?v=1', type: 'image/png' }],
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
    title: 'Vmito — Tìm kèo cầu lông',
    description:
      'Tìm kèo cầu lông, giao lưu, quản lý giải đấu chuyên nghiệp tại Việt Nam.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Vmito — Tìm kèo cầu lông',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vmito — Tìm kèo cầu lông',
    description:
      'Tìm kèo cầu lông, giao lưu, quản lý giải đấu chuyên nghiệp tại Việt Nam.',
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
