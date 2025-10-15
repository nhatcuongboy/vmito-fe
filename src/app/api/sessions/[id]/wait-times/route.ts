import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';

interface SessionParams {
  id: string;
}

// PUT /api/sessions/[id]/wait-times - Update wait times for a specific session
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<SessionParams> }
) {
  try {
    const { id: sessionId } = await params;
    const body = await request.json();
    const { minutesToAdd = 1, resetType, playerIds } = body;

    // Validate session exists and is active
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return errorResponse('Session not found', 404);
    }

    if (session.status !== 'IN_PROGRESS') {
      return errorResponse('Session is not in progress', 400);
    }

    let result;
    let updatedPlayers;

    // Handle reset functionality
    if (resetType && playerIds && Array.isArray(playerIds)) {
      // Reset specific players' wait times
      let updateData: any = {};

      switch (resetType) {
        case 'current':
          updateData = { currentWaitTime: 0 };
          break;
        case 'total':
          updateData = { totalWaitTime: 0 };
          break;
        case 'both':
          updateData = { currentWaitTime: 0, totalWaitTime: 0 };
          break;
        default:
          updateData = { currentWaitTime: 0 };
      }

      result = await prisma.player.updateMany({
        where: {
          sessionId,
          id: { in: playerIds },
        },
        data: updateData,
      });

      updatedPlayers = await prisma.player.findMany({
        where: {
          sessionId,
          id: { in: playerIds },
        },
        orderBy: [{ currentWaitTime: 'desc' }, { playerNumber: 'asc' }],
      });
    } else {
      // Regular wait time update for all waiting players
      result = await prisma.player.updateMany({
        where: {
          sessionId,
          status: 'WAITING',
        },
        data: {
          currentWaitTime: {
            increment: minutesToAdd,
          },
          totalWaitTime: {
            increment: minutesToAdd,
          },
        },
      });

      // Get updated players for response
      updatedPlayers = await prisma.player.findMany({
        where: {
          sessionId,
          status: 'WAITING',
        },
        orderBy: [{ currentWaitTime: 'desc' }, { playerNumber: 'asc' }],
      });
    }

    return successResponse({
      updatedCount: result.count,
      players: updatedPlayers,
      minutesAdded: resetType ? 0 : minutesToAdd,
    });
  } catch (error) {
    console.error('Error updating wait times:', error);
    return errorResponse('Failed to update wait times', 500);
  }
}

// GET /api/sessions/[id]/wait-times - Get wait time statistics for a session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<SessionParams> }
) {
  try {
    const { id: sessionId } = await params;

    // Validate session exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return errorResponse('Session not found', 404);
    }

    // Get wait time statistics
    const waitingPlayers = await prisma.player.findMany({
      where: {
        sessionId,
        status: 'WAITING',
      },
      orderBy: [{ currentWaitTime: 'desc' }, { playerNumber: 'asc' }],
    });

    const playingPlayers = await prisma.player.findMany({
      where: {
        sessionId,
        status: 'PLAYING',
      },
      include: {
        currentCourt: {
          select: {
            courtNumber: true,
            courtName: true,
            currentMatch: {
              select: {
                startTime: true,
              },
            },
          },
        },
      },
    });

    const allPlayers = await prisma.player.findMany({
      where: { sessionId },
    });

    // Calculate statistics
    const stats = {
      totalPlayers: allPlayers.length,
      waitingPlayers: waitingPlayers.length,
      playingPlayers: playingPlayers.length,
      averageWaitTime:
        waitingPlayers.length > 0
          ? Math.round(
              waitingPlayers.reduce((sum, p) => sum + p.currentWaitTime, 0) /
                waitingPlayers.length
            )
          : 0,
      maxWaitTime:
        waitingPlayers.length > 0
          ? Math.max(...waitingPlayers.map((p) => p.currentWaitTime))
          : 0,
      minWaitTime:
        waitingPlayers.length > 0
          ? Math.min(...waitingPlayers.map((p) => p.currentWaitTime))
          : 0,
      totalWaitTime: allPlayers.reduce((sum, p) => sum + p.totalWaitTime, 0),
      averageTotalWaitTime:
        allPlayers.length > 0
          ? Math.round(
              allPlayers.reduce((sum, p) => sum + p.totalWaitTime, 0) /
                allPlayers.length
            )
          : 0,
    };

    return successResponse({
      stats,
      waitingPlayers,
      playingPlayers,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting wait time statistics:', error);
    return errorResponse('Failed to get wait time statistics', 500);
  }
}

// POST /api/sessions/[id]/wait-times/reset - Reset wait times for specific players
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<SessionParams> }
) {
  try {
    const { id: sessionId } = await params;
    const body = await request.json();
    const { playerIds, resetType = 'current' } = body;

    if (!playerIds || !Array.isArray(playerIds) || playerIds.length === 0) {
      return errorResponse('Player IDs are required', 400);
    }

    // Validate session exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return errorResponse('Session not found', 404);
    }

    // Validate players exist in the session
    const players = await prisma.player.findMany({
      where: {
        id: { in: playerIds },
        sessionId,
      },
    });

    if (players.length !== playerIds.length) {
      return errorResponse('Some players not found in session', 400);
    }

    // Reset wait times based on type
    const updateData: any = {};
    if (resetType === 'current') {
      updateData.currentWaitTime = 0;
    } else if (resetType === 'total') {
      updateData.totalWaitTime = 0;
    } else if (resetType === 'both') {
      updateData.currentWaitTime = 0;
      updateData.totalWaitTime = 0;
    }

    const result = await prisma.player.updateMany({
      where: { id: { in: playerIds } },
      data: updateData,
    });

    // Get updated players
    const updatedPlayers = await prisma.player.findMany({
      where: { id: { in: playerIds } },
      orderBy: { playerNumber: 'asc' },
    });

    return successResponse({
      updatedCount: result.count,
      players: updatedPlayers,
      resetType,
    });
  } catch (error) {
    console.error('Error resetting wait times:', error);
    return errorResponse('Failed to reset wait times', 500);
  }
}
