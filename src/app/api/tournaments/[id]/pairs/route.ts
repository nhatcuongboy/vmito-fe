import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { UserRole, CategoryType } from '@/lib/api/types';

interface TournamentParams {
  id: string;
}

// GET /api/tournaments/:id/pairs - Get all pairs in a tournament
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<TournamentParams> }
) {
  try {
    const { id } = await params;

    // Check if tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id },
    });

    if (!tournament) {
      return errorResponse('Tournament not found', 404);
    }

    const pairs = await prisma.tournamentPair.findMany({
      where: { tournamentId: id },
      include: {
        members: {
          include: {
            player: true,
          },
          orderBy: {
            position: 'asc',
          },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return successResponse(pairs, 'Pairs retrieved successfully');
  } catch (error) {
    console.error('Error fetching pairs:', error);
    return errorResponse('Failed to fetch pairs', 500);
  }
}

// POST /api/tournaments/:id/pairs - Create a new tournament pair (HOST only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<TournamentParams> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return errorResponse('Unauthorized', 401);
    }

    if (session.user.role !== UserRole.HOST) {
      return errorResponse('Only HOST can create pairs', 403);
    }

    const { id } = await params;
    const body = await request.json();

    // Check if tournament exists and user is the host
    const tournament = await prisma.tournament.findUnique({
      where: { id },
    });

    if (!tournament) {
      return errorResponse('Tournament not found', 404);
    }

    if (tournament.hostId !== session.user.id) {
      return errorResponse('You can only manage your own tournaments', 403);
    }

    const { name, playerIds, type, notes } = body;

    if (!playerIds || !Array.isArray(playerIds) || playerIds.length !== 2) {
      return errorResponse('Exactly 2 player IDs are required', 400);
    }

    // Validate type if provided
    if (type && !Object.values(CategoryType).includes(type)) {
      return errorResponse('Invalid pair type', 400);
    }

    // Check if players exist and belong to the same tournament
    const players = await prisma.tournamentPlayer.findMany({
      where: {
        id: { in: playerIds },
        tournamentId: id,
      },
    });

    if (players.length !== 2) {
      return errorResponse('One or more players not found or do not belong to this tournament', 404);
    }

    // Check if players are already in a pair together
    const existingPair = await prisma.tournamentPair.findFirst({
      where: {
        tournamentId: id,
        members: {
          every: {
            playerId: { in: playerIds },
          },
        },
      },
      include: {
        members: true,
      },
    });

    if (existingPair && existingPair.members.length === 2) {
      return errorResponse('These players are already paired together', 400);
    }

    // Create pair with members
    const pair = await prisma.tournamentPair.create({
      data: {
        tournamentId: id,
        name,
        type: type || undefined,
        notes,
        members: {
          create: [
            { playerId: playerIds[0], position: 1 },
            { playerId: playerIds[1], position: 2 },
          ],
        },
      },
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

    return successResponse(pair, 'Pair created successfully');
  } catch (error) {
    console.error('Error creating pair:', error);
    return errorResponse('Failed to create pair', 500);
  }
}

