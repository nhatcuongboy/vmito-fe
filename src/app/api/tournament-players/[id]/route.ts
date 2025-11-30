import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { UserRole, Level } from '@/lib/api/types';

interface PlayerParams {
  id: string;
}

// GET /api/tournament-players/:id - Get player details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<PlayerParams> }
) {
  try {
    const { id } = await params;

    const player = await prisma.tournamentPlayer.findUnique({
      where: { id },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            hostId: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
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
        pairMembers: {
          include: {
            pair: {
              include: {
                members: {
                  include: {
                    player: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!player) {
      return errorResponse('Player not found', 404);
    }

    return successResponse(player, 'Player retrieved successfully');
  } catch (error) {
    console.error('Error fetching player:', error);
    return errorResponse('Failed to fetch player', 500);
  }
}

// PUT /api/tournament-players/:id - Update player (HOST only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<PlayerParams> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return errorResponse('Unauthorized', 401);
    }

    if (session.user.role !== UserRole.HOST) {
      return errorResponse('Only HOST can update players', 403);
    }

    const { id } = await params;
    const body = await request.json();

    // Check if player exists and user is the host
    const existingPlayer = await prisma.tournamentPlayer.findUnique({
      where: { id },
      include: {
        tournament: {
          select: {
            hostId: true,
          },
        },
      },
    });

    if (!existingPlayer) {
      return errorResponse('Player not found', 404);
    }

    if (existingPlayer.tournament.hostId !== session.user.id) {
      return errorResponse('You can only manage your own tournaments', 403);
    }

    const {
      name,
      email,
      phone,
      gender,
      level,
      levelDescription,
      userId,
    } = body;

    // Build update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (gender !== undefined) updateData.gender = gender;
    if (level !== undefined) {
      const validLevels = Object.values(Level);
      if (!validLevels.includes(level)) {
        return errorResponse(`Invalid level: ${level}`, 400);
      }
      updateData.level = level;
    }
    if (levelDescription !== undefined) updateData.levelDescription = levelDescription;
    if (userId !== undefined) {
      if (userId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });
        if (!user) {
          return errorResponse('User not found', 404);
        }
      }
      updateData.userId = userId;
    }

    const player = await prisma.tournamentPlayer.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return successResponse(player, 'Player updated successfully');
  } catch (error) {
    console.error('Error updating player:', error);
    return errorResponse('Failed to update player', 500);
  }
}

// DELETE /api/tournament-players/:id - Delete player (HOST only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<PlayerParams> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return errorResponse('Unauthorized', 401);
    }

    if (session.user.role !== UserRole.HOST) {
      return errorResponse('Only HOST can delete players', 403);
    }

    const { id } = await params;

    // Check if player exists and user is the host
    const existingPlayer = await prisma.tournamentPlayer.findUnique({
      where: { id },
      include: {
        tournament: {
          select: {
            hostId: true,
          },
        },
      },
    });

    if (!existingPlayer) {
      return errorResponse('Player not found', 404);
    }

    if (existingPlayer.tournament.hostId !== session.user.id) {
      return errorResponse('You can only manage your own tournaments', 403);
    }

    await prisma.tournamentPlayer.delete({
      where: { id },
    });

    return successResponse(null, 'Player deleted successfully');
  } catch (error) {
    console.error('Error deleting player:', error);
    return errorResponse('Failed to delete player', 500);
  }
}

