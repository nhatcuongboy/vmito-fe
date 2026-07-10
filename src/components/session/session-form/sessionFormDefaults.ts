import { CourtDirection, ISession } from '@/lib/api/types';
import { COURT_COLORS } from '@/components/session/CourtSettings';

import { formatDateTimeLocal } from './sessionFormUtils';
import { SessionFormData } from './sessionFormSchema';

export function buildSessionFormDefaults({
  isEditMode,
  initialData,
  userName,
}: {
  isEditMode: boolean;
  initialData?: ISession;
  userName?: string | null;
}): SessionFormData {
  if (isEditMode && initialData) {
    return {
      name: initialData.name,
      description: initialData.description || '',
      referenceVideoUrl: initialData.referenceVideoUrl || '',
      selectedVenueId: initialData.venue?.id || '',
      clubId: initialData.clubId || '',
      hostName: initialData.hostName || initialData.host?.name || '',
      hostPhone: initialData.hostPhone || '',
      startTime: initialData.startTime
        ? formatDateTimeLocal(new Date(initialData.startTime))
        : '',
      endTime: initialData.endTime
        ? formatDateTimeLocal(new Date(initialData.endTime))
        : '',
      courts:
        initialData.courts?.map((c) => ({
          courtId: c.id,
          courtNumber: c.courtNumber,
          courtName: c.courtName || '',
          direction: c.direction,
        })) || [],
      courtColor: initialData.courtColor || COURT_COLORS[0].value,
      maxPlayersPerCourt: initialData.maxPlayersPerCourt,
      requirePlayerInfo: initialData.requirePlayerInfo,
      allowGuestJoin: initialData.allowGuestJoin ?? true,
      allowNewPlayers: initialData.allowNewPlayers ?? true,
      allowZaloContact: initialData.allowZaloContact ?? false,
      allLevelsSelected:
        !initialData.requiredLevels || initialData.requiredLevels?.length === 0,
      requiredLevels: (initialData.requiredLevels || []).map(Number),
      shuttlecock: initialData.shuttlecock || '',
      defaultMatchType: initialData.defaultMatchType || 'DOUBLES',
    };
  }

  return {
    name: '',
    description: '',
    referenceVideoUrl: '',
    selectedVenueId: '',
    clubId: '',
    hostName: userName || '',
    hostPhone: '',
    startTime: '',
    endTime: '',
    courts: [
      {
        courtId: undefined,
        courtNumber: 1,
        courtName: '',
        direction: CourtDirection.HORIZONTAL,
      },
    ],
    courtColor: COURT_COLORS[0].value,
    maxPlayersPerCourt: 8,
    requirePlayerInfo: false,
    allowGuestJoin: true,
    allowNewPlayers: true,
    allowZaloContact: false,
    allLevelsSelected: true,
    requiredLevels: [],
    shuttlecock: '',
    defaultMatchType: 'DOUBLES' as const,
  };
}
