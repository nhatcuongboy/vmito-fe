/**
 * Standings Calculation Utilities
 * 
 * Calculate tournament group standings based on match results.
 * Supports multiple tie-breaking criteria: wins, head-to-head, point difference.
 */

export interface StandingsMatchResult {
  id: string;
  participant1Id: string;
  participant2Id: string;
  participant1Score: number;
  participant2Score: number;
  winnerId?: string;
  isDraw?: boolean;
}

export interface TeamStanding {
  teamId: string;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  matchesDrawn: number;
  points: number; // Win = 2, Draw = 1, Loss = 0
  pointsFor: number; // Total points scored
  pointsAgainst: number; // Total points conceded
  pointDifference: number; // pointsFor - pointsAgainst
  winsAgainst: Set<string>; // Teams this team has beaten (for head-to-head)
  rank: number;
}

export interface StandingsCalculationOptions {
  pointsForWin?: number; // Default: 2
  pointsForDraw?: number; // Default: 1
  pointsForLoss?: number; // Default: 0
  useHeadToHead?: boolean; // Use head-to-head for tie-breaking (default: true)
  usePointDifference?: boolean; // Use point difference for tie-breaking (default: true)
}

/**
 * Calculate standings from match results
 * 
 * @param teamIds - Array of team/registration IDs in the group
 * @param matches - Array of finished match results
 * @param options - Calculation options
 * @returns Array of standings sorted by rank
 * 
 * @example
 * const teamIds = ['team1', 'team2', 'team3', 'team4'];
 * const matches = [
 *   { id: 'm1', participant1Id: 'team1', participant2Id: 'team2', participant1Score: 21, participant2Score: 19, winnerId: 'team1' },
 *   { id: 'm2', participant1Id: 'team1', participant2Id: 'team3', participant1Score: 21, participant2Score: 15, winnerId: 'team1' },
 *   // ... more matches
 * ];
 * const standings = calculateStandings(teamIds, matches);
 */
export function calculateStandings(
  teamIds: string[],
  matches: StandingsMatchResult[],
  options: StandingsCalculationOptions = {}
): TeamStanding[] {
  const {
    pointsForWin = 2,
    pointsForDraw = 1,
    pointsForLoss = 0,
    useHeadToHead = true,
    usePointDifference = true,
  } = options;

  // Initialize standings for all teams
  const standingsMap = new Map<string, TeamStanding>();

  teamIds.forEach((teamId) => {
    standingsMap.set(teamId, {
      teamId,
      matchesPlayed: 0,
      matchesWon: 0,
      matchesLost: 0,
      matchesDrawn: 0,
      points: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pointDifference: 0,
      winsAgainst: new Set(),
      rank: 0,
    });
  });

  // Process each match
  for (const match of matches) {
    const standing1 = standingsMap.get(match.participant1Id);
    const standing2 = standingsMap.get(match.participant2Id);

    if (!standing1 || !standing2) continue;

    // Update matches played
    standing1.matchesPlayed++;
    standing2.matchesPlayed++;

    // Update points for and against
    standing1.pointsFor += match.participant1Score;
    standing1.pointsAgainst += match.participant2Score;
    standing2.pointsFor += match.participant2Score;
    standing2.pointsAgainst += match.participant1Score;

    // Determine result
    if (match.isDraw) {
      standing1.matchesDrawn++;
      standing2.matchesDrawn++;
      standing1.points += pointsForDraw;
      standing2.points += pointsForDraw;
    } else if (match.winnerId === match.participant1Id) {
      standing1.matchesWon++;
      standing2.matchesLost++;
      standing1.points += pointsForWin;
      standing2.points += pointsForLoss;
      standing1.winsAgainst.add(match.participant2Id);
    } else if (match.winnerId === match.participant2Id) {
      standing1.matchesLost++;
      standing2.matchesWon++;
      standing1.points += pointsForLoss;
      standing2.points += pointsForWin;
      standing2.winsAgainst.add(match.participant1Id);
    }
  }

  // Calculate point differences
  standingsMap.forEach((standing) => {
    standing.pointDifference = standing.pointsFor - standing.pointsAgainst;
  });

  // Convert to array and sort
  const standings = Array.from(standingsMap.values());

  // Sort by multiple criteria
  standings.sort((a, b) => {
    // 1. Points (descending)
    if (b.points !== a.points) {
      return b.points - a.points;
    }

    // 2. Head-to-head (if enabled and teams have played each other)
    if (useHeadToHead) {
      const headToHead = compareHeadToHead(a, b, matches);
      if (headToHead !== 0) {
        return headToHead;
      }
    }

    // 3. Point difference (descending)
    if (usePointDifference && b.pointDifference !== a.pointDifference) {
      return b.pointDifference - a.pointDifference;
    }

    // 4. Points for (descending)
    if (b.pointsFor !== a.pointsFor) {
      return b.pointsFor - a.pointsFor;
    }

    // 5. Points against (ascending - fewer points conceded is better)
    return a.pointsAgainst - b.pointsAgainst;
  });

  // Assign ranks
  standings.forEach((standing, index) => {
    standing.rank = index + 1;
  });

  return standings;
}

