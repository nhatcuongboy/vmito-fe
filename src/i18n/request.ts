import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import { Locale, SUPPORTED_LOCALES } from './locales';

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locale || !SUPPORTED_LOCALES.includes(locale as Locale)) notFound();

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
    timeZone: 'Asia/Ho_Chi_Minh',
  };
});
