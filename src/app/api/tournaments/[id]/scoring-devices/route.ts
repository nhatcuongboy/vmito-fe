import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { UserRole } from '@/lib/api/types';

interface TournamentParams {
  id: string;
}

// GET /api/tournaments/:id/scoring-devices - Get all scoring devices
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

    const devices = await prisma.tournamentScoringDevice.findMany({
      where: { tournamentId: id },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return successResponse(devices, 'Scoring devices retrieved successfully');
  } catch (error) {
    console.error('Error fetching scoring devices:', error);
    return errorResponse('Failed to fetch scoring devices', 500);
  }
}

// POST /api/tournaments/:id/scoring-devices - Add scoring device (HOST only)
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
      return errorResponse('Only HOST can add scoring devices', 403);
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

    const { name, deviceType, deviceId, notes } = body;

    if (!name) {
      return errorResponse('Name is required', 400);
    }

    const device = await prisma.tournamentScoringDevice.create({
      data: {
        tournamentId: id,
        name,
        deviceType,
        deviceId,
        notes,
      },
    });

    return successResponse(device, 'Scoring device added successfully');
  } catch (error) {
    console.error('Error adding scoring device:', error);
    return errorResponse('Failed to add scoring device', 500);
  }
}

