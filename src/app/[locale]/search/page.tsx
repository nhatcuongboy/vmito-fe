import { Metadata } from 'next';
import SearchPageClient from './SearchPageClient';

export const metadata: Metadata = {
  title: 'Tìm kiếm',
  description: 'Tìm kiếm kèo cầu lông, giải đấu, sân và câu lạc bộ',
};

export default function SearchPage() {
  return <SearchPageClient />;
}
