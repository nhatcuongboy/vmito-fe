import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { UserRole } from '@/lib/api/types';

interface TournamentParams {
  id: string;
}

// GET /api/tournaments/:id/umpires - Get all umpires
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

    const umpires = await prisma.tournamentUmpire.findMany({
      where: { tournamentId: id },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return successResponse(umpires, 'Umpires retrieved successfully');
  } catch (error) {
    console.error('Error fetching umpires:', error);
    return errorResponse('Failed to fetch umpires', 500);
  }
}

// POST /api/tournaments/:id/umpires - Add umpire (HOST only)
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
      return errorResponse('Only HOST can add umpires', 403);
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

    const { name, email, phone, notes } = body;

    if (!name) {
      return errorResponse('Name is required', 400);
    }

    const umpire = await prisma.tournamentUmpire.create({
      data: {
        tournamentId: id,
        name,
        email,
        phone,
        notes,
      },
    });

    return successResponse(umpire, 'Umpire added successfully');
  } catch (error) {
    console.error('Error adding umpire:', error);
    return errorResponse('Failed to add umpire', 500);
  }
}

