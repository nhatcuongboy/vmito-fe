import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';

interface NewsfeedLayoutProps {
  children: React.ReactNode;
}

export default function NewsfeedLayout({ children }: NewsfeedLayoutProps) {
  return (
    <ProtectedRouteGuard requireAccessToken>{children}</ProtectedRouteGuard>
  );
}
