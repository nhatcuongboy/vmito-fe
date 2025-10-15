import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';

interface SessionParams {
  id: string;
}

// POST /api/sessions/[id]/auto-assign - Auto-assign players to empty courts
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<SessionParams> }
) {
  try {
    const { id: sessionId } = await params;

    // Check if session exists and is in progress
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return errorResponse('Session not found', 404);
    }

    if (session.status !== 'IN_PROGRESS') {
      return errorResponse(
        'Cannot auto-assign players for a session that is not in progress',
        400
      );
    }

    // Get empty courts
    const emptyCourts = await prisma.court.findMany({
      where: {
        sessionId,
        status: 'EMPTY',
      },
      orderBy: {
        courtNumber: 'asc',
      },
    });

    if (emptyCourts.length === 0) {
      return errorResponse('No empty courts available', 400);
    }

    // Get waiting players ordered by wait time (longest wait first)
    const waitingPlayers = await prisma.player.findMany({
      where: {
        sessionId,
        status: 'WAITING',
      },
      orderBy: {
        currentWaitTime: 'desc',
      },
    });

    // Check if we have enough players for at least one court
    if (waitingPlayers.length < 4) {
      return errorResponse('Not enough waiting players to start a match', 400);
    }

    // Calculate how many courts we can fill
    const courtsToFill = Math.min(
      emptyCourts.length,
      Math.floor(waitingPlayers.length / 4)
    );

    if (courtsToFill === 0) {
      return errorResponse('Not enough players to fill any courts', 400);
    }

    // Create matches for each court we can fill
    const createdMatches = [];

    for (let i = 0; i < courtsToFill; i++) {
      const court = emptyCourts[i];
      const players = waitingPlayers.slice(i * 4, i * 4 + 4);
      const playerIds = players.map((p) => p.id);

      // Create match in a transaction
      const result = await prisma.$transaction(
        async (tx) => {
          // 1. Create a new match
          const newMatch = await tx.match.create({
            data: {
              sessionId,
              courtId: court.id,
              status: 'IN_PROGRESS',
              startTime: new Date(),
            },
          });

          // 2. Create match players (positions 0-3) in parallel
          const matchPlayerPromises = playerIds.map((playerId, index) => {
            return tx.matchPlayer.create({
              data: {
                matchId: newMatch.id,
                playerId: playerId,
                position: index, // Position 0-3 (matching frontend position system)
              },
            });
          });

          await Promise.all(matchPlayerPromises);

          // 3. Update court status
          await tx.court.update({
            where: { id: court.id },
            data: {
              status: 'IN_USE',
              currentMatchId: newMatch.id,
            },
          });

          // 4. Update player statuses (using updateMany for efficiency)
          await tx.player.updateMany({
            where: {
              id: { in: playerIds },
            },
            data: {
              status: 'PLAYING',
              currentCourtId: court.id,
              currentWaitTime: 0, // Reset wait time when starting a match
            },
          });

          return newMatch;
        },
        {
          maxWait: 10000, // Maximum wait time in milliseconds (10 seconds)
          timeout: 15000, // Transaction timeout in milliseconds (15 seconds)
        }
      );

      createdMatches.push(result);
    }

    return successResponse(
      {
        matchesCreated: createdMatches.length,
        matches: createdMatches,
      },
      `Successfully created ${createdMatches.length} matches`
    );
  } catch (error) {
    console.error('Error auto-assigning players:', error);
    return errorResponse('Failed to auto-assign players');
  }
}
