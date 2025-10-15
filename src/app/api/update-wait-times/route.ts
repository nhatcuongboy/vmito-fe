import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';

// POST /api/update-wait-times - Update wait times for players in active sessions
export async function POST(request: NextRequest) {
  try {
    // Find all active sessions
    const activeSessions = await prisma.session.findMany({
      where: { status: 'IN_PROGRESS' },
      select: { id: true },
    });

    if (activeSessions.length === 0) {
      return successResponse({ updated: 0 }, 'No active sessions found');
    }

    const sessionIds = activeSessions.map((session) => session.id);

    // Increment currentWaitTime and totalWaitTime for all waiting and ready players in active sessions
    const result = await prisma.player.updateMany({
      where: {
        sessionId: { in: sessionIds },
        status: { in: ['WAITING', 'READY'] },
      },
      data: {
        currentWaitTime: {
          increment: 1,
        },
        totalWaitTime: {
          increment: 1,
        },
      },
    });

    return successResponse(
      {
        updated: result.count,
        sessions: sessionIds,
      },
      `Updated wait times for ${result.count} players`
    );
  } catch (error) {
    console.error('Error updating wait times:', error);
    return errorResponse('Failed to update wait times');
  }
}
