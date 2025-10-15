import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';

interface SessionParams {
  id: string;
}

// POST /api/sessions/[id]/end - End the session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<SessionParams> }
) {
  try {
    const { id } = await params;

    // Get session data with all related entities in one query
    const sessionData = await prisma.session.findUnique({
      where: { id },
      include: {
        players: true,
        matches: {
          where: { status: 'IN_PROGRESS' },
          include: {
            players: true, // Include MatchPlayer relationships
          },
        },
        courts: true,
      },
    });

    if (!sessionData) {
      return errorResponse('Session not found', 404);
    }

    // Validate session can be ended
    if (sessionData.status !== 'IN_PROGRESS') {
      return errorResponse('Only in-progress sessions can be ended', 400);
    }

    // Use transaction to ensure all operations succeed together
    const transactionResult = await prisma.$transaction(
      async (tx) => {
        // End all in-progress matches
        await tx.match.updateMany({
          where: {
            sessionId: id,
            status: 'IN_PROGRESS',
          },
          data: {
            status: 'FINISHED',
            endTime: new Date(),
          },
        });

        // Update players with improved logic
        const playerUpdatePromises = sessionData.players.map(async (player) => {
          // Calculate updated total wait time for players who were waiting
          let updatedTotalWaitTime = player.totalWaitTime;

          if (player.status === 'WAITING' && player.currentWaitTime > 0) {
            // Add current wait time to total wait time before resetting
            updatedTotalWaitTime += player.currentWaitTime;
          }

          return tx.player.update({
            where: { id: player.id },
            data: {
              status: 'FINISHED',
              currentWaitTime: 0, // Reset current waiting time
              totalWaitTime: updatedTotalWaitTime, // Update total wait time
              currentCourtId: null, // Clear court assignment
            },
          });
        });

        // Execute all player updates in parallel
        await Promise.all(playerUpdatePromises);

        // Update all courts in this session to EMPTY status
        await tx.court.updateMany({
          where: {
            sessionId: id,
          },
          data: {
            status: 'EMPTY',
            currentMatchId: null,
          },
        });

        // End session
        const session = await tx.session.update({
          where: { id },
          data: {
            status: 'FINISHED',
            endTime: new Date(),
          },
        });

        // Generate session statistics within transaction for consistency
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
          },
          orderBy: {
            matchesPlayed: 'desc',
          },
        });

        return { session, statistics: { players: finalStats } };
      },
      {
        maxWait: 10000, // Maximum wait time in milliseconds (10 seconds)
        timeout: 15000, // Transaction timeout in milliseconds (15 seconds)
      }
    );

    return successResponse(transactionResult, 'Session ended successfully');
  } catch (error) {
    console.error('Error ending session:', error);
    return errorResponse('Failed to end session');
  }
}
