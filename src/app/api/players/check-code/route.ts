import { NextRequest } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';

// GET /api/players/check-code - Check if code is a player join code
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return errorResponse('Code is required', 400);
    }

    const player = await prisma.player.findUnique({
      where: { joinCode: code },
      select: { id: true },
    });

    return successResponse(
      { isPlayerCode: !!player },
      player ? 'Player code found' : 'Not a player code'
    );
  } catch (error) {
    console.error('Error checking code:', error);
    return errorResponse('Failed to check code', 500);
  }
}
