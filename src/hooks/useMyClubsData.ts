import { useCallback, useEffect, useState } from 'react';
import { ClubsService } from '@/lib/api/clubs.service';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  EMemberRole,
  EJoinRequestStatus,
  IClubJoinRequest,
  IMyClub,
  IClub,
} from '@/types/club';
import { UserRole } from '@/lib/api/types';
import { toaster } from '@/components/ui/toaster';
import { useTranslations } from 'next-intl';
import { useCanAccessHostFeatures } from './useCanAccessHostFeatures';

const getClubHost = (club: IClub) =>
  club.host ?? {
    id: club.hostId,
    name: club.hostName || '',
  };

const mapClubToManagedClub = (club: IClub): IMyClub => ({
  id: club.id,
  slug: club.slug,
  name: club.name,
  description: club.description,
  color: club.color,
  image: club.image,
  status: club.status,
  role: EMemberRole.ADMIN,
  memberCount: club.memberCount,
  host: getClubHost(club),
  joinedAt: club.createdAt,
  schedules: club.schedules,
  defaultVenue: club.defaultVenue,
});

export interface UseMyClubsDataReturn {
  myClubs: IMyClub[];
  joinRequests: IClubJoinRequest[];
  incomingRequests: IClubJoinRequest[];
  pendingClubs: IClub[];
  isLoading: boolean;
  isLoadingIncoming: boolean;
  isLoadingPending: boolean;
  isActionLoading: boolean;
  uniqueClubs: IMyClub[];
  managedClubs: IMyClub[];
  memberClubs: IMyClub[];
  pendingOutgoing: IClubJoinRequest[];
  canAccessHostFeatures: boolean;
  isAdmin: boolean;
  handleApprove: (clubId: string) => Promise<void>;
  handleApproveJoinRequest: (
    clubId: string,
    requestId: string
  ) => Promise<void>;
  handleReject: (
    rejectTarget: {
      type: 'club' | 'member';
      clubId: string;
      requestId?: string;
    },
    rejectionReason: string
  ) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useMyClubsData(): UseMyClubsDataReturn {
  const t = useTranslations();
  const { user: currentUser } = useAuthStore();
  const { canAccessHostFeatures } = useCanAccessHostFeatures();
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  // ── Shared state ───────────────────────────────────────────────────────────
  const [myClubs, setMyClubs] = useState<IMyClub[]>([]);
  const [joinRequests, setJoinRequests] = useState<IClubJoinRequest[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<IClubJoinRequest[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingIncoming, setIsLoadingIncoming] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [pendingClubs, setPendingClubs] = useState<IClub[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(false);
  const [adminManagedClubs, setAdminManagedClubs] = useState<IMyClub[]>([]);

  // ── Derived state ──────────────────────────────────────────────────────────
  const uniqueClubs = Array.from(
    myClubs
      .reduce((map, club) => {
        const existing = map.get(club.id);
        if (!existing || club.role === EMemberRole.ADMIN)
          map.set(club.id, club);
        return map;
      }, new Map<string, IMyClub>())
      .values()
  );

  const isManaging = (c: IMyClub) =>
    c.role === EMemberRole.ADMIN || c.host?.id === currentUser?.id;

  const managedClubs = isAdmin
    ? Array.from(
        [...adminManagedClubs, ...pendingClubs.map(mapClubToManagedClub)]
          .reduce(
            (map, club) => map.set(club.id, club),
            new Map<string, IMyClub>()
          )
          .values()
      )
    : uniqueClubs.filter(isManaging);

  const memberClubs = uniqueClubs.filter((c) => !isManaging(c));
  const pendingOutgoing = joinRequests.filter(
    (r) => r.status === EJoinRequestStatus.PENDING
  );

  // ── Admin: single call for all pending join requests ───────────────────────
  const refetchAdminJoinRequests = useCallback(async () => {
    try {
      setIsLoadingIncoming(true);
      const requests = await ClubsService.getAdminJoinRequests();
      setIncomingRequests(
        requests.filter((r) => r.status === EJoinRequestStatus.PENDING)
      );
    } catch (error) {
      console.error('Failed to load admin join requests:', error);
    } finally {
      setIsLoadingIncoming(false);
    }
  }, []);

  // ── Host: N calls, one per managed club (acceptable for small club counts) ─
  const loadIncomingRequestsForHost = useCallback(
    async (clubs: IMyClub[], hostUserId?: string) => {
      const hostClubIds = clubs
        .filter(
          (c) => c.role === EMemberRole.ADMIN || c.host?.id === hostUserId
        )
        .map((c) => c.id);

      if (hostClubIds.length === 0) {
        setIncomingRequests([]);
        return;
      }
      try {
        setIsLoadingIncoming(true);
        const results = await Promise.all(
          hostClubIds.map((id) => ClubsService.getJoinRequests(id))
        );
        setIncomingRequests(
          results.flat().filter((r) => r.status === EJoinRequestStatus.PENDING)
        );
      } catch (error) {
        console.error('Failed to load incoming requests:', error);
      } finally {
        setIsLoadingIncoming(false);
      }
    },
    []
  );

  // ── Main data loader ───────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!currentUser) return;
    try {
      setIsLoading(true);

      if (isAdmin) {
        // Admin: 3 parallel calls, no getMyClubs/getMyJoinRequests needed
        const [adminClubs, pendingJoinRequests, pendingClubsList] =
          await Promise.all([
            ClubsService.getClubsToManage(),
            ClubsService.getAdminJoinRequests(),
            ClubsService.getPendingClubs(),
          ]);
        setAdminManagedClubs(adminClubs.map(mapClubToManagedClub));
        setIncomingRequests(
          pendingJoinRequests.filter(
            (r) => r.status === EJoinRequestStatus.PENDING
          )
        );
        setPendingClubs(pendingClubsList);
      } else {
        // Host: fetch own clubs + join requests
        const [clubs, requests] = await Promise.all([
          ClubsService.getMyClubs(),
          ClubsService.getMyJoinRequests(),
        ]);
        setMyClubs(clubs);
        setJoinRequests(requests);
        // Load incoming requests after clubs are known
        loadIncomingRequestsForHost(clubs, currentUser.id);
      }
    } catch (error) {
      console.error('Failed to load my clubs data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, isAdmin, loadIncomingRequestsForHost]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleApprove = async (clubId: string) => {
    try {
      setIsActionLoading(true);
      await ClubsService.approveClub(clubId);
      toaster.create({
        title: t('clubs.adminApproval.approveSuccess'),
        type: 'success',
      });
      await loadData();
    } catch (error) {
      console.error('Failed to approve club:', error);
      toaster.create({ title: t('common.error'), type: 'error' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleApproveJoinRequest = async (
    clubId: string,
    requestId: string
  ) => {
    try {
      setIsActionLoading(true);
      await ClubsService.approveJoinRequest(clubId, requestId);
      toaster.create({
        title: t('clubs.requestApprovedSuccessfully'),
        type: 'success',
      });
      if (isAdmin) {
        await refetchAdminJoinRequests();
      } else {
        await loadIncomingRequestsForHost(managedClubs, currentUser?.id);
      }
    } catch (error) {
      console.error('Failed to approve join request:', error);
      toaster.create({ title: t('common.error'), type: 'error' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReject = async (
    rejectTarget: {
      type: 'club' | 'member';
      clubId: string;
      requestId?: string;
    },
    rejectionReason: string
  ) => {
    if (!rejectTarget || !rejectionReason.trim()) return;
    try {
      setIsActionLoading(true);
      if (rejectTarget.type === 'club') {
        await ClubsService.rejectClub(rejectTarget.clubId, rejectionReason);
        toaster.create({
          title: t('clubs.adminApproval.rejectSuccess'),
          type: 'success',
        });
        await loadData();
      } else {
        await ClubsService.rejectJoinRequest(
          rejectTarget.clubId,
          rejectTarget.requestId!,
          rejectionReason
        );
        toaster.create({
          title: t('clubs.requestRejectedSuccessfully'),
          type: 'success',
        });
        if (isAdmin) {
          await refetchAdminJoinRequests();
        } else {
          await loadIncomingRequestsForHost(managedClubs, currentUser?.id);
        }
      }
    } catch (error) {
      console.error('Failed to reject:', error);
      toaster.create({ title: t('common.error'), type: 'error' });
    } finally {
      setIsActionLoading(false);
    }
  };

  return {
    myClubs,
    joinRequests,
    incomingRequests,
    pendingClubs,
    isLoading,
    isLoadingIncoming,
    isLoadingPending,
    isActionLoading,
    uniqueClubs,
    managedClubs,
    memberClubs,
    pendingOutgoing,
    canAccessHostFeatures,
    isAdmin,
    handleApprove,
    handleApproveJoinRequest,
    handleReject,
    refetch: loadData,
  };
}
