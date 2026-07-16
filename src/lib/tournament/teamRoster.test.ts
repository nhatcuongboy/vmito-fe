import { CategoryRegistration } from '@/lib/api/types';
import {
  buildPlayerTeamAssignments,
  getOtherTeamAssignments,
  getRegistrationPlayerIds,
} from './teamRoster';

const registration = (
  id: string,
  name: string,
  playerIds: string[]
): CategoryRegistration =>
  ({
    id,
    categoryId: 'category-1',
    pair: {
      id: `pair-${id}`,
      tournamentId: 'tournament-1',
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
      members: playerIds.map((playerId, position) => ({
        id: `${id}-${playerId}`,
        pairId: `pair-${id}`,
        playerId,
        position,
      })),
    },
    createdAt: new Date(),
  }) as CategoryRegistration;

describe('teamRoster', () => {
  it('indexes pair members by registration', () => {
    const assignments = buildPlayerTeamAssignments(
      [registration('team-1', 'Team 1', ['player-1', 'player-2'])],
      (item) => item.pair?.name ?? ''
    );

    expect(assignments.get('player-1')).toEqual([
      { registrationId: 'team-1', teamName: 'Team 1' },
    ]);
  });

  it('indexes legacy direct-player registrations', () => {
    const legacy = {
      id: 'legacy-team',
      categoryId: 'category-1',
      tournamentPlayerId: 'player-1',
      player: { id: 'player-1', name: 'Player 1' },
      createdAt: new Date(),
    } as CategoryRegistration;

    expect(getRegistrationPlayerIds(legacy)).toEqual(['player-1']);
  });

  it('detects assignments in another team and ignores the current team', () => {
    const assignments = buildPlayerTeamAssignments(
      [
        registration('team-1', 'Team 1', ['player-1']),
        registration('team-2', 'Team 2', ['player-1']),
      ],
      (item) => item.pair?.name ?? ''
    );

    expect(getOtherTeamAssignments(assignments, 'player-1', 'team-1')).toEqual([
      { registrationId: 'team-2', teamName: 'Team 2' },
    ]);
  });
});
