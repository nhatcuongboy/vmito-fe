import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { UserRole, CategoryType } from '@/lib/api/types';

// GET /api/tournaments - Get all tournaments (public)
export async function GET(_: NextRequest) {
  try {
    const tournaments = await prisma.tournament.findMany({
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
            pairs: true,
            categories: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return successResponse(tournaments, 'Tournaments retrieved successfully');
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return errorResponse('Failed to fetch tournaments', 500);
  }
}

// POST /api/tournaments - Create a new tournament (HOST only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return errorResponse('Unauthorized', 401);
    }

    if (session.user.role !== UserRole.HOST) {
      return errorResponse('Only HOST can create tournaments', 403);
    }

    const body = await request.json();

    const {
      name,
      startDate,
      endDate,
      categories,
      umpires = [],
      scoringDevices = [],
      courts = [],
    } = body;

    // Validate required fields
    if (!name || !startDate || !endDate) {
      return errorResponse('Name, startDate, and endDate are required', 400);
    }

    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return errorResponse('At least one category is required', 400);
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return errorResponse('Invalid date format', 400);
    }

    if (start >= end) {
      return errorResponse('End date must be after start date', 400);
    }

    // Validate category types
    const validCategoryTypes = Object.values(CategoryType);
    for (const category of categories) {
      if (!category.name || !category.type) {
        return errorResponse('Each category must have name and type', 400);
      }
      if (!validCategoryTypes.includes(category.type)) {
        return errorResponse(
          `Invalid category type: ${category.type}`,
          400
        );
      }
    }

    // Create tournament with all related data
    const tournament = await prisma.tournament.create({
      data: {
        name,
        startDate: start,
        endDate: end,
        hostId: session.user.id,
        status: 'PREPARING',
        categories: {
          create: categories.map((cat: { name: string; type: CategoryType }) => ({
            name: cat.name,
            type: cat.type,
          })),
        },
        umpires: {
          create: umpires.map((umpire: { name: string; email?: string; phone?: string }) => ({
            name: umpire.name,
            email: umpire.email,
            phone: umpire.phone,
          })),
        },
        scoringDevices: {
          create: scoringDevices.map((device: { name: string; deviceType?: string }) => ({
            name: device.name,
            deviceType: device.deviceType,
          })),
        },
        courts: {
          create: courts.map((court: { courtNumber: number; courtName?: string }) => ({
            courtNumber: court.courtNumber,
            courtName: court.courtName,
          })),
        },
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        categories: true,
        umpires: true,
        scoringDevices: true,
        courts: {
          orderBy: {
            courtNumber: 'asc',
          },
        },
        _count: {
          select: {
            players: true,
            pairs: true,
            categories: true,
          },
        },
      },
    });

    return successResponse(tournament, 'Tournament created successfully');
  } catch (error) {
    console.error('Error creating tournament:', error);
    return errorResponse('Failed to create tournament', 500);
  }
}

