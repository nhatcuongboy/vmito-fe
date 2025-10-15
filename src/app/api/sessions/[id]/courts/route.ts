import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';

interface SessionParams {
  id: string;
}

// GET /api/sessions/[id]/courts - Retrieve list of courts in the session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<SessionParams> }
) {
  try {
    const { id } = await params;

    // Validate session exists
    const session = await prisma.session.findUnique({
      where: { id },
    });

    if (!session) {
      return errorResponse('Session not found', 404);
    }

    // Get courts with current players
    const courts = await prisma.court.findMany({
      where: {
        sessionId: id,
      },
      orderBy: {
        courtNumber: 'asc',
      },
      include: {
        currentPlayers: {
          select: {
            id: true,
            playerNumber: true,
            name: true,
            gender: true,
            level: true,
            levelDescription: true,
            status: true,
            requireConfirmInfo: true,
          },
        },
        currentMatch: {
          select: {
            id: true,
            startTime: true,
            status: true,
          },
        },
      },
    });

    return successResponse(courts, 'Courts retrieved successfully');
  } catch (error) {
    console.error('Error fetching courts:', error);
    return errorResponse('Failed to fetch courts');
  }
}
