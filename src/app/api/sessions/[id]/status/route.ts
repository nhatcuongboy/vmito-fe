import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';

interface SessionStatusParams {
  id: string;
}

// GET /api/sessions/[id]/status - Get real-time session status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<SessionStatusParams> }
) {
  try {
    const { id: sessionId } = await params;

    // Get comprehensive session data
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        players: {
          include: {
            currentCourt: {
              select: {
                courtNumber: true,
                courtName: true,
                currentMatch: {
                  select: {
                    id: true,
                    startTime: true,
                    players: {
                      include: {
                        player: {
                          select: {
                            id: true,
                            playerNumber: true,
                            name: true,
                          },
                        },
                      },
                      orderBy: { position: 'asc' },
                    },
                  },
                },
              },
            },
          },
          orderBy: [
            { status: 'desc' }, // PLAYING first, then WAITING
            { currentWaitTime: 'desc' }, // Longest waiting first
            { playerNumber: 'asc' }, // Then by player number
          ],
        },
        courts: {
          include: {
            currentMatch: {
              include: {
                players: {
                  include: {
                    player: {
                      select: {
                        id: true,
                        playerNumber: true,
                        name: true,
                        gender: true,
                        level: true,
                      },
                    },
                  },
                  orderBy: { position: 'asc' },
                },
              },
            },
          },
          orderBy: { courtNumber: 'asc' },
        },
      },
    });

    if (!session) {
      return errorResponse('Session not found', 404);
    }

    // Calculate real-time statistics
    const stats = {
      totalPlayers: session.players.length,
      confirmedPlayers: session.players.filter((p) => p.confirmedByPlayer)
        .length,
      waitingPlayers: session.players.filter((p) => p.status === 'WAITING')
        .length,
      playingPlayers: session.players.filter((p) => p.status === 'PLAYING')
        .length,
      availableCourts: session.courts.filter((c) => c.status === 'EMPTY')
        .length,
      activeCourts: session.courts.filter((c) => c.status === 'IN_USE').length,
      activeMatches: session.courts.filter((c) => c.currentMatch).length,
    };

    // Get waiting queue with priority
    const waitingQueue = session.players
      .filter((p) => p.status === 'WAITING' && p.confirmedByPlayer)
      .map((player, index) => ({
        ...player,
        queuePosition: index + 1,
      }));

    // Get active matches with details
    const activeMatches = session.courts
      .filter((c) => c.currentMatch)
      .map((court) => ({
        matchId: court.currentMatch!.id,
        courtNumber: court.courtNumber,
        startTime: court.currentMatch!.startTime,
        duration: Math.floor(
          (new Date().getTime() - court.currentMatch!.startTime.getTime()) /
            (1000 * 60)
        ), // in minutes
        players: court.currentMatch!.players.map((mp) => ({
          playerId: mp.player.id,
          playerNumber: mp.player.playerNumber,
          name: mp.player.name,
          gender: mp.player.gender,
          level: mp.player.level,
          position: mp.position,
        })),
      }));

    // Calculate wait time statistics
    const waitTimes = session.players
      .filter((p) => p.status === 'WAITING')
      .map((p) => p.currentWaitTime);

    const waitStats = {
      averageWaitTime:
        waitTimes.length > 0
          ? Math.round(
              waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length
            )
          : 0,
      maxWaitTime: waitTimes.length > 0 ? Math.max(...waitTimes) : 0,
      minWaitTime: waitTimes.length > 0 ? Math.min(...waitTimes) : 0,
    };

    return successResponse({
      session: {
        id: session.id,
        name: session.name,
        status: session.status,
        numberOfCourts: session.numberOfCourts,
        maxPlayersPerCourt: session.maxPlayersPerCourt,
        startTime: session.startTime,
        endTime: session.endTime,
        host: session.host,
      },
      stats,
      waitStats,
      waitingQueue,
      activeMatches,
      courts: session.courts.map((court) => ({
        id: court.id,
        courtNumber: court.courtNumber,
        status: court.status,
        currentMatch: court.currentMatch
          ? {
              id: court.currentMatch.id,
              startTime: court.currentMatch.startTime,
              duration: Math.floor(
                (new Date().getTime() -
                  court.currentMatch.startTime.getTime()) /
                  (1000 * 60)
              ),
              playerCount: court.currentMatch.players.length,
            }
          : null,
      })),
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting session status:', error);
    return errorResponse('Failed to get session status', 500);
  }
}

// PATCH /api/sessions/[id]/status - Update session status (PREPARING, IN_PROGRESS, FINISHED)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<SessionStatusParams> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return errorResponse('Status is required');
    }

    // Validate status
    if (!['PREPARING', 'IN_PROGRESS', 'FINISHED'].includes(status)) {
      return errorResponse(
        'Invalid status. Must be one of: PREPARING, IN_PROGRESS, FINISHED'
      );
    }

    // Get current session
    const currentSession = await prisma.session.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!currentSession) {
      return errorResponse('Session not found', 404);
    }

    // Update session data based on status transition
    const updateData: any = { status };

    // // If transitioning from PREPARING to IN_PROGRESS, set startTime
    // if (currentSession.status === "PREPARING" && status === "IN_PROGRESS") {
    //   updateData.startTime = new Date();
    // }

    // // If transitioning to FINISHED, set endTime
    // if (status === "FINISHED" && currentSession.status !== "FINISHED") {
    //   updateData.endTime = new Date();
    // }

    // Update session
    const updatedSession = await prisma.session.update({
      where: { id },
      data: updateData,
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return successResponse(
      updatedSession,
      'Session status updated successfully'
    );
  } catch (error) {
    console.error('Error updating session status:', error);
    return errorResponse('Failed to update session status');
  }
}
