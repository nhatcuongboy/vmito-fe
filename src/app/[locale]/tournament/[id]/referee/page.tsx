import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import RefereeMatchListPage from '@/components/tournament/referee/RefereeMatchListPage';
import { UserRole } from '@/lib/api/types';

export default function Page() {
  return (
    <ProtectedRouteGuard
      requiredRole={[UserRole.REFEREE, UserRole.HOST, UserRole.ADMIN]}
    >
      <RefereeMatchListPage />
    </ProtectedRouteGuard>
  );
}
