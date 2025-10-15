import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';

interface CourtParams {
  id: string;
}

interface PlayerWithPosition {
  playerId: string;
  position: number;
}

// POST /api/courts/[id]/select-players - Host selects players for the court
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<CourtParams> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { playerIds, players: playersWithPosition } = body;

    // Support both old format (playerIds only) and new format (players with position)
    let finalPlayerIds: string[];
    let positionInfo: PlayerWithPosition[] | null = null;

    if (playersWithPosition && Array.isArray(playersWithPosition)) {
      // New format: players with position info
      finalPlayerIds = playersWithPosition.map(
        (p: PlayerWithPosition) => p.playerId
      );
      positionInfo = playersWithPosition;
    } else if (playerIds && Array.isArray(playerIds)) {
      // Old format: playerIds only
      finalPlayerIds = playerIds;
    } else {
      return errorResponse(
        'Either playerIds or players with position must be provided',
        400
      );
    }

    // Validate court exists
    const court = await prisma.court.findUnique({
      where: { id },
      include: {
        session: true,
        currentPlayers: true,
      },
    });

    if (!court) {
      return errorResponse('Court not found', 404);
    }

    // Validate session is in progress
    if (court.session.status !== 'IN_PROGRESS') {
      return errorResponse(
        'Cannot select players for a session that is not in progress',
        400
      );
    }

    // Validate court is empty
    if (court.status === 'IN_USE') {
      return errorResponse('Court is already in use', 400);
    }

    // Validate exactly 4 player IDs
    if (!Array.isArray(finalPlayerIds) || finalPlayerIds.length !== 4) {
      return errorResponse('Exactly 4 players must be selected', 400);
    }

    // If position info is provided, validate positions
    if (positionInfo) {
      const positions = positionInfo.map((p) => p.position);
      const expectedPositions = [0, 1, 2, 3];

      if (!expectedPositions.every((pos) => positions.includes(pos))) {
        return errorResponse(
          'Position info must include positions 0, 1, 2, and 3',
          400
        );
      }
    }

    // Validate all players exist and are in waiting state
    const validPlayers = await prisma.player.findMany({
      where: {
        id: {
          in: finalPlayerIds,
        },
      },
    });

    if (validPlayers.length !== 4) {
      return errorResponse('One or more selected players do not exist', 404);
    }

    const nonWaitingPlayers = validPlayers.filter(
      (player) => player.status !== 'WAITING'
    );
    if (nonWaitingPlayers.length > 0) {
      return errorResponse(
        `Players ${nonWaitingPlayers
          .map((p) => p.playerNumber)
          .join(', ')} are not in waiting state`,
        400
      );
    }

    // All validations passed, prepare for transaction
    const result = await prisma.$transaction(
      async (tx) => {
        // If position info is provided, update players in position order
        if (positionInfo) {
          // Sort position info by position to ensure correct order
          const sortedPositionInfo = positionInfo.sort(
            (a, b) => a.position - b.position
          );

          // Update each player with their court position
          for (let i = 0; i < sortedPositionInfo.length; i++) {
            const { playerId, position } = sortedPositionInfo[i];
            await tx.player.update({
              where: { id: playerId },
              data: {
                status: 'READY',
                currentCourtId: id,
                courtPosition: position, // Store the actual position
              },
            });
          }
        } else {
          // Original logic for when no position info is provided
          const playerUpdatePromises = finalPlayerIds.map(
            async (playerId: string, index: number) => {
              return tx.player.update({
                where: { id: playerId },
                data: {
                  status: 'READY',
                  currentCourtId: id,
                  courtPosition: index, // Use array index as position
                },
              });
            }
          );

          // Execute all player updates in parallel
          await Promise.all(playerUpdatePromises);
        }

        // Update court status to READY
        const updatedCourt = await tx.court.update({
          where: { id },
          data: {
            status: 'READY',
          },
          include: {
            currentPlayers: true,
          },
        });

        // If position info was provided, sort players according to position for consistent ordering
        if (positionInfo) {
          const sortedPlayers = [...updatedCourt.currentPlayers].sort(
            (a, b) => {
              const posA =
                positionInfo.find((p) => p.playerId === a.id)?.position ?? 0;
              const posB =
                positionInfo.find((p) => p.playerId === b.id)?.position ?? 0;
              return posA - posB;
            }
          );

          // Return court with sorted players to maintain position consistency
          return {
            ...updatedCourt,
            currentPlayers: sortedPlayers,
            positionInfo: positionInfo, // Include position info in response for debugging
          };
        }

        return updatedCourt;
      },
      {
        maxWait: 10000, // Maximum wait time in milliseconds (10 seconds)
        timeout: 15000, // Transaction timeout in milliseconds (15 seconds)
      }
    );

    return successResponse(
      result,
      'Players selected and court updated successfully'
    );
  } catch (error) {
    console.error('Error selecting players for court:', error);
    return errorResponse('Failed to select players for court');
  }
}
