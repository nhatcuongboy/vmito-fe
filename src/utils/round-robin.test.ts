/**
 * Tests for Round-Robin Algorithm
 * 
 * Run with: npm test round-robin.test.ts
 */

import {
  generateRoundRobinMatches,
  calculateTotalMatches,
  isValidRoundRobinTournament,
  generateRoundRobinRounds,
  calculateRoundsCount,
} from './round-robin';

describe('Round-Robin Algorithm', () => {
  describe('generateRoundRobinMatches', () => {
    it('should generate correct matches for 2 teams', () => {
      const registrations = ['reg1', 'reg2'];
      const result = generateRoundRobinMatches(registrations);

      expect(result.matches).toHaveLength(1);
      expect(result.matches[0]).toEqual({
        participant1Id: 'reg1',
        participant2Id: 'reg2',
        matchNumber: 1,
      });
      expect(result.totalMatches).toBe(1);
      expect(result.teamsCount).toBe(2);
    });

    it('should generate correct matches for 4 teams', () => {
      const registrations = ['reg1', 'reg2', 'reg3', 'reg4'];
      const result = generateRoundRobinMatches(registrations);

      expect(result.matches).toHaveLength(6);
      expect(result.totalMatches).toBe(6);
      expect(result.teamsCount).toBe(4);

      // Check all unique pairs
      const pairs = result.matches.map((m) => [
        m.participant1Id,
        m.participant2Id,
      ]);
      expect(pairs).toContainEqual(['reg1', 'reg2']);
      expect(pairs).toContainEqual(['reg1', 'reg3']);
      expect(pairs).toContainEqual(['reg1', 'reg4']);
      expect(pairs).toContainEqual(['reg2', 'reg3']);
      expect(pairs).toContainEqual(['reg2', 'reg4']);
      expect(pairs).toContainEqual(['reg3', 'reg4']);
    });

    it('should return empty array for less than 2 teams', () => {
      expect(generateRoundRobinMatches([]).matches).toHaveLength(0);
      expect(generateRoundRobinMatches(['reg1']).matches).toHaveLength(0);
    });

    it('should assign match numbers correctly', () => {
      const registrations = ['reg1', 'reg2', 'reg3'];
      const result = generateRoundRobinMatches(registrations);

      result.matches.forEach((match, index) => {
        expect(match.matchNumber).toBe(index + 1);
      });
    });
  });

  describe('calculateTotalMatches', () => {
    it('should calculate correctly for various team counts', () => {
      expect(calculateTotalMatches(2)).toBe(1);
      expect(calculateTotalMatches(3)).toBe(3);
      expect(calculateTotalMatches(4)).toBe(6);
      expect(calculateTotalMatches(5)).toBe(10);
      expect(calculateTotalMatches(8)).toBe(28);
      expect(calculateTotalMatches(10)).toBe(45);
    });

    it('should return 0 for invalid team counts', () => {
      expect(calculateTotalMatches(0)).toBe(0);
      expect(calculateTotalMatches(1)).toBe(0);
      expect(calculateTotalMatches(-1)).toBe(0);
    });
  });

  describe('isValidRoundRobinTournament', () => {
    it('should return true for valid team counts', () => {
      expect(isValidRoundRobinTournament(2)).toBe(true);
      expect(isValidRoundRobinTournament(4)).toBe(true);
      expect(isValidRoundRobinTournament(10)).toBe(true);
    });

    it('should return false for invalid team counts', () => {
      expect(isValidRoundRobinTournament(0)).toBe(false);
      expect(isValidRoundRobinTournament(1)).toBe(false);
      expect(isValidRoundRobinTournament(-1)).toBe(false);
    });
  });

  describe('generateRoundRobinRounds', () => {
    it('should generate rounds for 4 teams', () => {
      const registrations = ['reg1', 'reg2', 'reg3', 'reg4'];
      const rounds = generateRoundRobinRounds(registrations);

      // 4 teams = 3 rounds
      expect(rounds).toHaveLength(3);

      // Each round should have 2 matches (4 teams / 2)
      rounds.forEach((round) => {
        expect(round.length).toBe(2);
      });

      // All matches should be unique
      const allMatches = rounds.flat();
      const uniqueMatches = new Set(
        allMatches.map((m) => `${m.participant1Id}-${m.participant2Id}`)
      );
      expect(uniqueMatches.size).toBe(6); // 4 teams = 6 matches total
    });

    it('should generate rounds for 3 teams (odd number)', () => {
      const registrations = ['reg1', 'reg2', 'reg3'];
      const rounds = generateRoundRobinRounds(registrations);

      // 3 teams = 3 rounds
      expect(rounds).toHaveLength(3);
    });
  });

  describe('calculateRoundsCount', () => {
    it('should calculate correctly for even number of teams', () => {
      expect(calculateRoundsCount(2)).toBe(1);
      expect(calculateRoundsCount(4)).toBe(3);
      expect(calculateRoundsCount(6)).toBe(5);
      expect(calculateRoundsCount(8)).toBe(7);
    });

    it('should calculate correctly for odd number of teams', () => {
      expect(calculateRoundsCount(3)).toBe(3);
      expect(calculateRoundsCount(5)).toBe(5);
      expect(calculateRoundsCount(7)).toBe(7);
    });

    it('should return 0 for invalid team counts', () => {
      expect(calculateRoundsCount(0)).toBe(0);
      expect(calculateRoundsCount(1)).toBe(0);
    });
  });
});





