import { IntlClientProvider } from '../../components/IntlClientProvider';
import LocaleValidator from '../../components/LocaleValidator';
import { PWAStatus } from '../../components/PWAComponents';
import '../globals.css';
import { Providers } from '../providers';
import GlobalBottomNav from '../../components/layout/GlobalBottomNav';
import GlobalAiButton from '../../components/layout/GlobalAiButton';
import ThemeColorSync from '../../components/layout/ThemeColorSync';
import AppNavigationSplash from '../../components/ui/AppNavigationSplash';
import AppStartupSplash from '../../components/ui/AppStartupSplash';
import { Locale, SUPPORTED_LOCALES } from '@/i18n/locales';
import StructuredData from '../../components/seo/StructuredData';
import {
  generateWebsiteSchema,
  generateOrganizationSchema,
} from '../../lib/seo/structuredData';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1a202c' },
  ],
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

  // Generate structured data for SEO
  const websiteSchema = generateWebsiteSchema(locale);
  const organizationSchema = generateOrganizationSchema();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          as="image"
          href="/icons/app-logo-96.png"
          fetchPriority="high"
        />
        <StructuredData data={[websiteSchema, organizationSchema]} />
      </head>
      <body className="antialiased">
        <LocaleValidator locale={locale} validLocales={SUPPORTED_LOCALES} />
        <IntlClientProvider messages={messages} locale={locale}>
          <Providers>
            <ThemeColorSync />
            <PWAStatus />
            <AppStartupSplash />
            <AppNavigationSplash />
            {children}
            {/* <Footer /> */}
            <GlobalBottomNav />
            <GlobalAiButton />
            {/* <PWAInstallPrompt /> */}
          </Providers>
        </IntlClientProvider>
      </body>
    </html>
  );
}
