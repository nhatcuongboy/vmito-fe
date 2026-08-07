import { Metadata } from 'next';
import BrowseClassesContent from './BrowseClassesContent';

export const dynamic = 'force-dynamic';
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title =
    locale === 'vi'
      ? 'Tìm lớp học cầu lông, pickleball'
      : 'Find sports classes';
  const description =
    locale === 'vi'
      ? 'Tìm lớp cầu lông và pickleball phù hợp theo khu vực, trình độ, lịch học và học phí trên Vmito.'
      : 'Find recurring badminton and pickleball classes on Vmito.';
  return {
    title,
    description,
    alternates: { canonical: `https://vmito.com/${locale}/classes` },
    openGraph: { title, description },
  };
}
export default function ClassesPage() {
  return <BrowseClassesContent />;
}
