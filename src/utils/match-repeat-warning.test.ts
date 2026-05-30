import { CourtDirection, Match, Player } from '@/lib/api/types';
import { getMatchRepeatWarning } from './match-repeat-warning';

const player = (id: string, courtPosition: number): Player =>
  ({
    id,
    playerNumber: Number(id.replace(/\D/g, '')) || courtPosition + 1,
    name: `Player ${id}`,
    courtPosition,
  }) as Player;

const match = (
  id: string,
  playerIds: string[],
  positions: number[] = [0, 1, 2, 3],
  direction = CourtDirection.HORIZONTAL
): Match =>
  ({
    id,
    status: 'FINISHED',
    court: { direction },
    players: playerIds.map((playerId, index) => ({
      id: `${id}-${playerId}`,
      matchId: id,
      playerId,
      position: positions[index],
      player: player(playerId, positions[index]),
    })),
  }) as Match;

describe('getMatchRepeatWarning', () => {
  it('does not warn when the current player list is incomplete', () => {
    const warning = getMatchRepeatWarning(
      [match('m1', ['p1', 'p2', 'p3', 'p4'])],
      [player('p1', 0), player('p2', 1), player('p3', 2)],
      CourtDirection.HORIZONTAL,
      'doubles'
    );

    expect(warning.hasWarning).toBe(false);
  });

  it('warns when a doubles pair teams up for the second total match', () => {
    const warning = getMatchRepeatWarning(
      [match('m1', ['p1', 'p2', 'p3', 'p4'])],
      [player('p2', 0), player('p1', 1), player('p5', 2), player('p6', 3)],
      CourtDirection.HORIZONTAL,
      'doubles'
    );

    expect(warning.hasWarning).toBe(true);
    expect(warning.repeatedTeammates).toHaveLength(1);
    expect(warning.repeatedTeammates[0].totalCount).toBe(2);
  });

  it('warns when two players face each other for the second total match', () => {
    const warning = getMatchRepeatWarning(
      [match('m1', ['p1', 'p2', 'p3', 'p4'])],
      [player('p1', 0), player('p5', 1), player('p3', 2), player('p6', 3)],
      CourtDirection.HORIZONTAL,
      'doubles'
    );

    expect(warning.hasWarning).toBe(true);
    expect(warning.repeatedOpponents).toHaveLength(1);
    expect(warning.repeatedOpponents[0].totalCount).toBe(2);
  });

  it('normalizes relation keys regardless of player order', () => {
    const warning = getMatchRepeatWarning(
      [match('m1', ['p2', 'p1', 'p3', 'p4'])],
      [player('p1', 0), player('p2', 1), player('p5', 2), player('p6', 3)],
      CourtDirection.HORIZONTAL,
      'doubles'
    );

    expect(warning.repeatedTeammates[0].key).toBe('p1:p2');
  });

  it('uses vertical court mapping for doubles pairs', () => {
    const warning = getMatchRepeatWarning(
      [
        match(
          'm1',
          ['p1', 'p3', 'p2', 'p4'],
          [0, 1, 2, 3],
          CourtDirection.VERTICAL
        ),
      ],
      [player('p1', 0), player('p5', 1), player('p2', 2), player('p6', 3)],
      CourtDirection.VERTICAL,
      'doubles'
    );

    expect(warning.hasWarning).toBe(true);
    expect(warning.repeatedTeammates[0].key).toBe('p1:p2');
  });
});
