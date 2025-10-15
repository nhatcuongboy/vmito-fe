import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';

interface CourtParams {
  id: string;
}

// POST /api/courts/[id]/deselect-players - Host reverts player selection on a court
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<CourtParams> }
) {
  try {
    const { id } = await params;

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
        'Cannot deselect players for a session that is not in progress',
        400
      );
    }

    // Validate court is in READY state
    if (court.status !== 'READY') {
      return errorResponse(
        'Can only deselect players from a court in READY state',
        400
      );
    }

    // Check if there are currently players assigned to the court
    if (!court.currentPlayers || court.currentPlayers.length === 0) {
      return errorResponse(
        'No players are currently assigned to this court',
        400
      );
    }

    // All validations passed, prepare for transaction
    const result = await prisma.$transaction(
      async (tx) => {
        // Get all players currently on the court
        const playersToDeselect = court.currentPlayers.map(
          (player) => player.id
        );

        // Update each player's status back to WAITING and remove them from court in parallel
        const playerUpdatePromises = playersToDeselect.map(async (playerId) => {
          return tx.player.update({
            where: { id: playerId },
            data: {
              status: 'WAITING',
              currentCourtId: null, // Remove court assignment
              courtPosition: null, // Clear court position
            },
          });
        });

        // Execute all player updates in parallel
        await Promise.all(playerUpdatePromises);

        // Update court status back to EMPTY
        const updatedCourt = await tx.court.update({
          where: { id },
          data: {
            status: 'EMPTY',
          },
          include: {
            currentPlayers: true, // Should be empty after the transaction
          },
        });

        return updatedCourt;
      },
      {
        maxWait: 10000, // Maximum wait time in milliseconds (10 seconds)
        timeout: 15000, // Transaction timeout in milliseconds (15 seconds)
      }
    );

    return successResponse(
      result,
      'Players deselected and court status reverted successfully'
    );
  } catch (error) {
    console.error('Error deselecting players from court:', error);
    return errorResponse('Failed to deselect players from court');
  }
}
