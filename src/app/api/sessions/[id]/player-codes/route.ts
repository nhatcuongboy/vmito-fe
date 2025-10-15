import { NextRequest } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';

// GET /api/sessions/[id]/player-codes - Get all player join codes and QR data for host
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;

    // Get session with players
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        players: {
          orderBy: { playerNumber: 'asc' },
          select: {
            id: true,
            playerNumber: true,
            joinCode: true,
            qrCodeData: true,
            name: true,
            isJoined: true,
            joinedAt: true,
            level: true,
            gender: true,
            phone: true,
          },
        },
        host: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!session) {
      return errorResponse('Session not found', 404);
    }

    // Format player codes for easy sharing
    const playerCodes = session.players.map((player) => ({
      playerNumber: player.playerNumber,
      joinCode: player.joinCode,
      qrCodeData: player.qrCodeData,
      name: player.name,
      isJoined: player.isJoined,
      joinedAt: player.joinedAt,
      playerInfo: player.isJoined
        ? {
            level: player.level,
            gender: player.gender,
            phone: player.phone,
          }
        : null,
      // Generate sharing text
      shareText: `Join ${session.name} as Player ${player.playerNumber}\nCode: ${player.joinCode}\nOr visit: ${player.qrCodeData}`,
    }));

    // Summary statistics
    const joinedCount = playerCodes.filter((p) => p.isJoined).length;
    const totalSlots = playerCodes.length;

    return successResponse(
      {
        session: {
          id: session.id,
          name: session.name,
          status: session.status,
          host: session.host,
        },
        playerCodes,
        summary: {
          totalSlots,
          joinedCount,
          availableSlots: totalSlots - joinedCount,
          joinRate:
            totalSlots > 0 ? Math.round((joinedCount / totalSlots) * 100) : 0,
        },
      },
      'Player codes retrieved successfully'
    );
  } catch (error) {
    console.error('Error getting player codes:', error);
    return errorResponse('Failed to get player codes', 500);
  }
}
