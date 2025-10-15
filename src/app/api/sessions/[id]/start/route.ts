import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';

interface SessionParams {
  id: string;
}

// POST /api/sessions/[id]/start - Start the session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<SessionParams> }
) {
  try {
    const { id } = await params;

    // Check if session exists
    const existingSession = await prisma.session.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            players: true,
          },
        },
      },
    });

    if (!existingSession) {
      return errorResponse('Session not found', 404);
    }

    // Validate session can be started
    if (existingSession.status !== 'PREPARING') {
      return errorResponse('Session has already been started or finished', 400);
    }

    if (existingSession._count.players === 0) {
      return errorResponse('Cannot start a session with no players', 400);
    }

    // Start session
    const session = await prisma.session.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        startTime: new Date(),
      },
    });

    return successResponse(session, 'Session started successfully');
  } catch (error) {
    console.error('Error starting session:', error);
    return errorResponse('Failed to start session');
  }
}
