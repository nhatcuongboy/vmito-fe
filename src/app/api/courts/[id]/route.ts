import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';

interface CourtParams {
  id: string;
}

// GET /api/courts/[id] - Get court details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<CourtParams> }
) {
  try {
    const { id } = await params;

    const court = await prisma.court.findUnique({
      where: { id },
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
            courtPosition: true,
          },
        },
        currentMatch: {
          select: {
            id: true,
            startTime: true,
            status: true,
          },
        },
        session: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    if (!court) {
      return errorResponse('Court not found', 404);
    }

    return successResponse(court, 'Court retrieved successfully');
  } catch (error) {
    console.error('Error fetching court:', error);
    return errorResponse('Failed to fetch court');
  }
}

// PATCH /api/courts/[id] - Update court configuration
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<CourtParams> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if court exists
    const existingCourt = await prisma.court.findUnique({
      where: { id },
      include: {
        session: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!existingCourt) {
      return errorResponse('Court not found', 404);
    }

    // Prevent updating if session is in progress or finished
    if (existingCourt.session.status !== 'PREPARING') {
      return errorResponse(
        'Cannot update court configuration when session has started or finished',
        400
      );
    }

    // Validate direction if provided
    const { courtName, direction } = body;

    if (direction && !['HORIZONTAL', 'VERTICAL'].includes(direction)) {
      return errorResponse(
        "Invalid direction. Must be 'HORIZONTAL' or 'VERTICAL'"
      );
    }

    // Update court
    const updatedCourt = await prisma.court.update({
      where: { id },
      data: {
        courtName: courtName ?? undefined,
        // direction: direction ?? undefined, // TODO: Enable after prisma client regeneration
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
            courtPosition: true,
          },
        },
        currentMatch: {
          select: {
            id: true,
            startTime: true,
            status: true,
          },
        },
      },
    });

    return successResponse(updatedCourt, 'Court updated successfully');
  } catch (error) {
    console.error('Error updating court:', error);
    return errorResponse('Failed to update court');
  }
}
