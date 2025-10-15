import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';

interface PlayerParams {
  id: string;
}

// POST /api/players/[id]/confirm - Player confirms their participation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<PlayerParams> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if player exists
    const existingPlayer = await prisma.player.findUnique({
      where: { id },
      include: {
        session: true,
      },
    });

    if (!existingPlayer) {
      return errorResponse('Player not found', 404);
    }

    // For sessions requiring player info, validate data
    if (existingPlayer.session.requirePlayerInfo) {
      const { name, gender, level } = body;

      if (!name || !gender || !level) {
        return errorResponse(
          'Name, gender, and level are required for this session',
          400
        );
      }

      // Update player info and confirm
      const player = await prisma.player.update({
        where: { id },
        data: {
          name,
          gender,
          level,
          levelDescription: body.levelDescription,
          phone: body.phone,
          confirmedByPlayer: true,
          desire: body.desire,
        },
      });

      return successResponse(
        player,
        'Player confirmed successfully with info updated'
      );
    } else {
      // For sessions not requiring info, just confirm and update desire
      const player = await prisma.player.update({
        where: { id },
        data: {
          name: body.name ?? undefined,
          gender: body.gender ?? undefined,
          level: body.level ?? undefined,
          levelDescription: body.levelDescription ?? undefined,
          phone: body.phone ?? undefined,
          desire: body.desire ?? undefined,
          confirmedByPlayer: true,
        },
      });

      return successResponse(player, 'Player confirmed successfully');
    }
  } catch (error) {
    console.error('Error confirming player:', error);
    return errorResponse('Failed to confirm player');
  }
}
