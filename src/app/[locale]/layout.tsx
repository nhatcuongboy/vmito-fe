import { Geist, Geist_Mono } from 'next/font/google';
import { IntlClientProvider } from '../../components/IntlClientProvider';
import LocaleValidator from '../../components/LocaleValidator';
import { PWAStatus } from '../../components/PWAComponents';
import '../globals.css';
import { Providers } from '../providers';
import GlobalBottomNav from '../../components/layout/GlobalBottomNav';
import { Locale, SUPPORTED_LOCALES } from '@/i18n/locales';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#ffffff',
};

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Load messages directly
  let messages = {};
  try {
    if (SUPPORTED_LOCALES.includes(locale as Locale)) {
      messages = (await import(`../../i18n/messages/${locale}.json`)).default;
    } else {
      // Fallback to English
      messages = (await import(`../../i18n/messages/${Locale.EN}.json`))
        .default;
    }
  } catch (error) {
    console.error('Error loading messages:', error);
    // Fallback to English
    try {
      messages = (await import(`../../i18n/messages/${Locale.EN}.json`))
        .default;
    } catch (fallbackError) {
      console.error('Error loading fallback messages:', fallbackError);
      messages = {};
    }
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LocaleValidator locale={locale} validLocales={SUPPORTED_LOCALES} />
        <IntlClientProvider messages={messages} locale={locale}>
          <Providers>
            <PWAStatus />
            {children}
            {/* <Footer /> */}
            <GlobalBottomNav />
            {/* <PWAInstallPrompt /> */}
          </Providers>
        </IntlClientProvider>
      </body>
    </html>
  );
}
