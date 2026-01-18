// Utility functions for converting match results to UI-friendly format

export interface MatchScore {
  playerId: string;
  score: number;
}

export interface MatchResult {
  isDraw?: boolean;
  notes?: string;
  score?: MatchScore[];
  winnerIds?: string[];
}

export interface UIMatchResult {
  scores: {
    pair1Score: number;
    pair2Score: number;
  };
  winningPair?: 1 | 2;
  isDraw: boolean;
  notes?: string;
}

/**
 * Converts match result data to UI-friendly format
 * Assumes 4 players in positions: [player1, player2, player3, player4]
 * Where Pair 1 = [player1, player2] and Pair 2 = [player3, player4]
 */
export function convertMatchResultToUI(
  matchResult: MatchResult,
  players: Array<{ playerId: string; position: number }>
): UIMatchResult {
  const result: UIMatchResult = {
    scores: {
      pair1Score: 0,
      pair2Score: 0,
    },
    isDraw: matchResult.isDraw || false,
    notes: matchResult.notes,
  };

  // If no score data, return default
  if (!matchResult.score || !Array.isArray(matchResult.score)) {
    return result;
  }

  // Sort players by position to ensure correct pairing
  const sortedPlayers = players.sort((a, b) => a.position - b.position);

  // Pair 1: positions 1 and 2, Pair 2: positions 3 and 4
  const pair1PlayerIds = sortedPlayers.slice(0, 2).map((p) => p.playerId);
  const pair2PlayerIds = sortedPlayers.slice(2, 4).map((p) => p.playerId);

  // Calculate pair scores by summing individual player scores
  let pair1Total = 0;
  let pair2Total = 0;

  matchResult.score.forEach((playerScore) => {
    if (pair1PlayerIds.includes(playerScore.playerId)) {
      pair1Total += playerScore.score || 0;
    } else if (pair2PlayerIds.includes(playerScore.playerId)) {
      pair2Total += playerScore.score || 0;
    }
  });

  result.scores.pair1Score = pair1Total;
  result.scores.pair2Score = pair2Total;

  // Determine winning pair if not a draw
  if (!result.isDraw) {
    if (matchResult.winnerIds && matchResult.winnerIds.length > 0) {
      // Check if winners belong to pair 1 or pair 2
      const winnersInPair1 = matchResult.winnerIds.filter((id) =>
        pair1PlayerIds.includes(id)
      ).length;
      const winnersInPair2 = matchResult.winnerIds.filter((id) =>
        pair2PlayerIds.includes(id)
      ).length;

      if (winnersInPair1 > winnersInPair2) {
        result.winningPair = 1;
      } else if (winnersInPair2 > winnersInPair1) {
        result.winningPair = 2;
      }
    } else {
      // Fallback: determine winner by score
      if (pair1Total > pair2Total) {
        result.winningPair = 1;
      } else if (pair2Total > pair1Total) {
        result.winningPair = 2;
      }
    }
  }

  return result;
}

/**
 * Alternative function for badminton scoring where score represents the final game score
 * In badminton, typically one pair wins (e.g., 21-19, 21-18)
 */
