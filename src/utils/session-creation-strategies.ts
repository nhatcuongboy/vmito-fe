import { prisma } from '@/app/lib/prisma';
import { generatePlayerSlots } from '@/utils/session-join-helpers';

export type SessionCreationStrategy = 'fresh' | 'repeat_previous' | 'template';

export interface SessionCreationOptions {
  strategy: SessionCreationStrategy;
  templateSessionId?: string; // For repeat_previous or template
  includeGuestSlots?: boolean; // Whether to include guest-only slots from previous
  maxPlayers?: number; // Override player count
}

export async function createPlayerSlotsForSession(
  sessionId: string,
  numberOfCourts: number,
  maxPlayersPerCourt: number,
  options: SessionCreationOptions = { strategy: 'fresh' }
) {
  const maxPlayers = options.maxPlayers || numberOfCourts * maxPlayersPerCourt;

  switch (options.strategy) {
    case 'fresh':
      return createFreshPlayerSlots(sessionId, maxPlayers);

    case 'repeat_previous':
      return repeatPreviousSession(
        sessionId,
        maxPlayers,
        options.templateSessionId!
      );

    case 'template':
      return useSessionTemplate(
        sessionId,
        maxPlayers,
        options.templateSessionId!
      );

    default:
      return createFreshPlayerSlots(sessionId, maxPlayers);
  }
}

async function createFreshPlayerSlots(sessionId: string, maxPlayers: number) {
  const playerSlots = generatePlayerSlots(sessionId, maxPlayers);

  await prisma.player.createMany({
    data: playerSlots,
  });

  return { created: playerSlots.length, reused: 0, strategy: 'fresh' };
}

async function repeatPreviousSession(
  sessionId: string,
  maxPlayers: number,
  previousSessionId: string
) {
  // Get players from previous session
  const previousPlayers = await prisma.player.findMany({
    where: {
      sessionId: previousSessionId,
      isJoined: true, // Only include players who actually joined
    },
    include: {
      user: true,
    },
    orderBy: { playerNumber: 'asc' },
  });

  const playerSlots = [];
  let playerNumber = 1;

  // Create slots for previous registered users first
  for (const prevPlayer of previousPlayers) {
    if (playerNumber <= maxPlayers) {
      const freshSlot = generatePlayerSlots(sessionId, 1)[0];
      const slot = {
        ...freshSlot,
        sessionId,
        playerNumber,
        userId: prevPlayer.userId,
        name: prevPlayer.user?.name || prevPlayer.name,
        gender: prevPlayer.gender,
        level: prevPlayer.level,
        phone: prevPlayer.phone,
        preFilledByHost: true,
        isReusedFromPrevious: true,
        previousPlayerId: prevPlayer.id,
      };
      playerSlots.push(slot);
      playerNumber++;
    }
  }

  // Fill remaining slots with fresh guest slots
  while (playerNumber <= maxPlayers) {
    const freshSlots = generatePlayerSlots(sessionId, 1);
    playerSlots.push({
      ...freshSlots[0],
      playerNumber,
      sessionId,
    });
    playerNumber++;
  }

  await prisma.player.createMany({
    data: playerSlots,
  });

  return {
    created: playerSlots.length,
    reused: previousPlayers.length,
    strategy: 'repeat_previous',
  };
}

async function useSessionTemplate(
  sessionId: string,
  maxPlayers: number,
  templateSessionId: string
) {
  // Similar to repeatPreviousSession but include all players (not just joined ones)
  const templatePlayers = await prisma.player.findMany({
    where: { sessionId: templateSessionId },
    include: { user: true },
    orderBy: { playerNumber: 'asc' },
  });

  const playerSlots = [];

  for (let i = 0; i < maxPlayers; i++) {
    const templatePlayer = templatePlayers[i];
    const freshSlot = generatePlayerSlots(sessionId, 1)[0];

    if (templatePlayer) {
      playerSlots.push({
        ...freshSlot,
        sessionId,
        playerNumber: i + 1,
        userId: templatePlayer.userId,
        name: templatePlayer.user?.name || templatePlayer.name,
        gender: templatePlayer.gender,
        level: templatePlayer.level,
        phone: templatePlayer.phone,
        preFilledByHost: templatePlayer.preFilledByHost,
        isReusedFromPrevious: true,
        previousPlayerId: templatePlayer.id,
      });
    } else {
      playerSlots.push({
        ...freshSlot,
        sessionId,
        playerNumber: i + 1,
      });
    }
  }

  await prisma.player.createMany({
    data: playerSlots,
  });

  return {
    created: playerSlots.length,
    reused: templatePlayers.length,
    strategy: 'template',
  };
}
