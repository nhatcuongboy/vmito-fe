import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { UserRole } from '@/lib/api/types';

interface UmpireParams {
  id: string;
}

// PUT /api/tournament-umpires/:id - Update umpire (HOST only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<UmpireParams> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return errorResponse('Unauthorized', 401);
    }

    if (session.user.role !== UserRole.HOST) {
      return errorResponse('Only HOST can update umpires', 403);
    }

    const { id } = await params;
    const body = await request.json();

    const existingUmpire = await prisma.tournamentUmpire.findUnique({
      where: { id },
      include: {
        tournament: {
          select: {
            hostId: true,
          },
        },
      },
    });

    if (!existingUmpire) {
      return errorResponse('Umpire not found', 404);
    }

    if (existingUmpire.tournament.hostId !== session.user.id) {
      return errorResponse('You can only manage your own tournaments', 403);
    }

    const { name, email, phone, notes } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (notes !== undefined) updateData.notes = notes;

    const umpire = await prisma.tournamentUmpire.update({
      where: { id },
      data: updateData,
    });

    return successResponse(umpire, 'Umpire updated successfully');
  } catch (error) {
    console.error('Error updating umpire:', error);
    return errorResponse('Failed to update umpire', 500);
  }
}

// DELETE /api/tournament-umpires/:id - Delete umpire (HOST only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<UmpireParams> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return errorResponse('Unauthorized', 401);
    }

    if (session.user.role !== UserRole.HOST) {
      return errorResponse('Only HOST can delete umpires', 403);
    }

    const { id } = await params;

    const existingUmpire = await prisma.tournamentUmpire.findUnique({
      where: { id },
      include: {
        tournament: {
          select: {
            hostId: true,
          },
        },
      },
    });

    if (!existingUmpire) {
      return errorResponse('Umpire not found', 404);
    }

    if (existingUmpire.tournament.hostId !== session.user.id) {
      return errorResponse('You can only manage your own tournaments', 403);
    }

    await prisma.tournamentUmpire.delete({
      where: { id },
    });

    return successResponse(null, 'Umpire deleted successfully');
  } catch (error) {
    console.error('Error deleting umpire:', error);
    return errorResponse('Failed to delete umpire', 500);
  }
}

