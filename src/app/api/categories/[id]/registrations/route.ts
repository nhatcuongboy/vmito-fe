import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { UserRole } from '@/lib/api/types';

interface CategoryParams {
  id: string;
}

// GET /api/categories/:id/registrations - Get all registrations for a category
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<CategoryParams> }
) {
  try {
    const { id } = await params;

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return errorResponse('Category not found', 404);
    }

    const registrations = await prisma.categoryRegistration.findMany({
      where: { categoryId: id },
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
      orderBy: {
        createdAt: 'asc',
      },
    });

    return successResponse(registrations, 'Registrations retrieved successfully');
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return errorResponse('Failed to fetch registrations', 500);
  }
}

// POST /api/categories/:id/registrations - Register player/pair to category (HOST only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<CategoryParams> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return errorResponse('Unauthorized', 401);
    }

    if (session.user.role !== UserRole.HOST) {
      return errorResponse('Only HOST can register players/pairs', 403);
    }

    const { id } = await params;
    const body = await request.json();

    // Check if category exists and user is the host
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        tournament: {
          select: {
            hostId: true,
          },
        },
      },
    });

    if (!category) {
      return errorResponse('Category not found', 404);
    }

    if (category.tournament.hostId !== session.user.id) {
      return errorResponse('You can only manage your own tournaments', 403);
    }

    const { tournamentPlayerId, tournamentPairId } = body;

    // Validate: must have either playerId or pairId, but not both
    if (!tournamentPlayerId && !tournamentPairId) {
      return errorResponse('Either tournamentPlayerId or tournamentPairId is required', 400);
    }

    if (tournamentPlayerId && tournamentPairId) {
      return errorResponse('Cannot provide both tournamentPlayerId and tournamentPairId', 400);
    }

    // Check category type matches
    const isSingleCategory = category.type === 'MENS_SINGLE' || category.type === 'WOMENS_SINGLE';
    const isDoubleCategory = category.type === 'MENS_DOUBLE' || category.type === 'WOMENS_DOUBLE' || category.type === 'MIXED_DOUBLE';

    if (isSingleCategory && tournamentPairId) {
      return errorResponse('Single category requires tournamentPlayerId, not tournamentPairId', 400);
    }

    if (isDoubleCategory && tournamentPlayerId) {
      return errorResponse('Double category requires tournamentPairId, not tournamentPlayerId', 400);
    }

    // Check if player/pair exists and belongs to the same tournament
    if (tournamentPlayerId) {
      const player = await prisma.tournamentPlayer.findUnique({
        where: { id: tournamentPlayerId },
      });

      if (!player) {
        return errorResponse('Tournament player not found', 404);
      }

      if (player.tournamentId !== category.tournamentId) {
        return errorResponse('Player does not belong to this tournament', 400);
      }

      // Check if already registered
      const existing = await prisma.categoryRegistration.findUnique({
        where: {
          categoryId_tournamentPlayerId: {
            categoryId: id,
            tournamentPlayerId,
          },
        },
      });

      if (existing) {
        return errorResponse('Player is already registered in this category', 400);
      }
    }

    if (tournamentPairId) {
      const pair = await prisma.tournamentPair.findUnique({
        where: { id: tournamentPairId },
      });

      if (!pair) {
        return errorResponse('Tournament pair not found', 404);
      }

      if (pair.tournamentId !== category.tournamentId) {
        return errorResponse('Pair does not belong to this tournament', 400);
      }

      // Check if already registered
      const existing = await prisma.categoryRegistration.findUnique({
        where: {
          categoryId_tournamentPairId: {
            categoryId: id,
            tournamentPairId,
          },
        },
      });

      if (existing) {
        return errorResponse('Pair is already registered in this category', 400);
      }
    }

    // Create registration
    const registration = await prisma.categoryRegistration.create({
      data: {
        categoryId: id,
        tournamentPlayerId: tournamentPlayerId || undefined,
        tournamentPairId: tournamentPairId || undefined,
      },
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
    });

    return successResponse(registration, 'Registration created successfully');
  } catch (error) {
    console.error('Error creating registration:', error);
    return errorResponse('Failed to create registration', 500);
  }
}

