import { NextRequest } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';

// GET /api/player-status?token=guest_token - Get player status by guest token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const guestToken = searchParams.get('token');

    if (!guestToken) {
      return errorResponse('Guest token is required', 400);
    }

    // Find player by guest token (stored in localStorage from join)
    // We'll use a different approach - extract sessionId and playerNumber from token
    const tokenParts = guestToken.split('_');
    if (tokenParts.length < 4 || tokenParts[0] !== 'guest') {
      return errorResponse('Invalid guest token format', 400);
    }

    const sessionId = tokenParts[1];
    const playerNumber = parseInt(tokenParts[2]);

    if (!sessionId || isNaN(playerNumber)) {
      return errorResponse('Invalid guest token', 400);
    }

    // Get player status
    const player = await prisma.player.findUnique({
      where: {
        sessionId_playerNumber: {
          sessionId,
          playerNumber,
        },
      },
      include: {
        session: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        currentCourt: {
          select: {
            id: true,
            courtNumber: true,
            courtName: true,
          },
        },
      },
    });

    if (!player) {
      return errorResponse('Player not found', 404);
    }

    if (!player.isJoined) {
      return errorResponse('Player slot not filled yet', 400);
    }

    // Format response
    const playerStatus = {
      id: player.id,
      playerNumber: player.playerNumber,
      name: player.name,
      status: player.status,
      currentWaitTime: player.currentWaitTime,
      totalWaitTime: player.totalWaitTime,
      matchesPlayed: player.matchesPlayed,
      currentCourtId: player.currentCourt?.courtNumber,
      courtName: player.currentCourt?.courtName,
      session: player.session,
      joinedAt: player.joinedAt,
    };

    return successResponse(
      playerStatus,
      'Player status retrieved successfully'
    );
  } catch (error) {
    console.error('Error getting player status:', error);
    return errorResponse('Failed to get player status', 500);
  }
}
