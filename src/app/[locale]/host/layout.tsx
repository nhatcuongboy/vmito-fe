import { privatePageMetadata } from '@/lib/seo/metadata';

export const metadata = privatePageMetadata;

export default function HostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
