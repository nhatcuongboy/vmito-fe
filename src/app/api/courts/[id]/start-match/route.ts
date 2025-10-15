import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';

interface CourtParams {
  id: string;
}

// POST /api/courts/[id]/start-match - Start the match on the court
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

    // Validate court has 4 players
    if (court.currentPlayers.length !== 4) {
      return errorResponse(
        'Court must have exactly 4 players to start a match',
        400
      );
    }

    // Validate session is in progress
    if (court.session.status !== 'IN_PROGRESS') {
      return errorResponse(
        'Cannot start a match for a session that is not in progress',
        400
      );
    }

    // Validate court doesn't already have an active match
    if (court.currentMatchId) {
      return errorResponse('Court already has an active match', 400);
    }

    // All validations passed, create a new match in a transaction
    const result = await prisma.$transaction(
      async (tx) => {
        // Calculate if this is an extra match (started after session end time)
        const currentTime = new Date();
        const isExtra = court.session.endTime
          ? currentTime > court.session.endTime
          : false;

        // Create new match
        const match = await tx.match.create({
          data: {
            sessionId: court.sessionId,
            courtId: id,
            status: 'IN_PROGRESS',
            startTime: currentTime,
            isExtra: isExtra, // Set isExtra based on session end time
          },
        });

        // Prepare batch updates for players
        const playerUpdatePromises = court.currentPlayers.map(
          async (player, i) => {
            // Create match player with position based on order (0-based index from frontend)
            await tx.matchPlayer.create({
              data: {
                matchId: match.id,
                playerId: player.id,
                position: i, // Position 0-3 (matching frontend position system)
              },
            });

            // Update player matches count, status to PLAYING, and reset wait time
            return tx.player.update({
              where: { id: player.id },
              data: {
                matchesPlayed: {
                  increment: 1,
                },
                status: 'PLAYING', // Update status to PLAYING
                currentWaitTime: 0, // Reset wait time to 0
              },
            });
          }
        );

        // Execute all player updates in parallel
        await Promise.all(playerUpdatePromises);

        // Update court with current match and set status to IN_USE
        const updatedCourt = await tx.court.update({
          where: { id },
          data: {
            currentMatchId: match.id,
            status: 'IN_USE', // Set court status to IN_USE
          },
          include: {
            currentPlayers: true,
            currentMatch: true,
          },
        });

        return {
          court: updatedCourt,
          match,
        };
      },
      {
        maxWait: 10000, // Maximum wait time in milliseconds (10 seconds)
        timeout: 15000, // Transaction timeout in milliseconds (15 seconds)
      }
    );

    return successResponse(result, 'Match started successfully');
  } catch (error) {
    console.error('Error starting match:', error);
    return errorResponse('Failed to start match');
  }
}
