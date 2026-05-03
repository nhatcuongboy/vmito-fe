import { Metadata } from 'next';
import NewsfeedContent from './NewsfeedContent';

export const metadata: Metadata = {
  title: 'Newsfeed',
  description: 'Stay updated with the latest posts from the community',
};

export default function NewsfeedPage() {
  return <NewsfeedContent />;
}
