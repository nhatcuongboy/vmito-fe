import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect((process.env.NEXT_PUBLIC_DEFAULT_LOCALE as 'vi' | 'en') || 'en');
  return null;
}
