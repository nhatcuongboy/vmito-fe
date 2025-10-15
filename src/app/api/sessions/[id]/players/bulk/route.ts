import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';
import { generatePlayerJoinCode } from '@/utils/session-join-helpers';

interface SessionParams {
  id: string;
}

interface BulkPlayerData {
  playerNumber: number;
  name?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  level?:
    | 'Y_MINUS'
    | 'Y'
    | 'Y_PLUS'
    | 'TBY'
    | 'TB_MINUS'
    | 'TB'
    | 'TB_PLUS'
    | 'K';
  levelDescription?: string;
  phone?: string;
  requireConfirmInfo?: boolean;
}

// POST /api/sessions/[id]/players/bulk - Create multiple players in bulk
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<SessionParams> }
) {
  let body: any;
  let sessionId: string = '';

  try {
    const resolvedParams = await params;
    sessionId = resolvedParams.id;
    body = await request.json();

    console.log('Bulk players request:', {
      sessionId,
      bodyType: typeof body,
      isArray: Array.isArray(body),
      playersCount: Array.isArray(body) ? body.length : 'Not an array',
    });

    if (!Array.isArray(body)) {
      return errorResponse('Body must be an array of player data', 400);
    }

    const playersData: BulkPlayerData[] = body;

    // Validate session exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        players: true,
      },
    });

    if (!session) {
      console.log('Session not found:', sessionId);
      return errorResponse('Session does not exist', 404);
    }

    console.log('Session found:', {
      id: session.id,
      numberOfCourts: session.numberOfCourts,
      maxPlayersPerCourt: session.maxPlayersPerCourt,
      existingPlayersCount: session.players.length,
    });

    // Calculate max players allowed
    const maxPlayers = session.numberOfCourts * session.maxPlayersPerCourt;

    // Validate player data
    const errors: string[] = [];
    const playerNumbers = new Set<number>();

    for (const [index, playerData] of playersData.entries()) {
      // Validate required fields
      if (
        !playerData.playerNumber ||
        typeof playerData.playerNumber !== 'number'
      ) {
        errors.push(
          `Player ${index + 1}: playerNumber is required and must be a number`
        );
        continue;
      }

      // Validate playerNumber range
      // if (playerData.playerNumber < 1 || playerData.playerNumber > maxPlayers) {
      //   errors.push(
      //     `Player ${
      //       index + 1
      //     }: playerNumber must be between 1 and ${maxPlayers}`
      //   );
      //   continue;
      // }

      // Check for duplicate playerNumber in request
      if (playerNumbers.has(playerData.playerNumber)) {
        errors.push(
          `Player ${index + 1}: playerNumber ${
            playerData.playerNumber
          } already exists in the request`
        );
        continue;
      }
      playerNumbers.add(playerData.playerNumber);

      // Validate gender
      if (
        playerData.gender &&
        !['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'].includes(
          playerData.gender
        )
      ) {
        errors.push(
          `Player ${
            index + 1
          }: gender must be MALE, FEMALE, OTHER, or PREFER_NOT_TO_SAY`
        );
      }

      // Validate level
      if (
        playerData.level &&
        ![
          'Y_MINUS',
          'Y',
          'Y_PLUS',
          'TBY',
          'TB_MINUS',
          'TB',
          'TB_PLUS',
          'K',
        ].includes(playerData.level)
      ) {
        errors.push(`Player ${index + 1}: level is not valid`);
      }

      // Validate phone format (optional)
      if (playerData.phone && typeof playerData.phone !== 'string') {
        errors.push(`Player ${index + 1}: phone must be a string`);
      }
    }

    if (errors.length > 0) {
      console.log('Validation errors:', errors);
      return errorResponse(`Invalid data: ${errors.join(', ')}`, 400);
    }

    console.log('Validation passed, checking for existing players...');

    // Check for existing players with same playerNumber
    const existingPlayers = await prisma.player.findMany({
      where: {
        sessionId,
        playerNumber: {
          in: Array.from(playerNumbers),
        },
      },
    });

    console.log('Existing players check:', {
      requestedNumbers: Array.from(playerNumbers),
      existingPlayers: existingPlayers.map((p) => ({
        id: p.id,
        playerNumber: p.playerNumber,
      })),
    });

    if (existingPlayers.length > 0) {
      const conflictNumbers = existingPlayers
        .map((p: any) => p.playerNumber)
        .join(', ');
      console.log('Player number conflicts:', conflictNumbers);
      return errorResponse(
        `The following playerNumbers already exist: ${conflictNumbers}`,
        409
      );
    }

    console.log('No conflicts found, creating players...');

    // Create players in bulk
    const createPromises = playersData.map((playerData, index) => {
      console.log(`Creating player ${index + 1}:`, playerData);
      return prisma.player.create({
        data: {
          sessionId,
          playerNumber: playerData.playerNumber,
          name: playerData.name || null,
          gender: playerData.gender || null,
          level: playerData.level || null,
          levelDescription: playerData.levelDescription || null,
          phone: playerData.phone || null,
          joinCode: generatePlayerJoinCode(),
          preFilledByHost: true, // Marked as pre-filled by host
          confirmedByPlayer: false, // Player has not confirmed
          requireConfirmInfo: playerData.requireConfirmInfo || false,
          status: 'WAITING',
        },
      });
    });

    console.log('Executing bulk create...');
    const createdPlayers = await Promise.all(createPromises);
    console.log('Players created successfully:', createdPlayers.length);

    // Get updated session with all players
    const updatedSession = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        players: {
          orderBy: { playerNumber: 'asc' },
        },
        host: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return successResponse({
      createdPlayers,
      session: updatedSession,
      message: `Successfully created ${createdPlayers.length} player(s)`,
    });
  } catch (error) {
    console.error('Error creating bulk players:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      sessionId: typeof sessionId !== 'undefined' ? sessionId : 'undefined',
      playersCount:
        typeof body !== 'undefined' && Array.isArray(body)
          ? body.length
          : 'Not an array or undefined',
    });
    return errorResponse('An error occurred while creating players', 500);
  }
}

// GET /api/sessions/[id]/players/bulk - Retrieve information about bulk player creation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<SessionParams> }
) {
  try {
    const { id: sessionId } = await params;

    // Get session info
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        players: {
          orderBy: { playerNumber: 'asc' },
        },
      },
    });

    if (!session) {
      return errorResponse('Session không tồn tại', 404);
    }

    const maxPlayers = session.numberOfCourts * session.maxPlayersPerCourt;
    const existingPlayerNumbers = session.players.map(
      (p: any) => p.playerNumber
    );
    const availablePlayerNumbers = [];

    // Find available player numbers
    for (let i = 1; i <= maxPlayers; i++) {
      if (!existingPlayerNumbers.includes(i)) {
        availablePlayerNumbers.push(i);
      }
    }

    return successResponse({
      sessionId,
      sessionName: session.name,
      maxPlayers,
      currentPlayersCount: session.players.length,
      availableSlots: availablePlayerNumbers.length,
      availablePlayerNumbers,
      existingPlayerNumbers,
    });
  } catch (error) {
    console.error('Error getting bulk players info:', error);
    return errorResponse('An error occurred while retrieving information', 500);
  }
}