export function convertBadmintonMatchToUI(
  matchResult: MatchResult,
  players: Array<{ playerId: string; position: number }>
): UIMatchResult {
  const result: UIMatchResult = {
    scores: {
      pair1Score: 0,
      pair2Score: 0,
    },
    isDraw: matchResult.isDraw || false,
    notes: matchResult.notes,
  };

  // If no score data, return default
  if (!matchResult.score || !Array.isArray(matchResult.score)) {
    return result;
  }

  // Sort players by position
  const sortedPlayers = players.sort((a, b) => a.position - b.position);
  const pair1PlayerIds = sortedPlayers.slice(0, 2).map((p) => p.playerId);
  const pair2PlayerIds = sortedPlayers.slice(2, 4).map((p) => p.playerId);

  // For badminton, we expect the score to be the final game score
  // Find the score for each pair (should be the same for both players in a pair)
  const pair1Score =
    matchResult.score.find((s) => pair1PlayerIds.includes(s.playerId))?.score ||
    0;
  const pair2Score =
    matchResult.score.find((s) => pair2PlayerIds.includes(s.playerId))?.score ||
    0;

  result.scores.pair1Score = pair1Score;
  result.scores.pair2Score = pair2Score;

  // Determine winning pair
  if (!result.isDraw) {
    if (matchResult.winnerIds && matchResult.winnerIds.length > 0) {
      const winnersInPair1 = matchResult.winnerIds.filter((id) =>
        pair1PlayerIds.includes(id)
      ).length;
      const winnersInPair2 = matchResult.winnerIds.filter((id) =>
        pair2PlayerIds.includes(id)
      ).length;

      if (winnersInPair1 > 0) {
        result.winningPair = 1;
      } else if (winnersInPair2 > 0) {
        result.winningPair = 2;
      }
    } else {
      // Determine by score
      if (pair1Score > pair2Score) {
        result.winningPair = 1;
      } else if (pair2Score > pair1Score) {
        result.winningPair = 2;
      }
    }
  }

  return result;
}

/**
 * Parses score data from various formats and converts to UI format
 * Returns null if no valid score data is found, allowing UI to show "..."
 */
export function parseScoreData(
  scoreData: unknown,
  players?: Array<{ playerId: string; position: number }>
): UIMatchResult | null {
  // Return null if no score data provided
  if (!scoreData) return null;

  try {
    // Handle string format
    if (typeof scoreData === 'string') {
      // Handle [21,19] format
      if (scoreData.startsWith('[') && scoreData.endsWith(']')) {
        const scoreArray = JSON.parse(scoreData);
        if (Array.isArray(scoreArray) && scoreArray.length === 2) {
          // Check if scores are valid numbers
          const score1 = Number(scoreArray[0]);
          const score2 = Number(scoreArray[1]);

          if (isNaN(score1) || isNaN(score2)) return null;

          return {
            scores: {
              pair1Score: score1,
              pair2Score: score2,
            },
            winningPair: score1 > score2 ? 1 : score2 > score1 ? 2 : undefined,
            isDraw: score1 === score2,
          };
        }
      }

      // Try to parse as JSON
      const parsed = JSON.parse(scoreData);
      return parseScoreData(parsed, players);
    }

    if (typeof scoreData === 'object' && scoreData !== null) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = scoreData as Record<string, any>;
      // Check if it's the new Match interface format
      if (data.score && Array.isArray(data.score) && players) {
        // We need to cast data to MatchResult to satisfy the type,
        // assuming it matches structure if data.score exists
        const result = convertBadmintonMatchToUI(data as MatchResult, players);
        // Return null if no valid scores found
        if (result.scores.pair1Score === 0 && result.scores.pair2Score === 0) {
          return null;
        }
        return result;
      }

      // Handle legacy formats
      const scoresObj = data.scores || data;
      const pair1Score = Number(
        scoresObj.pair1 || scoresObj.team1 || scoresObj.score1 || 0
      );
      const pair2Score = Number(
        scoresObj.pair2 || scoresObj.team2 || scoresObj.score2 || 0
      );

      // Return null if both scores are 0 or invalid
      if (
        (pair1Score === 0 && pair2Score === 0) ||
        isNaN(pair1Score) ||
        isNaN(pair2Score)
      ) {
        return null;
      }

      return {
        scores: {
          pair1Score,
          pair2Score,
        },
        winningPair:
          pair1Score > pair2Score ? 1 : pair2Score > pair1Score ? 2 : undefined,
        isDraw: pair1Score === pair2Score,
      };
    }
  } catch (e) {
    console.warn('Failed to parse score data:', e);
    return null;
  }

  return null;
}
