import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';

// GET /api/sessions - Retrieve list of all sessions
export async function GET(_: NextRequest) {
  try {
    const sessions = await prisma.session.findMany({
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            players: true,
            courts: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return successResponse(sessions, 'Sessions retrieved successfully');
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return errorResponse('Failed to fetch sessions');
  }
}

// POST /api/sessions - Create a new session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const {
      name,
      hostId = process.env.DEFAULT_HOST_ID, // Use environment variable
      numberOfCourts,
      sessionDuration,
      maxPlayersPerCourt,
      requirePlayerInfo,
      allowGuestJoin = true, // New field for guest access
      startTime,
      endTime,
    } = body;

    if (!name) {
      return errorResponse('Session name is required');
    }

    if (!hostId) {
      return errorResponse(
        'Host ID is required (check DEFAULT_HOST_ID environment variable)'
      );
    }

    // Check if host exists
    const host = await prisma.user.findUnique({
      where: { id: hostId },
    });

    if (!host) {
      return errorResponse('Host not found');
    }

    // Create session
    const session = await prisma.session.create({
      data: {
        name,
        hostId,
        numberOfCourts: numberOfCourts || 2,
        sessionDuration: sessionDuration || 120,
        maxPlayersPerCourt: maxPlayersPerCourt || 8,
        requirePlayerInfo: requirePlayerInfo ?? true,
        allowGuestJoin: allowGuestJoin ?? true,
        startTime: startTime ? new Date(startTime) : new Date(),
        endTime: endTime
          ? new Date(endTime)
          : new Date(Date.now() + (sessionDuration || 120) * 60 * 1000),
        status: 'PREPARING',
      },
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

    // Create courts for the session
    const courtsConfig = body.courts;
    const courts = [];

    if (courtsConfig && Array.isArray(courtsConfig)) {
      // Use provided courts configuration
      for (const courtConfig of courtsConfig) {
        courts.push({
          sessionId: session.id,
          courtNumber: courtConfig.courtNumber,
          courtName: courtConfig.courtName, // Use only provided court name
          direction: courtConfig.direction || 'HORIZONTAL', // TODO: Enable after prisma client regeneration
          status: 'EMPTY' as const,
        });
      }
    } else {
      // Use default sequential courts
      for (let i = 1; i <= session.numberOfCourts; i++) {
        courts.push({
          sessionId: session.id,
          courtNumber: i,
          courtName: null, // No auto-generated court name
          direction: 'HORIZONTAL' as const, // TODO: Enable after prisma client regeneration
          status: 'EMPTY' as const,
        });
      }
    }

    await prisma.court.createMany({
      data: courts,
    });

    // Return session with courts (no automatic player creation)
    const createdSession = await prisma.session.findUnique({
      where: { id: session.id },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        courts: {
          orderBy: { courtNumber: 'asc' },
        },
        players: {
          orderBy: { playerNumber: 'asc' },
          select: {
            id: true,
            playerNumber: true,
            joinCode: true,
            qrCodeData: true,
            name: true,
            isJoined: true,
            isGuest: true,
          },
        },
        _count: {
          select: {
            players: true,
            courts: true,
          },
        },
      },
    });

    return successResponse(createdSession, 'Session created successfully');
  } catch (error) {
    console.error('Error creating session:', error);
    return errorResponse('Failed to create session');
  }
}
