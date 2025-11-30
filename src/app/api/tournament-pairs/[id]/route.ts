import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { UserRole, CategoryType } from '@/lib/api/types';

interface PairParams {
  id: string;
}

// GET /api/tournament-pairs/:id - Get pair details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<PairParams> }
) {
  try {
    const { id } = await params;

    const pair = await prisma.tournamentPair.findUnique({
      where: { id },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            hostId: true,
          },
        },
        members: {
          include: {
            player: true,
          },
          orderBy: {
            position: 'asc',
          },
        },
        registrations: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!pair) {
      return errorResponse('Pair not found', 404);
    }

    return successResponse(pair, 'Pair retrieved successfully');
  } catch (error) {
    console.error('Error fetching pair:', error);
    return errorResponse('Failed to fetch pair', 500);
  }
}

// PUT /api/tournament-pairs/:id - Update pair (HOST only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<PairParams> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return errorResponse('Unauthorized', 401);
    }

    if (session.user.role !== UserRole.HOST) {
      return errorResponse('Only HOST can update pairs', 403);
    }

    const { id } = await params;
    const body = await request.json();

    // Check if pair exists and user is the host
    const existingPair = await prisma.tournamentPair.findUnique({
      where: { id },
      include: {
        tournament: {
          select: {
            hostId: true,
          },
        },
      },
    });

    if (!existingPair) {
      return errorResponse('Pair not found', 404);
    }

    if (existingPair.tournament.hostId !== session.user.id) {
      return errorResponse('You can only manage your own tournaments', 403);
    }

    const { name, type, notes } = body;

    // Validate type if provided
    if (type && !Object.values(CategoryType).includes(type)) {
      return errorResponse('Invalid pair type', 400);
    }

    // Build update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (notes !== undefined) updateData.notes = notes;

    const pair = await prisma.tournamentPair.update({
      where: { id },
      data: updateData,
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
    });

    return successResponse(pair, 'Pair updated successfully');
  } catch (error) {
    console.error('Error updating pair:', error);
    return errorResponse('Failed to update pair', 500);
  }
}

// DELETE /api/tournament-pairs/:id - Delete pair (HOST only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<PairParams> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return errorResponse('Unauthorized', 401);
    }

    if (session.user.role !== UserRole.HOST) {
      return errorResponse('Only HOST can delete pairs', 403);
    }

    const { id } = await params;

    // Check if pair exists and user is the host
    const existingPair = await prisma.tournamentPair.findUnique({
      where: { id },
      include: {
        tournament: {
          select: {
            hostId: true,
          },
        },
      },
    });

    if (!existingPair) {
      return errorResponse('Pair not found', 404);
    }

    if (existingPair.tournament.hostId !== session.user.id) {
      return errorResponse('You can only manage your own tournaments', 403);
    }

    await prisma.tournamentPair.delete({
      where: { id },
    });

    return successResponse(null, 'Pair deleted successfully');
  } catch (error) {
    console.error('Error deleting pair:', error);
    return errorResponse('Failed to delete pair', 500);
  }
}

