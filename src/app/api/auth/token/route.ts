import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import jwt from 'jsonwebtoken';

// GET /api/auth/token - Get JWT token for authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return errorResponse('Unauthorized', 401);
    }

    // Create custom JWT token
    const tokenPayload = {
      userId: session.user.id,
      email: session.user.email,
      role: session.user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    };

    const token = jwt.sign(tokenPayload, process.env.NEXTAUTH_SECRET!, {
      algorithm: 'HS256',
    });

    return successResponse({
      accessToken: token,
      tokenType: 'Bearer',
      expiresIn: 86400, // 24 hours in seconds
      user: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
      },
    });
  } catch (error) {
    console.error('Token generation error:', error);
    return errorResponse('Failed to generate token', 500);
  }
}
