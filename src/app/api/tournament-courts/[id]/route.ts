import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { UserRole } from '@/lib/api/types';

interface CourtParams {
  id: string;
}

// PUT /api/tournament-courts/:id - Update court (HOST only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<CourtParams> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return errorResponse('Unauthorized', 401);
    }

    if (session.user.role !== UserRole.HOST) {
      return errorResponse('Only HOST can update courts', 403);
    }

    const { id } = await params;
    const body = await request.json();

    const existingCourt = await prisma.tournamentCourt.findUnique({
      where: { id },
      include: {
        tournament: {
          select: {
            hostId: true,
          },
        },
      },
    });

    if (!existingCourt) {
      return errorResponse('Court not found', 404);
    }

    if (existingCourt.tournament.hostId !== session.user.id) {
      return errorResponse('You can only manage your own tournaments', 403);
    }

    const { courtNumber, courtName, notes } = body;

    const updateData: any = {};
    if (courtNumber !== undefined) {
      if (courtNumber < 1) {
        return errorResponse('Court number must be at least 1', 400);
      }
      // Check if new court number conflicts with existing court
      if (courtNumber !== existingCourt.courtNumber) {
        const conflictingCourt = await prisma.tournamentCourt.findUnique({
          where: {
            tournamentId_courtNumber: {
              tournamentId: existingCourt.tournamentId,
              courtNumber,
            },
          },
        });
        if (conflictingCourt) {
          return errorResponse('Court with this number already exists', 400);
        }
      }
      updateData.courtNumber = courtNumber;
    }
    if (courtName !== undefined) updateData.courtName = courtName;
    if (notes !== undefined) updateData.notes = notes;

    const court = await prisma.tournamentCourt.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            matches: true,
          },
        },
      },
    });

    return successResponse(court, 'Court updated successfully');
  } catch (error) {
    console.error('Error updating court:', error);
    return errorResponse('Failed to update court', 500);
  }
}

// DELETE /api/tournament-courts/:id - Delete court (HOST only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<CourtParams> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return errorResponse('Unauthorized', 401);
    }

    if (session.user.role !== UserRole.HOST) {
      return errorResponse('Only HOST can delete courts', 403);
    }

    const { id } = await params;

    const existingCourt = await prisma.tournamentCourt.findUnique({
      where: { id },
      include: {
        tournament: {
          select: {
            hostId: true,
          },
        },
        _count: {
          select: {
            matches: true,
          },
        },
      },
    });

    if (!existingCourt) {
      return errorResponse('Court not found', 404);
    }

    if (existingCourt.tournament.hostId !== session.user.id) {
      return errorResponse('You can only manage your own tournaments', 403);
    }

    // Check if court has matches
    if (existingCourt._count.matches > 0) {
      return errorResponse('Cannot delete court with existing matches', 400);
    }

    await prisma.tournamentCourt.delete({
      where: { id },
    });

    return successResponse(null, 'Court deleted successfully');
  } catch (error) {
    console.error('Error deleting court:', error);
    return errorResponse('Failed to delete court', 500);
  }
}

