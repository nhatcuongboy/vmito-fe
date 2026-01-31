import { redirect } from 'next/navigation';
import { Locale } from '@/i18n/locales';

export default function RootPage() {
  redirect((process.env.NEXT_PUBLIC_DEFAULT_LOCALE as Locale) || Locale.VI);
  return null;
}
