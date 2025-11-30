import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { UserRole } from '@/lib/api/types';

interface DeviceParams {
  id: string;
}

// PUT /api/tournament-scoring-devices/:id - Update scoring device (HOST only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<DeviceParams> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return errorResponse('Unauthorized', 401);
    }

    if (session.user.role !== UserRole.HOST) {
      return errorResponse('Only HOST can update scoring devices', 403);
    }

    const { id } = await params;
    const body = await request.json();

    const existingDevice = await prisma.tournamentScoringDevice.findUnique({
      where: { id },
      include: {
        tournament: {
          select: {
            hostId: true,
          },
        },
      },
    });

    if (!existingDevice) {
      return errorResponse('Scoring device not found', 404);
    }

    if (existingDevice.tournament.hostId !== session.user.id) {
      return errorResponse('You can only manage your own tournaments', 403);
    }

    const { name, deviceType, deviceId, notes } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (deviceType !== undefined) updateData.deviceType = deviceType;
    if (deviceId !== undefined) updateData.deviceId = deviceId;
    if (notes !== undefined) updateData.notes = notes;

    const device = await prisma.tournamentScoringDevice.update({
      where: { id },
      data: updateData,
    });

    return successResponse(device, 'Scoring device updated successfully');
  } catch (error) {
    console.error('Error updating scoring device:', error);
    return errorResponse('Failed to update scoring device', 500);
  }
}

// DELETE /api/tournament-scoring-devices/:id - Delete scoring device (HOST only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<DeviceParams> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return errorResponse('Unauthorized', 401);
    }

    if (session.user.role !== UserRole.HOST) {
      return errorResponse('Only HOST can delete scoring devices', 403);
    }

    const { id } = await params;

    const existingDevice = await prisma.tournamentScoringDevice.findUnique({
      where: { id },
      include: {
        tournament: {
          select: {
            hostId: true,
          },
        },
      },
    });

    if (!existingDevice) {
      return errorResponse('Scoring device not found', 404);
    }

    if (existingDevice.tournament.hostId !== session.user.id) {
      return errorResponse('You can only manage your own tournaments', 403);
    }

    await prisma.tournamentScoringDevice.delete({
      where: { id },
    });

    return successResponse(null, 'Scoring device deleted successfully');
  } catch (error) {
    console.error('Error deleting scoring device:', error);
    return errorResponse('Failed to delete scoring device', 500);
  }
}

