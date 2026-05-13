import FeedbackClient from './FeedbackClient';
import { SUPPORTED_LOCALES } from '@/i18n/locales';

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default async function FeedbackPage() {
  return <FeedbackClient />;
}
