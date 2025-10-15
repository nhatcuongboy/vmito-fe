import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';

interface SessionParams {
  id: string;
}

// POST /api/sessions/[id]/migrate-end - Migrate/fix old ended sessions
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<SessionParams> }
) {
  try {
    const { id } = await params;

    // Get session data with all related entities
    const sessionData = await prisma.session.findUnique({
      where: { id },
      include: {
        players: true,
        matches: true, // Get all matches, not just IN_PROGRESS
        courts: true,
      },
    });

    if (!sessionData) {
      return errorResponse('Session not found', 404);
    }

    // Only allow migration for FINISHED sessions
    if (sessionData.status !== 'FINISHED') {
      return errorResponse(
        'Can only migrate sessions that are already FINISHED',
        400
      );
    }

    // Use transaction to ensure all operations succeed together
    const transactionResult = await prisma.$transaction(
      async (tx) => {
        // 1. End any remaining IN_PROGRESS matches (if any)
        const unfinishedMatches = await tx.match.updateMany({
          where: {
            sessionId: id,
            status: 'IN_PROGRESS',
          },
          data: {
            status: 'FINISHED',
            endTime: new Date(),
          },
        });

        // 2. Update players with improved logic
        const playerUpdatePromises = sessionData.players.map(async (player) => {
          // Calculate updated total wait time for players who were waiting
          let updatedTotalWaitTime = player.totalWaitTime;

          // If player is still in WAITING or PLAYING status, add current wait time to total
          if (
            (player.status === 'WAITING' || player.status === 'PLAYING') &&
            player.currentWaitTime > 0
          ) {
            updatedTotalWaitTime += player.currentWaitTime;
          }

          return tx.player.update({
            where: { id: player.id },
            data: {
              status: 'FINISHED', // Ensure all players are marked as FINISHED
              currentWaitTime: 0, // Reset current waiting time
              totalWaitTime: updatedTotalWaitTime, // Update total wait time
              currentCourtId: null, // Clear court assignment
            },
          });
        });

        // Execute all player updates in parallel
        const updatedPlayers = await Promise.all(playerUpdatePromises);

        // 3. Update all courts in this session to EMPTY status
        const updatedCourts = await tx.court.updateMany({
          where: {
            sessionId: id,
          },
          data: {
            status: 'EMPTY',
            currentMatchId: null,
          },
        });

        // 4. Generate session statistics within transaction for consistency
        const finalStats = await tx.player.findMany({
          where: {
            sessionId: id,
          },
          select: {
            id: true,
            playerNumber: true,
            name: true,
            matchesPlayed: true,
            totalWaitTime: true,
            status: true,
          },
          orderBy: {
            matchesPlayed: 'desc',
          },
        });

        // 5. Get updated session data
        const session = await tx.session.findUnique({
          where: { id },
          include: {
            host: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        return {
          session,
          statistics: { players: finalStats },
          migrationResults: {
            unfinishedMatchesFixed: unfinishedMatches.count,
            playersUpdated: updatedPlayers.length,
            courtsUpdated: updatedCourts.count,
          },
        };
      },
      {
        maxWait: 15000, // Maximum wait time in milliseconds (15 seconds)
        timeout: 20000, // Transaction timeout in milliseconds (20 seconds)
      }
    );

    return successResponse(
      transactionResult,
      `Session migration completed successfully. Fixed ${transactionResult.migrationResults.unfinishedMatchesFixed} matches, updated ${transactionResult.migrationResults.playersUpdated} players, and cleaned ${transactionResult.migrationResults.courtsUpdated} courts.`
    );
  } catch (error) {
    console.error('Error migrating session:', error);
    return errorResponse('Failed to migrate session');
  }
}
