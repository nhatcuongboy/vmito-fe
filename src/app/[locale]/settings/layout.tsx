import { privatePageMetadata } from '@/lib/seo/metadata';

export const metadata = privatePageMetadata;

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
