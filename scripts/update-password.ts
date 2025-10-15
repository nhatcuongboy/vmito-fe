// Script to update user password directly via Prisma
// Run this script: npx tsx scripts/update-password.ts

import { prisma } from '../src/app/lib/prisma';
import bcrypt from 'bcryptjs';

async function updateUserPassword(email: string, newPassword: string) {
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`❌ User with email ${email} not found`);
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    console.log(`✅ Password updated successfully for user: ${email}`);
    console.log(`User ID: ${user.id}`);
    console.log(`User Name: ${user.name}`);
  } catch (error) {
    console.error('❌ Error updating password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Usage examples:
// updateUserPassword('user@example.com', 'newpassword123')

// Get email and password from command line arguments
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log(
    'Usage: npx tsx scripts/update-password.ts <email> <new-password>'
  );
  console.log(
    'Example: npx tsx scripts/update-password.ts user@example.com newpassword123'
  );
  process.exit(1);
}

updateUserPassword(email, password);
