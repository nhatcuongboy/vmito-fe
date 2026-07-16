import assert from 'node:assert/strict';
import test from 'node:test';

const { arePlayersTiedForRanking, rankPlayerStatistics } = await import(
  './session-player-ranking.ts'
);

const player = (
  playerId,
  {
    winRate = 50,
    wins = 2,
    totalMatches = 4,
    averagePointDifferential = 0,
  } = {}
) => ({
  playerId,
  name: playerId,
  winRate,
  wins,
  totalMatches,
  averagePointDifferential,
});

test('ranks point differential before total matches in a tied group', () => {
  const result = rankPlayerStatistics([
    player('lower', { averagePointDifferential: -1, totalMatches: 8 }),
    player('higher', { averagePointDifferential: 2, totalMatches: 4 }),
  ]);

  assert.deepEqual(
    result.players.map(({ playerId }) => playerId),
    ['higher', 'lower']
  );
  assert.deepEqual([...result.pointDifferentialTiebreakPlayerIds].sort(), [
    'higher',
    'lower',
  ]);
});

test('skips point differential for the whole group when one player lacks data', () => {
  const result = rankPlayerStatistics([
    player('scored', { averagePointDifferential: 10, totalMatches: 4 }),
    player('unscored', {
      averagePointDifferential: null,
      totalMatches: 5,
    }),
  ]);

  assert.deepEqual(
    result.players.map(({ playerId }) => playerId),
    ['unscored', 'scored']
  );
  assert.equal(result.pointDifferentialTiebreakPlayerIds.size, 0);
});

test('applies the missing-score policy independently to each primary group', () => {
  const result = rankPlayerStatistics([
    player('a', { averagePointDifferential: 1 }),
    player('b', { averagePointDifferential: 3 }),
    player('c', { winRate: 40, wins: 1, averagePointDifferential: null }),
    player('d', {
      winRate: 40,
      wins: 1,
      averagePointDifferential: 20,
      totalMatches: 3,
    }),
  ]);

  assert.deepEqual(
    result.players.map(({ playerId }) => playerId),
    ['b', 'a', 'c', 'd']
  );
  assert.deepEqual([...result.pointDifferentialTiebreakPlayerIds].sort(), [
    'a',
    'b',
  ]);
});

test('keeps players tied when every applied ranking value is equal', () => {
  const first = player('a', { averagePointDifferential: 2.5 });
  const second = player('b', { averagePointDifferential: 2.5 });
  const result = rankPlayerStatistics([first, second]);

  assert.equal(arePlayersTiedForRanking(first, second, result), true);
  assert.equal(result.pointDifferentialTiebreakPlayerIds.size, 0);
});

test('does not share rank when point differential breaks the tie', () => {
  const first = player('a', { averagePointDifferential: 2.5 });
  const second = player('b', { averagePointDifferential: 1.5 });
  const result = rankPlayerStatistics([first, second]);

  assert.equal(arePlayersTiedForRanking(first, second, result), false);
});
