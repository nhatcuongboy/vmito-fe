import assert from 'node:assert/strict';
import test from 'node:test';

import { mergeScoreboardMatchList } from './resultsRealtime.ts';

test('merges only the match from a score event', () => {
  const participants = [{ id: 'participant-1', position: 1 }];
  const liveMatch = {
    id: 'match-1',
    status: 'IN_PROGRESS',
    participants,
    player1Score: 8,
    player2Score: 3,
    courtId: 'court-1',
    court: { id: 'court-1', courtNumber: 1, tournamentId: 'tournament-1' },
  };
  const unchangedMatch = { id: 'match-2', status: 'SCHEDULED' };
  const current = [liveMatch, unchangedMatch];

  const next = mergeScoreboardMatchList(current, {
    matchId: 'match-1',
    status: 'IN_PROGRESS',
    score: '9-3',
    sets: [{ setNumber: 1, player1Score: 9, player2Score: 3 }],
    currentSet: { setNumber: 1, side1: 9, side2: 3 },
    winnerId: null,
    isDraw: false,
    servingSide: 1,
    serverNumber: null,
    refereeName: null,
    matchFormat: null,
    startTime: '2026-07-16T08:00:00.000Z',
    endTime: null,
    estimatedEndTime: null,
    court: { id: 'court-1', courtNumber: 1, courtName: 'Sân 1' },
    updatedAt: '2026-07-16T08:05:00.000Z',
  });

  assert.notStrictEqual(next, current);
  assert.notStrictEqual(next[0], liveMatch);
  assert.strictEqual(next[1], unchangedMatch);
  assert.strictEqual(next[0].participants, participants);
  assert.equal(next[0].player1Score, 9);
  assert.equal(next[0].player2Score, 3);
  assert.deepEqual(next[0].sets, [
    { setNumber: 1, player1Score: 9, player2Score: 3 },
  ]);
  assert.equal(next[0].court.courtName, 'Sân 1');
});

test('appends the current set to completed set history', () => {
  const next = mergeScoreboardMatchList(
    [{ id: 'match-1', status: 'IN_PROGRESS' }],
    {
      matchId: 'match-1',
      status: 'IN_PROGRESS',
      sets: [{ setNumber: 1, player1Score: 21, player2Score: 18 }],
      currentSet: { setNumber: 2, side1: 4, side2: 2 },
      winnerId: null,
      isDraw: false,
      startTime: null,
      endTime: null,
      estimatedEndTime: null,
      court: null,
      updatedAt: '2026-07-16T08:05:00.000Z',
    }
  );

  assert.deepEqual(next[0].sets, [
    { setNumber: 1, player1Score: 21, player2Score: 18 },
    { setNumber: 2, player1Score: 4, player2Score: 2 },
  ]);
  assert.equal(next[0].player1Score, 25);
  assert.equal(next[0].player2Score, 20);
});

test('keeps the list reference when the event match is unknown', () => {
  const matches = [{ id: 'match-1', status: 'SCHEDULED' }];
  const next = mergeScoreboardMatchList(matches, {
    matchId: 'unknown-match',
    sets: [],
  });

  assert.strictEqual(next, matches);
});
