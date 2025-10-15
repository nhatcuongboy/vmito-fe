import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';
import { Prisma } from '@/generated/prisma';

interface CourtParams {
  id: string;
}

// POST /api/courts/[id]/pre-select - Pre-select players for next match
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<CourtParams> }
) {
  try {
    const { id: courtId } = await params;
    const body = await request.json();

    const { playersWithPosition } = body;

    // Validate input
    if (
      !playersWithPosition ||
      !Array.isArray(playersWithPosition) ||
      playersWithPosition.length !== 4
    ) {
      return errorResponse(
        'Must provide exactly 4 players with positions',
        400
      );
    }

    // Validate each player has required fields
    for (const player of playersWithPosition) {
      if (
        !player.playerId ||
        typeof player.position !== 'number' ||
        player.position < 0 ||
        player.position > 3
      ) {
        return errorResponse(
          'Each player must have playerId and position (0-3)',
          400
        );
      }
    }

    // Check if court exists and is currently in use
    const court = await prisma.court.findUnique({
      where: { id: courtId },
      include: {
        currentMatch: true,
        session: true,
      },
    });

    if (!court) {
      return errorResponse('Court not found', 404);
    }

    if (court.status !== 'IN_USE' || !court.currentMatch) {
      return errorResponse(
        'Can only pre-select for courts that are currently in use',
        400
      );
    }

    // Validate that selected players exist and are in WAITING status
    const playerIds = playersWithPosition.map((p) => p.playerId);
    const players = await prisma.player.findMany({
      where: {
        id: { in: playerIds },
        sessionId: court.sessionId,
        status: 'WAITING',
      },
    });

    if (players.length !== 4) {
      return errorResponse(
        'All selected players must exist and be in WAITING status',
        400
      );
    }

    // Update court with pre-selected players
    const updatedCourt = await prisma.court.update({
      where: { id: courtId },
      data: {
        preSelectedPlayers: playersWithPosition,
        updatedAt: new Date(),
      },
      include: {
        currentPlayers: {
          select: {
            id: true,
            playerNumber: true,
            name: true,
            gender: true,
            level: true,
            levelDescription: true,
            status: true,
            currentCourtId: true,
            courtPosition: true,
            updatedAt: true,
          },
          orderBy: {
            courtPosition: 'asc',
          },
        },
        currentMatch: {
          include: {
            players: {
              select: {
                playerId: true,
                position: true,
              },
              orderBy: {
                position: 'asc',
              },
            },
          },
        },
      },
    });

    return successResponse(updatedCourt, 'Players pre-selected successfully');
  } catch (error) {
    console.error('Error pre-selecting players:', error);
    return errorResponse('Failed to pre-select players', 500);
  }
}

// DELETE /api/courts/[id]/pre-select - Cancel pre-selection
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<CourtParams> }
) {
  try {
    const { id: courtId } = await params;

    // Check if court exists
    const court = await prisma.court.findUnique({
      where: { id: courtId },
    });

    if (!court) {
      return errorResponse('Court not found', 404);
    }

    // Clear pre-selected players
    const updatedCourt = await prisma.court.update({
      where: { id: courtId },
      data: {
        preSelectedPlayers: Prisma.DbNull,
        updatedAt: new Date(),
      },
      include: {
        currentPlayers: {
          select: {
            id: true,
            playerNumber: true,
            name: true,
            gender: true,
            level: true,
            levelDescription: true,
            status: true,
            currentCourtId: true,
            courtPosition: true,
            updatedAt: true,
          },
          orderBy: {
            courtPosition: 'asc',
          },
        },
        currentMatch: {
          include: {
            players: {
              select: {
                playerId: true,
                position: true,
              },
              orderBy: {
                position: 'asc',
              },
            },
          },
        },
      },
    });

    return successResponse(
      updatedCourt,
      'Pre-selection cancelled successfully'
    );
  } catch (error) {
    console.error('Error cancelling pre-selection:', error);
    return errorResponse('Failed to cancel pre-selection', 500);
  }
}

// GET /api/courts/[id]/pre-select - Get pre-selection info
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<CourtParams> }
) {
  try {
    const { id: courtId } = await params;

    const court = await prisma.court.findUnique({
      where: { id: courtId },
      select: {
        id: true,
        preSelectedPlayers: true,
      },
    });

    if (!court) {
      return errorResponse('Court not found', 404);
    }

    // If there are pre-selected players, fetch their full info
    let preSelectedPlayersInfo = null;
    if (court.preSelectedPlayers && Array.isArray(court.preSelectedPlayers)) {
      const playerIds = (court.preSelectedPlayers as any[]).map(
        (p) => p.playerId
      );
      const players = await prisma.player.findMany({
        where: {
          id: { in: playerIds },
        },
        select: {
          id: true,
          playerNumber: true,
          name: true,
          gender: true,
          level: true,
          levelDescription: true,
          status: true,
          currentWaitTime: true,
          totalWaitTime: true,
          matchesPlayed: true,
        },
      });

      // Map players with their positions
      preSelectedPlayersInfo = (court.preSelectedPlayers as any[]).map((p) => ({
        ...p,
        player: players.find((player) => player.id === p.playerId),
      }));
    }

    return successResponse({
      courtId: court.id,
      preSelectedPlayers: preSelectedPlayersInfo,
    });
  } catch (error) {
    console.error('Error fetching pre-selection:', error);
    return errorResponse('Failed to fetch pre-selection', 500);
  }
}
