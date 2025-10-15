import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';

interface CourtParams {
  id: string;
}

// Helper function to calculate level score for balancing
function getLevelScore(level: string | null): number {
  if (!level) return 4; // Default middle level
  const levelMap: { [key: string]: number } = {
    Y_MINUS: 1,
    Y: 1.5,
    Y_PLUS: 2,
    TBY: 3,
    TB_MINUS: 4,
    TB: 4.5,
    TB_PLUS: 5,
    K: 6,
  };
  return levelMap[level] || 4;
}

// Helper function to find balanced pairs
function findBalancedPairs(players: any[]) {
  if (players.length < 4) return null;

  let bestPairs = null;
  let smallestDifference = Infinity;

  // Try all possible combinations of 2 pairs from available players
  for (let i = 0; i < players.length - 3; i++) {
    for (let j = i + 1; j < players.length - 2; j++) {
      for (let k = j + 1; k < players.length - 1; k++) {
        for (let l = k + 1; l < players.length; l++) {
          const fourPlayers = [players[i], players[j], players[k], players[l]];

          // Try different pair combinations
          const combinations = [
            {
              pair1: [fourPlayers[0], fourPlayers[1]],
              pair2: [fourPlayers[2], fourPlayers[3]],
            },
            {
              pair1: [fourPlayers[0], fourPlayers[2]],
              pair2: [fourPlayers[1], fourPlayers[3]],
            },
            {
              pair1: [fourPlayers[0], fourPlayers[3]],
              pair2: [fourPlayers[1], fourPlayers[2]],
            },
          ];

          for (const combo of combinations) {
            const pair1Score =
              getLevelScore(combo.pair1[0].level) +
              getLevelScore(combo.pair1[1].level);
            const pair2Score =
              getLevelScore(combo.pair2[0].level) +
              getLevelScore(combo.pair2[1].level);
            const difference = Math.abs(pair1Score - pair2Score);

            if (difference < smallestDifference) {
              smallestDifference = difference;
              bestPairs = combo;
            }
          }
        }
      }
    }
  }

  return bestPairs;
}

// GET /api/courts/[id]/suggested-players - Get suggested balanced pairs for a court
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<CourtParams> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const topCount = searchParams.get('topCount');

    // Validate court exists
    const court = await prisma.court.findUnique({
      where: { id },
      include: {
        session: true,
      },
    });

    if (!court) {
      return errorResponse('Court not found', 404);
    }

    // Validate session is in progress
    if (court.session.status !== 'IN_PROGRESS') {
      return errorResponse(
        'Cannot get suggested players for a session that is not in progress',
        400
      );
    }

    // Validate court is empty
    if (court.status === 'IN_USE') {
      return errorResponse('Court is already in use', 400);
    }

    // Determine how many players to consider
    let playersToConsider = null;
    if (topCount) {
      const numberOfPlayers = parseInt(topCount);
      if (isNaN(numberOfPlayers) || numberOfPlayers < 4) {
        return errorResponse('topCount must be at least 4', 400);
      }
      playersToConsider = numberOfPlayers;
    }

    // Get waiting players ordered by wait time (longest wait first)
    const waitingPlayers = await prisma.player.findMany({
      where: {
        sessionId: court.sessionId,
        status: 'WAITING',
      },
      orderBy: {
        currentWaitTime: 'desc',
      },
      take: playersToConsider || undefined, // Take specified number or all
    });

    // Check if we have enough players
    if (waitingPlayers.length < 4) {
      return errorResponse('Not enough waiting players to start a match', 400);
    }

    // Find balanced pairs
    const balancedPairs = findBalancedPairs(waitingPlayers);

    if (!balancedPairs) {
      return errorResponse('Could not find balanced pairs', 400);
    }

    // Calculate pair scores for response
    const pair1TotalScore = balancedPairs.pair1.reduce(
      (sum, player) => sum + getLevelScore(player.level),
      0
    );
    const pair2TotalScore = balancedPairs.pair2.reduce(
      (sum, player) => sum + getLevelScore(player.level),
      0
    );

    // Return the balanced pairs
    return successResponse(
      {
        pair1: {
          players: balancedPairs.pair1,
          totalLevelScore: pair1TotalScore,
        },
        pair2: {
          players: balancedPairs.pair2,
          totalLevelScore: pair2TotalScore,
        },
        scoreDifference: Math.abs(pair1TotalScore - pair2TotalScore),
        totalPlayersConsidered: waitingPlayers.length,
      },
      'Balanced pairs retrieved successfully'
    );
  } catch (error) {
    console.error('Error getting suggested players:', error);
    return errorResponse('Failed to get suggested players');
  }
}
