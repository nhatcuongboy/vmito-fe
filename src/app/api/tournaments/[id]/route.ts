import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { UserRole } from '@/lib/api/types';

interface TournamentParams {
  id: string;
}

// GET /api/tournaments/:id - Get tournament details (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<TournamentParams> }
) {
  try {
    const { id } = await params;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        categories: {
          include: {
            _count: {
              select: {
                registrations: true,
                matches: true,
                groups: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        umpires: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        scoringDevices: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        courts: {
          orderBy: {
            courtNumber: 'asc',
          },
        },
        _count: {
          select: {
            players: true,
            pairs: true,
            categories: true,
          },
        },
      },
    });

    if (!tournament) {
      return errorResponse('Tournament not found', 404);
    }

    return successResponse(tournament, 'Tournament retrieved successfully');
  } catch (error) {
    console.error('Error fetching tournament:', error);
    return errorResponse('Failed to fetch tournament', 500);
  }
}

// PUT /api/tournaments/:id - Update tournament (HOST only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<TournamentParams> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return errorResponse('Unauthorized', 401);
    }

    if (session.user.role !== UserRole.HOST) {
      return errorResponse('Only HOST can update tournaments', 403);
    }

    const { id } = await params;
    const body = await request.json();

    // Check if tournament exists and user is the host
    const existingTournament = await prisma.tournament.findUnique({
      where: { id },
    });

    if (!existingTournament) {
      return errorResponse('Tournament not found', 404);
    }

    if (existingTournament.hostId !== session.user.id) {
      return errorResponse('You can only update your own tournaments', 403);
    }

    const { name, startDate, endDate, status } = body;

    // Build update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (startDate !== undefined) {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        return errorResponse('Invalid startDate format', 400);
      }
      updateData.startDate = start;
    }
    if (endDate !== undefined) {
      const end = new Date(endDate);
      if (isNaN(end.getTime())) {
        return errorResponse('Invalid endDate format', 400);
      }
      updateData.endDate = end;
    }
    if (status !== undefined) {
      const validStatuses = ['PREPARING', 'IN_PROGRESS', 'FINISHED', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        return errorResponse('Invalid status', 400);
      }
      updateData.status = status;
    }

    // Validate date range if both dates are provided
    if (updateData.startDate && updateData.endDate) {
      if (updateData.startDate >= updateData.endDate) {
        return errorResponse('End date must be after start date', 400);
      }
    } else if (updateData.startDate && existingTournament.endDate) {
      if (updateData.startDate >= existingTournament.endDate) {
        return errorResponse('End date must be after start date', 400);
      }
    } else if (updateData.endDate && existingTournament.startDate) {
      if (existingTournament.startDate >= updateData.endDate) {
        return errorResponse('End date must be after start date', 400);
      }
    }

    const tournament = await prisma.tournament.update({
      where: { id },
      data: updateData,
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
            players: true,
            pairs: true,
            categories: true,
          },
        },
      },
    });

    return successResponse(tournament, 'Tournament updated successfully');
  } catch (error) {
    console.error('Error updating tournament:', error);
    return errorResponse('Failed to update tournament', 500);
  }
}

// DELETE /api/tournaments/:id - Delete tournament (HOST only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<TournamentParams> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return errorResponse('Unauthorized', 401);
    }

    if (session.user.role !== UserRole.HOST) {
      return errorResponse('Only HOST can delete tournaments', 403);
    }

    const { id } = await params;

    // Check if tournament exists and user is the host
    const existingTournament = await prisma.tournament.findUnique({
      where: { id },
    });

    if (!existingTournament) {
      return errorResponse('Tournament not found', 404);
    }

    if (existingTournament.hostId !== session.user.id) {
      return errorResponse('You can only delete your own tournaments', 403);
    }

    await prisma.tournament.delete({
      where: { id },
    });

    return successResponse(null, 'Tournament deleted successfully');
  } catch (error) {
    console.error('Error deleting tournament:', error);
    return errorResponse('Failed to delete tournament', 500);
  }
}

