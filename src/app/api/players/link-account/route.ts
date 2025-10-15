import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';

// POST /api/players/link-account - Link guest player to user account (TODO: Implement later)
export async function POST(request: NextRequest) {
  try {
    return errorResponse('Account linking feature coming soon', 501);
  } catch (error) {
    console.error('Error linking account:', error);
    return errorResponse('Failed to link account', 500);
  }
}
