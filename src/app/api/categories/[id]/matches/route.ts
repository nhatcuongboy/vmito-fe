import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { UserRole } from '@/lib/api/types';

interface CategoryParams {
  id: string;
}

// GET /api/categories/:id/matches - Get all matches in a category
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

    const matches = await prisma.categoryMatch.findMany({
      where: { categoryId: id },
      include: {
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
      orderBy: [
        { groupId: 'asc' },
        { matchNumber: 'asc' },
      ],
    });

    return successResponse(matches, 'Matches retrieved successfully');
  } catch (error) {
    console.error('Error fetching matches:', error);
    return errorResponse('Failed to fetch matches', 500);
  }
}

// POST /api/categories/:id/matches - Create a new match (HOST only)
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
      return errorResponse('Only HOST can create matches', 403);
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

    const {
      groupId,
      round,
      matchNumber,
      participants,
      courtId,
      startTime,
      matchFormat,
    } = body;

    if (!round || !matchNumber || !participants) {
      return errorResponse('Round, matchNumber, and participants are required', 400);
    }

    if (!Array.isArray(participants) || participants.length < 2) {
      return errorResponse('At least 2 participants are required', 400);
    }

    // Validate participants
    const registrationIds = participants.map((p: any) => p.categoryRegistrationId);
    const registrations = await prisma.categoryRegistration.findMany({
      where: {
        id: { in: registrationIds },
        categoryId: id,
      },
    });

    if (registrations.length !== registrationIds.length) {
      return errorResponse('One or more registrations not found or do not belong to this category', 404);
    }

    // Validate groupId if provided
    if (groupId) {
      const group = await prisma.categoryGroup.findUnique({
        where: { id: groupId },
      });

      if (!group || group.categoryId !== id) {
        return errorResponse('Group not found or does not belong to this category', 404);
      }
    }

    // Validate courtId if provided
    if (courtId) {
      const court = await prisma.tournamentCourt.findUnique({
        where: { id: courtId },
      });

      if (!court || court.tournamentId !== category.tournamentId) {
        return errorResponse('Court not found or does not belong to this tournament', 404);
      }
    }

    // Check for duplicate match number in same round/group
    const existingMatch = await prisma.categoryMatch.findFirst({
      where: {
        categoryId: id,
        groupId: groupId || null,
        round,
        matchNumber,
      },
    });

    if (existingMatch) {
      return errorResponse('Match with this number already exists in this round/group', 400);
    }

    // Create match with participants
    const match = await prisma.categoryMatch.create({
      data: {
        categoryId: id,
        groupId: groupId || null,
        round,
        matchNumber,
        courtId: courtId || null,
        startTime: startTime ? new Date(startTime) : null,
        matchFormat: matchFormat || category.matchFormat, // Use provided matchFormat or fallback to category default
        status: 'SCHEDULED',
        participants: {
          create: participants.map((p: any) => ({
            categoryRegistrationId: p.categoryRegistrationId,
            position: p.position,
          })),
        },
      },
      include: {
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

    return successResponse(match, 'Match created successfully');
  } catch (error) {
    console.error('Error creating match:', error);
    return errorResponse('Failed to create match', 500);
  }
}

