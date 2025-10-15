import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';
import { Prisma } from '@/generated/prisma';

interface CourtParams {
  id: string;
}

// POST /api/courts/[id]/end-match - End the match on the court
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<CourtParams> }
) {
  try {
    const { id } = await params;
    // Parse optional match result fields from request body
    let score: string | undefined;
    let winnerIds: string | undefined;
    let isDraw: boolean | undefined;
    let notes: string | undefined;
    try {
      const body = await request.json();
      // Score: if array/object, stringify
      if (body.score !== undefined) {
        if (typeof body.score === 'object') {
          score = JSON.stringify(body.score);
        } else {
          score = body.score;
        }
      }
      // WinnerIds: if array, stringify
      if (body.winnerIds !== undefined) {
        if (Array.isArray(body.winnerIds)) {
          winnerIds = JSON.stringify(body.winnerIds);
        } else {
          winnerIds = body.winnerIds;
        }
      }
      isDraw = body.isDraw;
      notes = body.notes;
    } catch (e) {
      // No body or invalid JSON, ignore
    }

    // Validate court exists
    const court = await prisma.court.findUnique({
      where: { id },
      include: {
        session: true,
        currentPlayers: true,
        currentMatch: true,
      },
    });

    if (!court) {
      return errorResponse('Court not found', 404);
    }

    // Validate court has an active match
    if (!court.currentMatchId || !court.currentMatch) {
      return errorResponse('Court does not have an active match', 400);
    }

    // Validate session is in progress
    if (court.session.status !== 'IN_PROGRESS') {
      return errorResponse(
        'Cannot end a match for a session that is not in progress',
        400
      );
    }

    // All validations passed, end the match in a transaction
    const result = await prisma.$transaction(
      async (tx) => {
        // End the match
        const match = await tx.match.update({
          where: { id: court.currentMatchId! },
          data: {
            status: 'FINISHED',
            endTime: new Date(),
            ...(score !== undefined ? { score } : {}),
            ...(winnerIds !== undefined ? { winnerIds } : {}),
            ...(isDraw !== undefined ? { isDraw } : {}),
            ...(notes !== undefined ? { notes } : {}),
          },
        });

        // Update players in parallel: move to waiting state and reset their current court
        const playerUpdatePromises = court.currentPlayers.map(
          async (player) => {
            return tx.player.update({
              where: { id: player.id },
              data: {
                status: 'WAITING',
                currentCourtId: null,
                // Add the time they just played to their total wait time
                // This is just for record-keeping; the current wait time is reset
                currentWaitTime: 0,
              },
            });
          }
        );

        // Execute all player updates in parallel
        await Promise.all(playerUpdatePromises);

        // Check if there are pre-selected players for the next match
        let nextCourtStatus: 'EMPTY' | 'READY' = 'EMPTY';
        let preSelectedData = null;

        if (court.preSelectedPlayers) {
          try {
            // Parse pre-selected players data
            preSelectedData =
              typeof court.preSelectedPlayers === 'string'
                ? JSON.parse(court.preSelectedPlayers)
                : court.preSelectedPlayers;

            if (
              preSelectedData &&
              Array.isArray(preSelectedData) &&
              preSelectedData.length > 0
            ) {
              // Verify all pre-selected players are still available
              const preSelectedPlayerIds = preSelectedData.map(
                (p: any) => p.playerId
              );

              const availablePlayers = await tx.player.findMany({
                where: {
                  id: { in: preSelectedPlayerIds },
                  status: 'WAITING',
                  currentCourtId: null,
                },
              });

              if (availablePlayers.length === preSelectedPlayerIds.length) {
                nextCourtStatus = 'READY';

                // Use the proper court selection mechanism with positions
                // Create players with position data (sorted by position)
                const sortedPreSelectedData = preSelectedData.sort(
                  (a: any, b: any) => a.position - b.position
                );

                // Update each player with their court position (same logic as select-players API)
                for (let i = 0; i < sortedPreSelectedData.length; i++) {
                  const { playerId, position } = sortedPreSelectedData[i];
                  await tx.player.update({
                    where: { id: playerId },
                    data: {
                      status: 'READY', // Use READY status like select-players API
                      currentCourtId: id,
                      courtPosition: position, // Store the court position
                    },
                  });
                }

                // Clear the pre-selected players data since they're now assigned
                await tx.court.update({
                  where: { id },
                  data: {
                    preSelectedPlayers: Prisma.DbNull,
                    updatedAt: new Date(),
                  },
                });
              } else {
                // Some players are no longer available, clear the pre-selection
                await tx.court.update({
                  where: { id },
                  data: {
                    preSelectedPlayers: Prisma.DbNull,
                    updatedAt: new Date(),
                  },
                });
                preSelectedData = null;
              }
            } else {
              // No valid pre-selected players found
            }
          } catch (error) {
            // Invalid pre-selected data, clear it
            await tx.court.update({
              where: { id },
              data: {
                preSelectedPlayers: Prisma.DbNull,
                updatedAt: new Date(),
              },
            });
          }
        } else {
          // No pre-selected players
        }

        // Update court status and remove current match
        const updatedCourt = await tx.court.update({
          where: { id },
          data: {
            status: nextCourtStatus,
            currentMatchId: null,
          },
          include: {
            currentPlayers: true,
          },
        });

        return {
          court: updatedCourt,
          match,
          players: court.currentPlayers,
        };
      },
      {
        maxWait: 10000, // Maximum wait time in milliseconds (10 seconds)
        timeout: 15000, // Transaction timeout in milliseconds (15 seconds)
      }
    );

    return successResponse(result, 'Match ended successfully');
  } catch (error) {
    console.error('Error ending match:', error);
    return errorResponse('Failed to end match');
  }
}
