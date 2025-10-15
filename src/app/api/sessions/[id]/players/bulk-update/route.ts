import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

interface RouteParams {
  id: string;
}

// PATCH - Bulk update players
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { id: sessionId } = await params;
    const body = await request.json();
    const { players } = body;

    if (!Array.isArray(players)) {
      return NextResponse.json(
        { success: false, message: 'Players must be an array' },
        { status: 400 }
      );
    }

    // Check if session exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Session not found' },
        { status: 404 }
      );
    }

    // Update players in bulk
    const updatePromises = players.map(async (playerData: any) => {
      const { id, name, gender, level, levelDescription, requireConfirmInfo } =
        playerData;

      if (!id) {
        throw new Error('Player ID is required for updates');
      }

      // Validate that player exists in this session
      const existingPlayer = await prisma.player.findFirst({
        where: {
          id,
          sessionId: sessionId,
        },
      });

      if (!existingPlayer) {
        throw new Error(`Player with ID ${id} not found in this session`);
      }

      // Update the player
      return prisma.player.update({
        where: { id },
        data: {
          name: name?.trim() || existingPlayer.name,
          gender: gender || existingPlayer.gender,
          level: level || existingPlayer.level,
          levelDescription:
            levelDescription !== undefined
              ? levelDescription
              : existingPlayer.levelDescription,
          requireConfirmInfo:
            requireConfirmInfo !== undefined
              ? requireConfirmInfo
              : existingPlayer.requireConfirmInfo,
        },
      });
    });

    const updatedPlayers = await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      data: {
        updatedPlayers,
      },
      message: 'Players updated successfully',
    });
  } catch (error) {
    console.error('Error bulk updating players:', error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
