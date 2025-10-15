import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';

// PUT /api/auth/reset-password - Reset password for user by email
export async function PUT(request: NextRequest) {
  try {
    const { email, newPassword, adminKey } = await request.json();

    // Validate input
    if (!email || !newPassword) {
      return errorResponse('Email and new password are required', 400);
    }

    if (newPassword.length < 6) {
      return errorResponse('Password must be at least 6 characters', 400);
    }

    // Simple admin key check (in production, use proper admin authentication)
    if (adminKey !== process.env.ADMIN_RESET_KEY) {
      return errorResponse('Unauthorized admin access', 401);
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    return successResponse(
      {
        userId: user.id,
        email: user.email,
      },
      'Password reset successfully'
    );
  } catch (error) {
    console.error('Reset password error:', error);
    return errorResponse('Failed to reset password', 500);
  }
}
