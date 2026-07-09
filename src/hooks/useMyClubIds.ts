import { useEffect, useState } from 'react';
import { ClubsService } from '@/lib/api/clubs.service';
import { useAuthStore } from '@/stores/useAuthStore';

let cachedUserId: string | null = null;
let cachedClubIds: Set<string> | null = null;
let pendingClubIdsRequest: Promise<Set<string>> | null = null;

async function loadMyClubIds(userId: string): Promise<Set<string>> {
  if (cachedUserId === userId && cachedClubIds) {
    return cachedClubIds;
  }

  if (!pendingClubIdsRequest) {
    pendingClubIdsRequest = ClubsService.getMyClubs()
      .then((clubs) => {
        const clubIds = new Set(clubs.map((club) => club.id));
        cachedUserId = userId;
        cachedClubIds = clubIds;
        return clubIds;
      })
      .finally(() => {
        pendingClubIdsRequest = null;
      });
  }

  return pendingClubIdsRequest;
}

export function useMyClubIds() {
  const { user } = useAuthStore();
  const [clubIds, setClubIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setClubIds(new Set());
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    loadMyClubIds(user.id)
      .then((ids) => {
        if (!cancelled) setClubIds(ids);
      })
      .catch(() => {
        if (!cancelled) setClubIds(new Set());
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return { clubIds, isLoading, userId: user?.id };
}
