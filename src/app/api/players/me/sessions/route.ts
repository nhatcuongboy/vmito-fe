import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

// GET /api/players/me/sessions - Get all sessions that the current user has participated in
export async function GET(_: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return errorResponse('Unauthorized', 401);
    }

    // Find all sessions that the current user has participated in
    const sessions = await prisma.session.findMany({
      where: {
        players: {
          some: {
            userId: session.user.id,
            isJoined: true, // Only get sessions where user actually joined
          },
        },
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            players: {
              where: {
                isJoined: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return successResponse(sessions);
  } catch (error) {
    console.error('Error fetching player sessions:', error);
    return errorResponse('Failed to fetch sessions', 500);
  }
}
