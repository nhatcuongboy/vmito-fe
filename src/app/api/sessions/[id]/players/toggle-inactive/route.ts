import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';

interface SessionParams {
  id: string;
}

// PATCH /api/sessions/[id]/players/toggle-inactive - Toggle player status between WAITING and INACTIVE
export const PATCH = async (
  request: NextRequest,
  { params }: { params: Promise<SessionParams> }
) => {
  try {
    const { id: sessionId } = await params;
    const { playerId } = await request.json();

    if (!playerId) {
      return errorResponse('Player ID is required', 400);
    }

    const player = await prisma.player.findUnique({
      where: {
        id: playerId,
        sessionId,
      },
    });

    if (!player) {
      return errorResponse('Player not found in this session', 404);
    }

    if (player.status !== 'WAITING' && player.status !== 'INACTIVE') {
      return errorResponse(
        'Can only toggle status for players with WAITING or INACTIVE status',
        400
      );
    }

    const newStatus = player.status === 'WAITING' ? 'INACTIVE' : 'WAITING';

    const updatedPlayer = await prisma.player.update({
      where: { id: playerId },
      data: {
        status: newStatus,
        currentWaitTime: 0,
      },
    });

    return successResponse(
      updatedPlayer,
      `Player status changed to ${newStatus}`
    );
  } catch (error) {
    console.error('Error toggling player status:', error);
    return errorResponse('Failed to toggle player status');
  }
};
