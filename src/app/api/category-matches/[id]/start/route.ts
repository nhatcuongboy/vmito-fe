import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { UserRole } from '@/lib/api/types';

interface MatchParams {
  id: string;
}

// POST /api/category-matches/:id/start - Start a match (HOST only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<MatchParams> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return errorResponse('Unauthorized', 401);
    }

    if (session.user.role !== UserRole.HOST) {
      return errorResponse('Only HOST can start matches', 403);
    }

    const { id } = await params;

    // Check if match exists and user is the host
    const match = await prisma.categoryMatch.findUnique({
      where: { id },
      include: {
        category: {
          include: {
            tournament: {
              select: {
                hostId: true,
              },
            },
          },
        },
      },
    });

    if (!match) {
      return errorResponse('Match not found', 404);
    }

    if (match.category.tournament.hostId !== session.user.id) {
      return errorResponse('You can only manage your own tournaments', 403);
    }

    if (match.status === 'IN_PROGRESS') {
      return errorResponse('Match is already in progress', 400);
    }

    if (match.status === 'FINISHED') {
      return errorResponse('Match is already finished', 400);
    }

    if (match.status === 'CANCELLED') {
      return errorResponse('Match is cancelled', 400);
    }

    // Update match status
    const updatedMatch = await prisma.categoryMatch.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        startTime: new Date(),
      },
      include: {
        participants: {
          include: {
            categoryRegistration: {
              include: {
                player: true,
                pair: true,
              },
            },
          },
          orderBy: {
            position: 'asc',
          },
        },
        court: true,
        group: {
          select: {
            id: true,
            groupNumber: true,
            name: true,
          },
        },
      },
    });

    return successResponse(updatedMatch, 'Match started successfully');
  } catch (error) {
    console.error('Error starting match:', error);
    return errorResponse('Failed to start match', 500);
  }
}

