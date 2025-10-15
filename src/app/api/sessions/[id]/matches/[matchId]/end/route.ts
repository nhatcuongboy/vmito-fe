import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';
import { Prisma } from '@/generated/prisma';

interface MatchEndParams {
  id: string;
  matchId: string;
}

// PATCH /api/sessions/[id]/matches/[matchId]/end - End a match
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<MatchEndParams> }
) {
  try {
    const { id: sessionId, matchId } = await params;

    // Check if session exists and is in progress
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return errorResponse('Session not found', 404);
    }

    if (session.status !== 'IN_PROGRESS') {
      return errorResponse(
        'Cannot end a match for a session that is not in progress',
        400
      );
    }

    // Check if match exists and is in progress
    const match = await prisma.match.findFirst({
      where: {
        id: matchId,
        sessionId,
      },
      include: {
        court: true,
        players: {
          include: {
            player: true,
          },
        },
      },
    });

    if (!match) {
      return errorResponse('Match not found', 404);
    }

    if (match.status !== 'IN_PROGRESS') {
      return errorResponse('Match is already finished', 400);
    }

    // Get player IDs from match
    const playerIds = match.players.map((mp) => mp.player.id);

    // Start transaction to end match and update related entities
    const result = await prisma.$transaction(
      async (tx) => {
        // 1. End the match
        const updatedMatch = await tx.match.update({
          where: { id: matchId },
          data: {
            status: 'FINISHED',
            endTime: new Date(),
          },
        });

        // 2. Check if court has pre-selected players for next match
        const courtWithPreSelect = await tx.court.findUnique({
          where: { id: match.courtId },
          select: {
            preSelectedPlayers: true,
          },
        });

        let nextMatchId = null;

        // If court has pre-selected players, create next match automatically
        if (
          courtWithPreSelect?.preSelectedPlayers &&
          Array.isArray(courtWithPreSelect.preSelectedPlayers) &&
          courtWithPreSelect.preSelectedPlayers.length === 4
        ) {
          // Extract player IDs from pre-selected players array
          const preSelectedPlayersArray =
            courtWithPreSelect.preSelectedPlayers as Array<{
              playerId: string;
              position: number;
            }>;
          const preSelectedPlayerIds = preSelectedPlayersArray.map(
            (p) => p.playerId
          );

          // Verify all pre-selected players are still available (waiting)
          const availablePlayers = await tx.player.findMany({
            where: {
              id: { in: preSelectedPlayerIds },
              status: 'WAITING',
              sessionId,
            },
          });

          if (availablePlayers.length === 4) {
            // Create new match with pre-selected players
            const newMatch = await tx.match.create({
              data: {
                sessionId,
                courtId: match.courtId,
                status: 'IN_PROGRESS',
                startTime: new Date(),
                players: {
                  create: preSelectedPlayersArray.map((p) => ({
                    playerId: p.playerId,
                    position: p.position + 1, // Convert 0-based to 1-based position
                  })),
                },
              },
            });

            nextMatchId = newMatch.id;

            // Update court with new match and clear pre-selection
            await tx.court.update({
              where: { id: match.courtId },
              data: {
                status: 'IN_USE',
                currentMatchId: newMatch.id,
                preSelectedPlayers: Prisma.DbNull,
              },
            });

            // Update pre-selected players to PLAYING status
            await Promise.all(
              preSelectedPlayerIds.map((playerId) =>
                tx.player.update({
                  where: { id: playerId },
                  data: {
                    status: 'PLAYING',
                    currentCourtId: match.courtId,
                  },
                })
              )
            );
          } else {
            // Not all pre-selected players are available, clear pre-selection
            // Court status will be determined later after updating players
            await tx.court.update({
              where: { id: match.courtId },
              data: {
                currentMatchId: null,
                preSelectedPlayers: Prisma.DbNull,
              },
            });
          }
        }

        // 3. Update players from ended match to WAITING status (unless they're in the next match)
        let playersToSetWaiting = playerIds;

        if (nextMatchId) {
          // If there's a next match with pre-selected players,
          // only set non-pre-selected players to waiting
          const preSelectedPlayersArray =
            courtWithPreSelect?.preSelectedPlayers as Array<{
              playerId: string;
              position: number;
            }>;
          const preSelectedPlayerIds = preSelectedPlayersArray.map(
            (p) => p.playerId
          );

          playersToSetWaiting = playerIds.filter(
            (playerId) => !preSelectedPlayerIds.includes(playerId)
          );
        }

        // Update player statuses and stats
        const playerUpdatePromises = playersToSetWaiting.map(
          async (playerId) => {
            return tx.player.update({
              where: { id: playerId },
              data: {
                status: 'WAITING',
                currentCourtId: null,
                matchesPlayed: {
                  increment: 1,
                },
              },
            });
          }
        );

        // Update match count for all players who played (including those continuing)
        const allPlayerMatchUpdatePromises = playerIds.map(async (playerId) => {
          if (!playersToSetWaiting.includes(playerId)) {
            // For players continuing to next match, only update match count
            return tx.player.update({
              where: { id: playerId },
              data: {
                matchesPlayed: {
                  increment: 1,
                },
              },
            });
          }
        });

        await Promise.all([
          ...playerUpdatePromises,
          ...allPlayerMatchUpdatePromises.filter(Boolean),
        ]);

        // 4. Update court status for cases without next match (after players have been updated)
        if (!nextMatchId) {
          const waitingPlayersCount = await tx.player.count({
            where: {
              sessionId,
              status: 'WAITING',
            },
          });

          await tx.court.update({
            where: { id: match.courtId },
            data: {
              status: waitingPlayersCount >= 4 ? 'READY' : 'EMPTY',
            },
          });
        }

        return { endedMatch: updatedMatch, nextMatchId };
      },
      {
        maxWait: 10000, // Maximum wait time in milliseconds (10 seconds)
        timeout: 15000, // Transaction timeout in milliseconds (15 seconds)
      }
    );

    // Get the updated match data to return
    const updatedMatchData = await prisma.match.findUnique({
      where: { id: result.endedMatch.id },
      include: {
        players: {
          include: {
            player: true,
          },
        },
        court: true,
      },
    });

    // Get next match data if it was created
    let nextMatchData = null;
    if (result.nextMatchId) {
      nextMatchData = await prisma.match.findUnique({
        where: { id: result.nextMatchId },
        include: {
          players: {
            include: {
              player: true,
            },
          },
          court: true,
        },
      });
    }

    const responseData = {
      endedMatch: updatedMatchData,
      nextMatch: nextMatchData,
    };

    const message = result.nextMatchId
      ? 'Match ended successfully and next match started automatically'
      : 'Match ended successfully';

    return successResponse(responseData, message);
  } catch (error) {
    console.error('Error ending match:', error);
    return errorResponse('Failed to end match');
  }
}
