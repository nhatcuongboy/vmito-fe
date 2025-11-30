import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { UserRole, MatchStatus } from '@/lib/api/types';

interface MatchParams {
  id: string;
}

// GET /api/category-matches/:id - Get match details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<MatchParams> }
) {
  try {
    const { id } = await params;

    const match = await prisma.categoryMatch.findUnique({
      where: { id },
      include: {
        category: {
          include: {
            tournament: {
              select: {
                id: true,
                name: true,
                hostId: true,
              },
            },
          },
        },
        participants: {
          include: {
            categoryRegistration: {
              include: {
                player: true,
                pair: {
                  include: {
                    members: {
                      include: {
                        player: true,
                      },
                      orderBy: {
                        position: 'asc',
                      },
                    },
                  },
                },
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

    if (!match) {
      return errorResponse('Match not found', 404);
    }

    return successResponse(match, 'Match retrieved successfully');
  } catch (error) {
    console.error('Error fetching match:', error);
    return errorResponse('Failed to fetch match', 500);
  }
}

// PUT /api/category-matches/:id - Update match (HOST only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<MatchParams> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return errorResponse('Unauthorized', 401);
    }

    if (session.user.role !== UserRole.HOST) {
      return errorResponse('Only HOST can update matches', 403);
    }

    const { id } = await params;
    const body = await request.json();

    // Check if match exists and user is the host
    const existingMatch = await prisma.categoryMatch.findUnique({
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

    if (!existingMatch) {
      return errorResponse('Match not found', 404);
    }

    if (existingMatch.category.tournament.hostId !== session.user.id) {
      return errorResponse('You can only manage your own tournaments', 403);
    }

    const {
      round,
      matchNumber,
      courtId,
      startTime,
      status,
      matchFormat,
    } = body;

    // Build update data
    const updateData: any = {};
    if (round !== undefined) updateData.round = round;
    if (matchNumber !== undefined) updateData.matchNumber = matchNumber;
    if (courtId !== undefined) {
      if (courtId) {
        const court = await prisma.tournamentCourt.findUnique({
          where: { id: courtId },
        });
        if (!court || court.tournamentId !== existingMatch.category.tournamentId) {
          return errorResponse('Court not found or does not belong to this tournament', 404);
        }
      }
      updateData.courtId = courtId;
    }
    if (startTime !== undefined) {
      updateData.startTime = startTime ? new Date(startTime) : null;
    }
    if (status !== undefined) {
      const validStatuses = Object.values(MatchStatus);
      if (!validStatuses.includes(status)) {
        return errorResponse('Invalid status', 400);
      }
      updateData.status = status;
    }
    if (matchFormat !== undefined) {
      const { MatchFormat } = await import('@/lib/api/types');
      const validFormats = Object.values(MatchFormat);
      if (!validFormats.includes(matchFormat)) {
        return errorResponse('Invalid match format', 400);
      }
      updateData.matchFormat = matchFormat;
    }

    const match = await prisma.categoryMatch.update({
      where: { id },
      data: updateData,
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

    return successResponse(match, 'Match updated successfully');
  } catch (error) {
    console.error('Error updating match:', error);
    return errorResponse('Failed to update match', 500);
  }
}

// DELETE /api/category-matches/:id - Delete match (HOST only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<MatchParams> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return errorResponse('Unauthorized', 401);
    }

    if (session.user.role !== UserRole.HOST) {
      return errorResponse('Only HOST can delete matches', 403);
    }

    const { id } = await params;

    // Check if match exists and user is the host
    const existingMatch = await prisma.categoryMatch.findUnique({
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

    if (!existingMatch) {
      return errorResponse('Match not found', 404);
    }

    if (existingMatch.category.tournament.hostId !== session.user.id) {
      return errorResponse('You can only manage your own tournaments', 403);
    }

    await prisma.categoryMatch.delete({
      where: { id },
    });

    return successResponse(null, 'Match deleted successfully');
  } catch (error) {
    console.error('Error deleting match:', error);
    return errorResponse('Failed to delete match', 500);
  }
}

