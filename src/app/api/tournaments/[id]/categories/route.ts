import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { UserRole, CategoryType } from '@/lib/api/types';

interface TournamentParams {
  id: string;
}

// GET /api/tournaments/:id/categories - Get all categories of a tournament
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<TournamentParams> }
) {
  try {
    const { id } = await params;

    // Check if tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id },
    });

    if (!tournament) {
      return errorResponse('Tournament not found', 404);
    }

    const categories = await prisma.category.findMany({
      where: { tournamentId: id },
      include: {
        _count: {
          select: {
            registrations: true,
            matches: true,
            groups: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return successResponse(categories, 'Categories retrieved successfully');
  } catch (error) {
    console.error('Error fetching categories:', error);
    return errorResponse('Failed to fetch categories', 500);
  }
}

// POST /api/tournaments/:id/categories - Create a new category (HOST only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<TournamentParams> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return errorResponse('Unauthorized', 401);
    }

    if (session.user.role !== UserRole.HOST) {
      return errorResponse('Only HOST can create categories', 403);
    }

    const { id } = await params;
    const body = await request.json();

    // Check if tournament exists and user is the host
    const tournament = await prisma.tournament.findUnique({
      where: { id },
    });

    if (!tournament) {
      return errorResponse('Tournament not found', 404);
    }

    if (tournament.hostId !== session.user.id) {
      return errorResponse('You can only manage your own tournaments', 403);
    }

    const { name, type } = body;

    if (!name || !type) {
      return errorResponse('Name and type are required', 400);
    }

    const validCategoryTypes = Object.values(CategoryType);
    if (!validCategoryTypes.includes(type)) {
      return errorResponse(`Invalid category type: ${type}`, 400);
    }

    // Check if category name already exists in this tournament
    const existingCategory = await prisma.category.findUnique({
      where: {
        tournamentId_name: {
          tournamentId: id,
          name,
        },
      },
    });

    if (existingCategory) {
      return errorResponse('Category with this name already exists', 400);
    }

    const category = await prisma.category.create({
      data: {
        tournamentId: id,
        name,
        type,
      },
      include: {
        _count: {
          select: {
            registrations: true,
            matches: true,
            groups: true,
          },
        },
      },
    });

    return successResponse(category, 'Category created successfully');
  } catch (error) {
    console.error('Error creating category:', error);
    return errorResponse('Failed to create category', 500);
  }
}

