/**
 * Round-Robin Tournament Algorithm Utilities
 * 
 * Round-robin tournament: Each team plays against every other team exactly once.
 * For n teams, total matches = n * (n - 1) / 2
 */

export interface RoundRobinMatch {
  participant1Id: string;
  participant2Id: string;
  matchNumber?: number;
}

export interface RoundRobinResult {
  matches: RoundRobinMatch[];
  totalMatches: number;
  teamsCount: number;
}

/**
 * Generate all round-robin matches for a given set of registrations
 * 
 * @param registrations - Array of category registration IDs
 * @returns Array of matches where each match contains two participant IDs
 * 
 * @example
 * const registrations = ['reg1', 'reg2', 'reg3', 'reg4'];
 * const matches = generateRoundRobinMatches(registrations);
 * // Returns:
 * // [
 * //   { participant1Id: 'reg1', participant2Id: 'reg2' },
 * //   { participant1Id: 'reg1', participant2Id: 'reg3' },
 * //   { participant1Id: 'reg1', participant2Id: 'reg4' },
 * //   { participant1Id: 'reg2', participant2Id: 'reg3' },
 * //   { participant1Id: 'reg2', participant2Id: 'reg4' },
 * //   { participant1Id: 'reg3', participant2Id: 'reg4' }
 * // ]
 */
export function generateRoundRobinMatches(
  registrations: string[]
): RoundRobinResult {
  if (registrations.length < 2) {
    return {
      matches: [],
      totalMatches: 0,
      teamsCount: registrations.length,
    };
  }

  const matches: RoundRobinMatch[] = [];
  const n = registrations.length;

  // Generate matches: each team plays against every other team exactly once
  // For n teams, we generate n*(n-1)/2 matches
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      matches.push({
        participant1Id: registrations[i],
        participant2Id: registrations[j],
      });
    }
  }

  // Assign match numbers
  matches.forEach((match, index) => {
    match.matchNumber = index + 1;
  });

  return {
    matches,
    totalMatches: matches.length,
    teamsCount: n,
  };
}

/**
 * Calculate total number of matches for a round-robin tournament
 * 
 * @param teamsCount - Number of teams
 * @returns Total number of matches
 * 
 * @example
 * calculateTotalMatches(4) // Returns 6
 * calculateTotalMatches(8) // Returns 28
 */
export function calculateTotalMatches(teamsCount: number): number {
  if (teamsCount < 2) return 0;
  return (teamsCount * (teamsCount - 1)) / 2;
}

/**
 * Validate if round-robin tournament is possible with given number of teams
 * 
 * @param teamsCount - Number of teams
 * @returns true if tournament is possible (at least 2 teams)
 */
export function isValidRoundRobinTournament(teamsCount: number): boolean {
  return teamsCount >= 2;
}

/**
 * Generate round-robin matches with scheduling (rounds)
 * This divides matches into rounds where each team plays at most once per round
 * 
 * @param registrations - Array of category registration IDs
 * @returns Array of rounds, each containing matches for that round
 * 
 * @example
 * const registrations = ['reg1', 'reg2', 'reg3', 'reg4'];
 * const rounds = generateRoundRobinRounds(registrations);
 * // Returns:
 * // [
 * //   [{ participant1Id: 'reg1', participant2Id: 'reg4' }, { participant1Id: 'reg2', participant2Id: 'reg3' }],
 * //   [{ participant1Id: 'reg1', participant2Id: 'reg3' }, { participant1Id: 'reg4', participant2Id: 'reg2' }],
 * //   [{ participant1Id: 'reg1', participant2Id: 'reg2' }, { participant1Id: 'reg3', participant2Id: 'reg4' }]
 * // ]
 */
export function generateRoundRobinRounds(
  registrations: string[]
): RoundRobinMatch[][] {
  if (registrations.length < 2) {
    return [];
  }

  const n = registrations.length;
  const isEven = n % 2 === 0;
  const rounds: RoundRobinMatch[][] = [];

  // If odd number of teams, add a "bye" team (null)
  const teams = isEven ? [...registrations] : [...registrations, ''];
  const numRounds = teams.length - 1;
  const numMatchesPerRound = teams.length / 2;

  // Generate rounds using round-robin scheduling algorithm
  for (let round = 0; round < numRounds; round++) {
    const roundMatches: RoundRobinMatch[] = [];

    for (let match = 0; match < numMatchesPerRound; match++) {
      const team1Index = (round + match) % (teams.length - 1);
      const team2Index = (teams.length - 1 - match + round) % (teams.length - 1);

      const team1 = teams[team1Index];
      const team2 = teams[team2Index];

      // Skip if either team is the "bye" team
      if (team1 && team2) {
        roundMatches.push({
          participant1Id: team1,
          participant2Id: team2,
        });
      }
    }

    if (roundMatches.length > 0) {
      rounds.push(roundMatches);
    }
  }

  return rounds;
}

/**
 * Get the number of rounds needed for a round-robin tournament
 * 
 * @param teamsCount - Number of teams
 * @returns Number of rounds
 */
export function calculateRoundsCount(teamsCount: number): number {
  if (teamsCount < 2) return 0;
  return teamsCount % 2 === 0 ? teamsCount - 1 : teamsCount;
}





