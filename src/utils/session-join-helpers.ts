/**
 * Session joining utilities for player-specific codes and QR codes
 */

export function generatePlayerJoinCode(): string {
  // Generate 8-character alphanumeric code for better uniqueness
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export function generatePlayerQRData(joinCode: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const url = new URL('/join', baseUrl);
  url.searchParams.set('code', joinCode);
  return url.toString();
}

export function parseQRData(qrData: string): { joinCode?: string } {
  try {
    const url = new URL(qrData);
    return {
      joinCode: url.searchParams.get('code') || undefined,
    };
  } catch {
    return {};
  }
}

export function generateGuestToken(
  sessionId: string,
  playerNumber: number
): string {
  return `guest_${sessionId}_${playerNumber}_${Date.now()}`;
}

export function generateLinkingCode(): string {
  // Generate 6-character linking code for account linking
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function validateJoinCode(code: string): boolean {
  // Join code should be 8 characters, alphanumeric
  return /^[A-Z0-9]{8}$/.test(code);
}

export function validateSessionId(sessionId: string): boolean {
  // Prisma CUID format validation (basic)
  return /^[a-z0-9]{25}$/.test(sessionId);
}

// Helper to generate multiple player slots with join codes
export function generatePlayerSlots(
  sessionId: string,
  numberOfPlayers: number
) {
  const players = [];
  const usedCodes = new Set<string>();

  for (let i = 1; i <= numberOfPlayers; i++) {
    let joinCode: string;

    // Ensure unique join codes
    do {
      joinCode = generatePlayerJoinCode();
    } while (usedCodes.has(joinCode));

    usedCodes.add(joinCode);

    const qrCodeData = generatePlayerQRData(joinCode);

    players.push({
      sessionId,
      playerNumber: i,
      joinCode,
      qrCodeData,
      isJoined: false,
      isGuest: true,
      name: `Player ${i}`, // Default name, can be updated when joined
    });
  }

  return players;
}
