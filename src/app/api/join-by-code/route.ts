import { errorResponse, successResponse } from '@/app/lib/api-response';
import { prisma } from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/join-by-code - Create new player in session
export async function POST(request: NextRequest) {
  try {
    const { sessionCode, name, gender, level, phone } = await request.json();

    if (!sessionCode) {
      return errorResponse('Session code is required', 400);
    }

    if (!name) {
      return errorResponse('Name is required', 400);
    }

    // Find session by matching last 8 characters of sessionId with sessionCode
    const session = await prisma.session.findFirst({
      where: {
        id: {
          endsWith: sessionCode.toLowerCase(),
        },
        allowNewPlayers: true,
      },
      select: {
        id: true,
        name: true,
        status: true,
        numberOfCourts: true,
        maxPlayersPerCourt: true,
        allowNewPlayers: true,
        requirePlayerInfo: true,
      },
    });

    if (!session) {
      return errorResponse('Session not found', 404);
    }

    if (!session.allowNewPlayers) {
      return errorResponse('Session does not allow new players', 403);
    }

    // Get next player number
    const maxPlayerNumber = await prisma.player.findFirst({
      where: { sessionId: session.id },
      orderBy: { playerNumber: 'desc' },
      select: { playerNumber: true },
    });

    const nextPlayerNumber = (maxPlayerNumber?.playerNumber || 0) + 1;

    // Generate unique join code for new player
    const generateJoinCode = () => {
      return Math.random().toString(36).substring(2, 10).toUpperCase();
    };

    let newJoinCode = generateJoinCode();
    while (
      await prisma.player.findUnique({ where: { joinCode: newJoinCode } })
    ) {
      newJoinCode = generateJoinCode();
    }

    // Create new player
    const newPlayer = await prisma.player.create({
      data: {
        sessionId: session.id,
        playerNumber: nextPlayerNumber,
        joinCode: newJoinCode,
        name,
        gender,
        level,
        phone,
        preFilledByHost: false,
        confirmedByPlayer: true,
        requireConfirmInfo: false,
        isJoined: true,
        isGuest: true,
        joinedAt: new Date(),
      },
    });

    return successResponse(
      {
        player: {
          id: newPlayer.id,
          playerNumber: newPlayer.playerNumber,
          name: newPlayer.name,
          status: newPlayer.status,
          sessionId: newPlayer.sessionId,
          requireConfirmInfo: session.requirePlayerInfo,
          confirmedByPlayer: newPlayer.confirmedByPlayer,
          joinCode: newPlayer.joinCode,
        },
        session: {
          id: session.id,
          name: session.name,
          status: session.status,
          numberOfCourts: session.numberOfCourts,
          maxPlayersPerCourt: session.maxPlayersPerCourt,
        },
        message: `Successfully created as ${newPlayer.name} (Player ${newPlayer.playerNumber})`,
      },
      'Successfully created player'
    );
  } catch (error) {
    console.error('Error creating player:', error);
    return errorResponse('Failed to create player', 500);
  }
}
