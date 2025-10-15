import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';

interface PlayerParams {
  id: string;
}

// GET /api/players/[id] - Retrieve detailed player information
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<PlayerParams> }
) {
  try {
    const { id } = await params;

    const player = await prisma.player.findUnique({
      where: { id },
      include: {
        session: {
          select: {
            id: true,
            name: true,
            status: true,
            requirePlayerInfo: true,
          },
        },
        currentCourt: {
          select: {
            id: true,
            courtNumber: true,
            courtName: true,
          },
        },
        matchPlayers: {
          select: {
            match: {
              select: {
                id: true,
                startTime: true,
                endTime: true,
                status: true,
                courtId: true,
              },
            },
          },
          orderBy: {
            match: {
              startTime: 'desc',
            },
          },
          take: 5, // Get only the most recent 5 matches
        },
      },
    });

    if (!player) {
      return errorResponse('Player not found', 404);
    }

    return successResponse(player, 'Player retrieved successfully');
  } catch (error) {
    console.error('Error fetching player:', error);
    return errorResponse('Failed to fetch player');
  }
}

// PUT /api/players/[id] - Update player information
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<PlayerParams> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if player exists
    const existingPlayer = await prisma.player.findUnique({
      where: { id },
      include: {
        session: true,
      },
    });

    if (!existingPlayer) {
      return errorResponse('Player not found', 404);
    }

    // Validate data based on session's requirePlayerInfo setting
    const { name, gender, level, phone, confirmedByPlayer } = body;

    if (confirmedByPlayer && existingPlayer.session.requirePlayerInfo) {
      if (!name || !gender || !level) {
        return errorResponse(
          'Name, gender, and level are required for this session',
          400
        );
      }
    }

    // Update player
    const player = await prisma.player.update({
      where: { id },
      data: {
        name: name ?? undefined,
        gender: gender ?? undefined,
        level: level ?? undefined,
        phone: phone ?? undefined,
        confirmedByPlayer: confirmedByPlayer ?? undefined,
        preFilledByHost: body.preFilledByHost ?? undefined,
      },
    });

    return successResponse(player, 'Player updated successfully');
  } catch (error) {
    console.error('Error updating player:', error);
    return errorResponse('Failed to update player');
  }
}

// DELETE /api/players/[id] - Delete player
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<PlayerParams> }
) {
  try {
    const { id } = await params;

    // Check if player exists
    const existingPlayer = await prisma.player.findUnique({
      where: { id },
      include: {
        session: true,
      },
    });

    if (!existingPlayer) {
      return errorResponse('Player not found', 404);
    }

    // Prevent deletion if player is currently playing
    if (existingPlayer.status === 'PLAYING') {
      return errorResponse(
        'Cannot delete a player who is currently playing',
        400
      );
    }

    // Delete player
    await prisma.player.delete({
      where: { id },
    });

    return successResponse(null, 'Player deleted successfully');
  } catch (error) {
    console.error('Error deleting player:', error);
    return errorResponse('Failed to delete player');
  }
}
