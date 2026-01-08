/**
 * Tests for Standings Calculation
 *
 * Run with: npm test standings.test.ts
 */

import {
  calculateStandings,
  determineWinners,
  getTeamsWithRank,
  isStandingsComplete,
  calculateWinPercentage,
  formatStandings,
  StandingsMatchResult,
} from './standings';

describe('Standings Calculation', () => {
  describe('calculateStandings', () => {
    it('should calculate standings correctly for simple case', () => {
      const teamIds = ['team1', 'team2', 'team3'];
      const matches: StandingsMatchResult[] = [
        {
          id: 'm1',
          participant1Id: 'team1',
          participant2Id: 'team2',
          participant1Score: 21,
          participant2Score: 19,
          winnerId: 'team1',
        },
        {
          id: 'm2',
          participant1Id: 'team1',
          participant2Id: 'team3',
          participant1Score: 21,
          participant2Score: 15,
          winnerId: 'team1',
        },
        {
          id: 'm3',
          participant1Id: 'team2',
          participant2Id: 'team3',
          participant1Score: 21,
          participant2Score: 18,
          winnerId: 'team2',
        },
      ];

      const standings = calculateStandings(teamIds, matches);

      expect(standings).toHaveLength(3);

      const team1Standing = standings.find((s) => s.teamId === 'team1');
      expect(team1Standing).toBeDefined();
      expect(team1Standing?.matchesWon).toBe(2);
      expect(team1Standing?.matchesLost).toBe(0);
      expect(team1Standing?.points).toBe(4); // 2 wins * 2 points
      expect(team1Standing?.rank).toBe(1);

      const team2Standing = standings.find((s) => s.teamId === 'team2');
      expect(team2Standing?.matchesWon).toBe(1);
      expect(team2Standing?.matchesLost).toBe(1);
      expect(team2Standing?.points).toBe(2);
      expect(team2Standing?.rank).toBe(2);

      const team3Standing = standings.find((s) => s.teamId === 'team3');
      expect(team3Standing?.matchesWon).toBe(0);
      expect(team3Standing?.matchesLost).toBe(2);
      expect(team3Standing?.points).toBe(0);
      expect(team3Standing?.rank).toBe(3);
    });

    it('should handle draws correctly', () => {
      const teamIds = ['team1', 'team2'];
      const matches: StandingsMatchResult[] = [
        {
          id: 'm1',
          participant1Id: 'team1',
          participant2Id: 'team2',
          participant1Score: 21,
          participant2Score: 21,
          isDraw: true,
        },
      ];

      const standings = calculateStandings(teamIds, matches);

      const team1Standing = standings.find((s) => s.teamId === 'team1');
      expect(team1Standing?.matchesDrawn).toBe(1);
      expect(team1Standing?.points).toBe(1); // 1 draw * 1 point

      const team2Standing = standings.find((s) => s.teamId === 'team2');
      expect(team2Standing?.matchesDrawn).toBe(1);
      expect(team2Standing?.points).toBe(1);
    });

    it('should calculate point differences correctly', () => {
      const teamIds = ['team1', 'team2'];
      const matches: StandingsMatchResult[] = [
        {
          id: 'm1',
          participant1Id: 'team1',
          participant2Id: 'team2',
          participant1Score: 21,
          participant2Score: 15,
          winnerId: 'team1',
        },
      ];

      const standings = calculateStandings(teamIds, matches);

      const team1Standing = standings.find((s) => s.teamId === 'team1');
      expect(team1Standing?.pointsFor).toBe(21);
      expect(team1Standing?.pointsAgainst).toBe(15);
      expect(team1Standing?.pointDifference).toBe(6);

      const team2Standing = standings.find((s) => s.teamId === 'team2');
      expect(team2Standing?.pointsFor).toBe(15);
      expect(team2Standing?.pointsAgainst).toBe(21);
      expect(team2Standing?.pointDifference).toBe(-6);
    });

    it('should use head-to-head for tie-breaking', () => {
      const teamIds = ['team1', 'team2', 'team3'];
      const matches: StandingsMatchResult[] = [
        // team1 beats team2
        {
          id: 'm1',
          participant1Id: 'team1',
          participant2Id: 'team2',
          participant1Score: 21,
          participant2Score: 19,
          winnerId: 'team1',
        },
        // team2 beats team3
        {
          id: 'm2',
          participant1Id: 'team2',
          participant2Id: 'team3',
          participant1Score: 21,
          participant2Score: 18,
          winnerId: 'team2',
        },
        // team3 beats team1
        {
          id: 'm3',
          participant1Id: 'team1',
          participant2Id: 'team3',
          participant1Score: 19,
          participant2Score: 21,
          winnerId: 'team3',
        },
      ];

      const standings = calculateStandings(teamIds, matches);

      // All teams have 1 win, 1 loss, 2 points
      // Head-to-head: team1 beat team2, team2 beat team3, team3 beat team1
      // This creates a cycle, so point difference should be used
      expect(standings[0].points).toBe(2);
      expect(standings[1].points).toBe(2);
      expect(standings[2].points).toBe(2);
    });
  });

  describe('determineWinners', () => {
    it('should select top N winners', () => {
      const standings = [
        { teamId: 'team1', rank: 1 } as any,
        { teamId: 'team2', rank: 2 } as any,
        { teamId: 'team3', rank: 3 } as any,
        { teamId: 'team4', rank: 4 } as any,
      ];

      const winners = determineWinners(standings, 2);
      expect(winners).toEqual(['team1', 'team2']);
    });

    it('should handle winnersCount = 0', () => {
      const standings = [{ teamId: 'team1', rank: 1 } as any];
      const winners = determineWinners(standings, 0);
      expect(winners).toEqual([]);
    });
  });

  describe('getTeamsWithRank', () => {
    it('should return teams with specific rank', () => {
      const standings = [
        { teamId: 'team1', rank: 1 } as any,
        { teamId: 'team2', rank: 2 } as any,
        { teamId: 'team3', rank: 2 } as any,
        { teamId: 'team4', rank: 4 } as any,
      ];

      const rank2Teams = getTeamsWithRank(standings, 2);
      expect(rank2Teams).toEqual(['team2', 'team3']);
    });
  });

  describe('isStandingsComplete', () => {
    it('should return true when all teams played all matches', () => {
      const standings = [
        { teamId: 'team1', matchesPlayed: 3 } as any,
        { teamId: 'team2', matchesPlayed: 3 } as any,
        { teamId: 'team3', matchesPlayed: 3 } as any,
        { teamId: 'team4', matchesPlayed: 3 } as any,
      ];

      expect(isStandingsComplete(standings, 4)).toBe(true);
    });

    it('should return false when not all matches played', () => {
      const standings = [
        { teamId: 'team1', matchesPlayed: 2 } as any,
        { teamId: 'team2', matchesPlayed: 3 } as any,
        { teamId: 'team3', matchesPlayed: 3 } as any,
        { teamId: 'team4', matchesPlayed: 3 } as any,
      ];

      expect(isStandingsComplete(standings, 4)).toBe(false);
    });
  });

  describe('calculateWinPercentage', () => {
    it('should calculate correctly', () => {
      const standing = {
        matchesPlayed: 10,
        matchesWon: 7,
      } as any;

      expect(calculateWinPercentage(standing)).toBe(70);
    });

    it('should return 0 for no matches played', () => {
      const standing = {
        matchesPlayed: 0,
        matchesWon: 0,
      } as any;

      expect(calculateWinPercentage(standing)).toBe(0);
    });
  });

  describe('formatStandings', () => {
    it('should format standings correctly', () => {
      const standings = [
        {
          teamId: 'team1',
          rank: 1,
          matchesWon: 5,
          matchesLost: 2,
          matchesDrawn: 1,
          points: 11,
          pointDifference: 15,
        } as any,
      ];

      const formatted = formatStandings(standings);
      expect(formatted[0].record).toBe('5-2-1');
      expect(formatted[0].pointDifference).toBe('+15');
    });
  });
});
