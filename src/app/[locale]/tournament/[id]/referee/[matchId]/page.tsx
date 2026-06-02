import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import RefereeScoringPage from '@/components/tournament/referee/RefereeScoringPage';
import { UserRole } from '@/lib/api/types';

export default function Page() {
  return (
    <ProtectedRouteGuard
      requiredRole={[UserRole.REFEREE, UserRole.HOST, UserRole.ADMIN]}
    >
      <RefereeScoringPage />
    </ProtectedRouteGuard>
  );
}
