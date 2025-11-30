import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { UserRole, Level } from '@/lib/api/types';

interface TournamentParams {
  id: string;
}

// GET /api/tournaments/:id/players - Get all players in a tournament
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

    const players = await prisma.tournamentPlayer.findMany({
      where: { tournamentId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            registrations: true,
            pairMembers: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return successResponse(players, 'Players retrieved successfully');
  } catch (error) {
    console.error('Error fetching players:', error);
    return errorResponse('Failed to fetch players', 500);
  }
}

// POST /api/tournaments/:id/players - Create a new tournament player (HOST only)
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
      return errorResponse('Only HOST can create players', 403);
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

    const {
      name,
      email,
      phone,
      gender,
      level,
      levelDescription,
      userId,
    } = body;

    if (!name) {
      return errorResponse('Name is required', 400);
    }

    // Validate level if provided
    if (level) {
      const validLevels = Object.values(Level);
      if (!validLevels.includes(level)) {
        return errorResponse(`Invalid level: ${level}`, 400);
      }
    }

    // Validate userId if provided
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return errorResponse('User not found', 404);
      }
    }

    const player = await prisma.tournamentPlayer.create({
      data: {
        tournamentId: id,
        name,
        email,
        phone,
        gender,
        level,
        levelDescription,
        userId,
      },
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

    return successResponse(player, 'Player created successfully');
  } catch (error) {
    console.error('Error creating player:', error);
    return errorResponse('Failed to create player', 500);
  }
}