/**
 * Compare two teams using head-to-head record
 * 
 * @param standing1 - First team's standing
 * @param standing2 - Second team's standing
 * @param matches - All matches
 * @returns -1 if team1 wins head-to-head, 1 if team2 wins, 0 if tie
 */
function compareHeadToHead(
  standing1: TeamStanding,
  standing2: TeamStanding,
  matches: StandingsMatchResult[]
): number {
  // Find matches between these two teams
  const headToHeadMatches = matches.filter(
    (m) =>
      (m.participant1Id === standing1.teamId &&
        m.participant2Id === standing2.teamId) ||
      (m.participant1Id === standing2.teamId &&
        m.participant2Id === standing1.teamId)
  );

  if (headToHeadMatches.length === 0) {
    return 0; // No head-to-head matches
  }

  let team1Wins = 0;
  let team2Wins = 0;

  for (const match of headToHeadMatches) {
    const isTeam1First =
      match.participant1Id === standing1.teamId &&
      match.participant2Id === standing2.teamId;

    if (match.isDraw) {
      // Draw - no winner
      continue;
    } else if (
      (isTeam1First && match.winnerId === standing1.teamId) ||
      (!isTeam1First && match.winnerId === standing1.teamId)
    ) {
      team1Wins++;
    } else {
      team2Wins++;
    }
  }

  if (team1Wins > team2Wins) return -1;
  if (team2Wins > team1Wins) return 1;
  return 0; // Tie in head-to-head
}

/**
 * Determine winners from standings
 * 
 * @param standings - Sorted standings array
 * @param winnersCount - Number of winners to select
 * @returns Array of team IDs that are winners
 */
export function determineWinners(
  standings: TeamStanding[],
  winnersCount: number
): string[] {
  if (winnersCount < 1) {
    return [];
  }

  return standings.slice(0, winnersCount).map((standing) => standing.teamId);
}

/**
 * Get teams with same rank (ties)
 * 
 * @param standings - Sorted standings array
 * @param rank - Rank to check
 * @returns Array of team IDs with the same rank
 */
export function getTeamsWithRank(
  standings: TeamStanding[],
  rank: number
): string[] {
  return standings
    .filter((standing) => standing.rank === rank)
    .map((standing) => standing.teamId);
}

/**
 * Check if standings are complete (all teams have played all matches)
 * 
 * @param standings - Standings array
 * @param totalTeams - Total number of teams
 * @returns true if all teams have played all possible matches
 */
export function isStandingsComplete(
  standings: TeamStanding[],
  totalTeams: number
): boolean {
  // In round-robin, each team should play (totalTeams - 1) matches
  const expectedMatches = totalTeams - 1;

  return standings.every(
    (standing) => standing.matchesPlayed === expectedMatches
  );
}

/**
 * Calculate win percentage
 * 
 * @param standing - Team standing
 * @returns Win percentage (0-100)
 */
export function calculateWinPercentage(standing: TeamStanding): number {
  if (standing.matchesPlayed === 0) return 0;
  return (standing.matchesWon / standing.matchesPlayed) * 100;
}

/**
 * Format standings for display
 * 
 * @param standings - Standings array
 * @returns Formatted standings with display strings
 */
export function formatStandings(standings: TeamStanding[]): Array<{
  rank: number;
  teamId: string;
  record: string; // "W-L-D" format
  points: number;
  pointDifference: string; // "+X" or "-X" format
  winPercentage: number;
}> {
  return standings.map((standing) => ({
    rank: standing.rank,
    teamId: standing.teamId,
    record: `${standing.matchesWon}-${standing.matchesLost}-${standing.matchesDrawn}`,
    points: standing.points,
    pointDifference:
      standing.pointDifference >= 0
        ? `+${standing.pointDifference}`
        : `${standing.pointDifference}`,
    winPercentage: calculateWinPercentage(standing),
  }));
}

