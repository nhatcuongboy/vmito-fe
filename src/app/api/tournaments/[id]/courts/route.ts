import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { UserRole } from '@/lib/api/types';

interface TournamentParams {
  id: string;
}

// GET /api/tournaments/:id/courts - Get all courts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<TournamentParams> }
) {
  try {
    const { id } = await params;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
    });

    if (!tournament) {
      return errorResponse('Tournament not found', 404);
    }

    const courts = await prisma.tournamentCourt.findMany({
      where: { tournamentId: id },
      include: {
        _count: {
          select: {
            matches: true,
          },
        },
      },
      orderBy: {
        courtNumber: 'asc',
      },
    });

    return successResponse(courts, 'Courts retrieved successfully');
  } catch (error) {
    console.error('Error fetching courts:', error);
    return errorResponse('Failed to fetch courts', 500);
  }
}

// POST /api/tournaments/:id/courts - Add court (HOST only)
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
      return errorResponse('Only HOST can add courts', 403);
    }

    const { id } = await params;
    const body = await request.json();

    const tournament = await prisma.tournament.findUnique({
      where: { id },
    });

    if (!tournament) {
      return errorResponse('Tournament not found', 404);
    }

    if (tournament.hostId !== session.user.id) {
      return errorResponse('You can only manage your own tournaments', 403);
    }

    const { courtNumber, courtName, notes } = body;

    if (!courtNumber || courtNumber < 1) {
      return errorResponse('Valid courtNumber is required', 400);
    }

    // Check if court number already exists
    const existingCourt = await prisma.tournamentCourt.findUnique({
      where: {
        tournamentId_courtNumber: {
          tournamentId: id,
          courtNumber,
        },
      },
    });

    if (existingCourt) {
      return errorResponse('Court with this number already exists', 400);
    }

    const court = await prisma.tournamentCourt.create({
      data: {
        tournamentId: id,
        courtNumber,
        courtName,
        notes,
      },
    });

    return successResponse(court, 'Court added successfully');
  } catch (error) {
    console.error('Error adding court:', error);
    return errorResponse('Failed to add court', 500);
  }
}

