import { Metadata } from 'next';
import PostDetailContent from './PostDetailContent';

export const metadata: Metadata = {
  title: 'Post',
  description: 'View post details',
};

export default function PostDetailPage() {
  return <PostDetailContent />;
}
