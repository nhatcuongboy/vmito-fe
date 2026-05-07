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

  const uniqueClubs = Array.from(
    myClubs
      .reduce((map, club) => {
        const existing = map.get(club.id);
        if (!existing || club.role === EMemberRole.ADMIN) {
          map.set(club.id, club);
        }
        return map;
      }, new Map<string, IMyClub>())
      .values()
  );

  const isManaging = (c: IMyClub) =>
    c.role === EMemberRole.ADMIN || c.host.id === currentUser?.id;

  const managedClubs = uniqueClubs.filter(isManaging);
  const memberClubs = uniqueClubs.filter((c) => !isManaging(c));
  const pendingOutgoing = joinRequests.filter(
    (r) => r.status === EJoinRequestStatus.PENDING
  );

  const loadIncomingRequests = useCallback(
    async (clubs: IMyClub[], hostUserId?: string) => {
      const adminClubIds = clubs
        .filter((c) => c.role === EMemberRole.ADMIN || c.host.id === hostUserId)
        .map((c) => c.id);
      if (adminClubIds.length === 0) {
        setIncomingRequests([]);
        return;
      }
      try {
        setIsLoadingIncoming(true);
        const results = await Promise.all(
          adminClubIds.map((id) => ClubsService.getJoinRequests(id))
        );
        const pending = results
          .flat()
          .filter((r) => r.status === EJoinRequestStatus.PENDING);
        setIncomingRequests(pending);
      } catch (error) {
        console.error('Failed to load incoming requests:', error);
      } finally {
        setIsLoadingIncoming(false);
      }
    },
    []
  );

  const loadData = useCallback(async () => {
    if (!currentUser) return;
    let loadedClubs: IMyClub[] = [];
    try {
      setIsLoading(true);
      const [clubs, requests] = await Promise.all([
        ClubsService.getMyClubs(),
        ClubsService.getMyJoinRequests(),
      ]);
      loadedClubs = clubs;
      setMyClubs(clubs);
      setJoinRequests(requests);
    } catch (error) {
      console.error('Failed to load my clubs data:', error);
    } finally {
      setIsLoading(false);
    }
    loadIncomingRequests(loadedClubs, currentUser?.id);
  }, [currentUser, loadIncomingRequests]);

  const fetchPendingClubs = useCallback(async () => {
    try {
      setIsLoadingPending(true);
      const clubs = await ClubsService.getPendingClubs();
      setPendingClubs(clubs);
    } catch (error) {
      console.error('Failed to fetch pending clubs:', error);
      toaster.create({ title: t('clubs.failedToFetchClubs'), type: 'error' });
    } finally {
      setIsLoadingPending(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (isAdmin) fetchPendingClubs();
  }, [isAdmin, fetchPendingClubs]);

  const handleApprove = async (clubId: string) => {
    try {
      setIsActionLoading(true);
      await ClubsService.approveClub(clubId);
      toaster.create({
        title: t('clubs.adminApproval.approveSuccess'),
        type: 'success',
      });
      await fetchPendingClubs();
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
      await loadIncomingRequests(myClubs, currentUser?.id);
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
        await fetchPendingClubs();
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
        await loadIncomingRequests(myClubs, currentUser?.id);
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
