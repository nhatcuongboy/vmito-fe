import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';
import { generatePlayerJoinCode } from '@/utils/session-join-helpers';

interface SessionParams {
  id: string;
}

// GET /api/sessions/[id]/players - Retrieve list of players in the session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<SessionParams> }
) {
  try {
    const { id } = await params;

    // Validate session exists
    const session = await prisma.session.findUnique({
      where: { id },
    });

    if (!session) {
      return errorResponse('Session not found', 404);
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const orderBy = searchParams.get('orderBy') || 'currentWaitTime';
    const orderDir = searchParams.get('orderDir') || 'desc';

    // Build query
    const queryOptions: any = {
      where: {
        sessionId: id,
      },
      orderBy: {},
      include: {
        currentCourt: {
          select: {
            id: true,
            courtNumber: true,
            courtName: true,
          },
        },
      },
    };

    // Add status filter if provided
    if (status) {
      queryOptions.where.status = status;
    }

    // Add ordering
    if (orderBy === 'playerNumber') {
      queryOptions.orderBy.playerNumber = orderDir;
    } else if (orderBy === 'currentWaitTime') {
      queryOptions.orderBy.currentWaitTime = orderDir;
    } else if (orderBy === 'totalWaitTime') {
      queryOptions.orderBy.totalWaitTime = orderDir;
    } else if (orderBy === 'matchesPlayed') {
      queryOptions.orderBy.matchesPlayed = orderDir;
    }

    const players = await prisma.player.findMany(queryOptions);

    return successResponse(players, 'Players retrieved successfully');
  } catch (error) {
    console.error('Error fetching players:', error);
    return errorResponse('Failed to fetch players');
  }
}

// POST /api/sessions/[id]/players - Create a new player in the session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<SessionParams> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate session exists and get requiredLevels
    const session = await prisma.session.findUnique({
      where: { id },
      select: {
        id: true,
        requiredLevels: true,
      },
    });

    if (!session) {
      return errorResponse('Session not found', 404);
    }

    // Determine if it's host creating a player or player self-registering
    const {
      playerNumber,
      name,
      gender,
      level,
      levelDescription,
      phone,
      userId,
      preFilledByHost,
      confirmedByPlayer,
      requireConfirmInfo,
    } = body;

    /**
     * Validate player level against session requiredLevels
     * - If session has requiredLevels (non-empty array):
     *   1. Player must have a level set
     *   2. Player's level must be in the requiredLevels list
     * - If requiredLevels is empty or undefined, all levels are allowed
     */
    if (session.requiredLevels && session.requiredLevels.length > 0) {
      // Player must have a level if session requires one
      if (!level) {
        return errorResponse(
          `This session requires players to have one of these levels: ${session.requiredLevels.join(', ')}. Please provide your level.`,
          400
        );
      }
      // Player's level must match one of the required levels
      if (!session.requiredLevels.includes(level)) {
        return errorResponse(
          `Your level (${level}) is not allowed in this session. Required levels: ${session.requiredLevels.join(', ')}`,
          400
        );
      }
    }

    // Validate player number
    if (!playerNumber) {
      return errorResponse('Player number is required', 400);
    }

    // Check if player number already exists in this session
    const existingPlayer = await prisma.player.findFirst({
      where: {
        sessionId: id,
        playerNumber: parseInt(playerNumber),
      },
    });

    if (existingPlayer) {
      return errorResponse('Player number already exists in this session', 400);
    }

    // Create player
    const player = await prisma.player.create({
      data: {
        sessionId: id,
        playerNumber: parseInt(playerNumber),
        name: name || null,
        gender: gender || null,
        level: level || null,
        levelDescription: levelDescription || null,
        phone: phone || null,
        userId: userId || null,
        joinCode: generatePlayerJoinCode(),
        preFilledByHost: preFilledByHost || false,
        confirmedByPlayer: confirmedByPlayer || false,
        requireConfirmInfo: requireConfirmInfo || false,
        status: 'WAITING',
      },
    });

    return successResponse(player, 'Player created successfully');
  } catch (error) {
    console.error('Error creating player:', error);
    return errorResponse('Failed to create player');
  }
}
