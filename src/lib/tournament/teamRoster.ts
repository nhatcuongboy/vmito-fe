import { CategoryRegistration } from '@/lib/api/types';

export interface PlayerTeamAssignment {
  registrationId: string;
  teamName: string;
}

export type PlayerTeamAssignmentMap = Map<string, PlayerTeamAssignment[]>;

const addAssignment = (
  assignments: PlayerTeamAssignmentMap,
  playerId: string,
  assignment: PlayerTeamAssignment
) => {
  const current = assignments.get(playerId);
  if (current) {
    if (
      !current.some(
        ({ registrationId }) => registrationId === assignment.registrationId
      )
    ) {
      current.push(assignment);
    }
    return;
  }

  assignments.set(playerId, [assignment]);
};

export const getRegistrationPlayerIds = (
  registration: CategoryRegistration
): string[] => {
  const playerIds = new Set<string>();

  for (const member of registration.pair?.members ?? []) {
    if (member.playerId) playerIds.add(member.playerId);
  }

  const legacyPlayerId =
    registration.player?.id ?? registration.tournamentPlayerId;
  if (legacyPlayerId) playerIds.add(legacyPlayerId);

  return [...playerIds];
};

export const buildPlayerTeamAssignments = (
  registrations: CategoryRegistration[],
  getTeamName: (registration: CategoryRegistration) => string
): PlayerTeamAssignmentMap => {
  const assignments: PlayerTeamAssignmentMap = new Map();

  for (const registration of registrations) {
    const assignment = {
      registrationId: registration.id,
      teamName: getTeamName(registration),
    };

    for (const playerId of getRegistrationPlayerIds(registration)) {
      addAssignment(assignments, playerId, assignment);
    }
  }

  return assignments;
};

export const getOtherTeamAssignments = (
  assignments: PlayerTeamAssignmentMap,
  playerId: string,
  currentRegistrationId?: string
): PlayerTeamAssignment[] =>
  (assignments.get(playerId) ?? []).filter(
    ({ registrationId }) => registrationId !== currentRegistrationId
  );
