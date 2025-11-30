import { prisma } from '@/app/lib/prisma';
import { successResponse, errorResponse } from '@/app/lib/api-response';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { UserRole, CategoryType } from '@/lib/api/types';

// POST /api/tournaments/create-sample - Create a sample tournament with complete data
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return errorResponse('Unauthorized', 401);
    }

    if (session.user.role !== UserRole.HOST) {
      return errorResponse('Only HOST can create tournaments', 403);
    }

    // Sample tournament data
    const sampleTournament = {
      name: 'Badminton Championship 2025',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      categories: [
        { name: "Men's Single", type: CategoryType.MENS_SINGLE },
        { name: "Women's Single", type: CategoryType.WOMENS_SINGLE },
        { name: "Men's Double", type: CategoryType.MENS_DOUBLE },
        { name: "Women's Double", type: CategoryType.WOMENS_DOUBLE },
        { name: 'Mixed Double', type: CategoryType.MIXED_DOUBLE },
      ],
      umpires: [
        { name: 'Nguyễn Văn A', email: 'umpire1@example.com', phone: '0901234567' },
        { name: 'Trần Thị B', email: 'umpire2@example.com', phone: '0912345678' },
        { name: 'Lê Văn C', email: 'umpire3@example.com' },
      ],
      scoringDevices: [
        { name: 'Scoreboard 1', deviceType: 'LED Display' },
        { name: 'Scoreboard 2', deviceType: 'LED Display' },
        { name: 'Tablet Scorekeeper', deviceType: 'Tablet' },
      ],
      courts: [
        { courtNumber: 1, courtName: 'Court A' },
        { courtNumber: 2, courtName: 'Court B' },
        { courtNumber: 3, courtName: 'Court C' },
        { courtNumber: 4, courtName: 'Court D' },
      ],
    };

    // Sample players data
    const samplePlayers = [
      { name: 'Nguyễn Văn Minh', email: 'minh@example.com', phone: '0901234567', gender: 'MALE' as const, level: 'TB' as const, levelDescription: 'Trung bình' },
      { name: 'Trần Thị Hương', email: 'huong@example.com', phone: '0912345678', gender: 'FEMALE' as const, level: 'TB_PLUS' as const, levelDescription: 'Trung bình mạnh' },
      { name: 'Lê Hoàng Nam', email: 'nam@example.com', phone: '0923456789', gender: 'MALE' as const, level: 'Y_PLUS' as const, levelDescription: 'Yếu hơn Trung bình' },
      { name: 'Phan Thị Linh', email: 'linh@example.com', phone: '0934567890', gender: 'FEMALE' as const, level: 'K' as const, levelDescription: 'Khá' },
      { name: 'Vũ Minh Tuấn', email: 'tuan@example.com', phone: '0945678901', gender: 'MALE' as const, level: 'TBY' as const, levelDescription: 'Trung bình - Yếu' },
      { name: 'Đặng Thị Hoa', email: 'hoa@example.com', phone: '0956789012', gender: 'FEMALE' as const, level: 'TB_MINUS' as const, levelDescription: 'Trung bình yếu' },
      { name: 'Bùi Thành Đạt', email: 'dat@example.com', phone: '0967890123', gender: 'MALE' as const, level: 'Y' as const, levelDescription: 'Yếu' },
      { name: 'Hoàng Thị Yến', email: 'yen@example.com', phone: '0978901234', gender: 'FEMALE' as const, level: 'TB' as const, levelDescription: 'Trung bình' },
      { name: 'Đinh Minh Hải', email: 'hai@example.com', phone: '0989012345', gender: 'MALE' as const, level: 'TB_PLUS' as const, levelDescription: 'Trung bình mạnh' },
      { name: 'Ngô Thị Mai', email: 'mai@example.com', phone: '0990123456', gender: 'FEMALE' as const, level: 'K' as const, levelDescription: 'Khá' },
      { name: 'Phạm Văn Long', email: 'long@example.com', phone: '0901122334', gender: 'MALE' as const, level: 'TB' as const, levelDescription: 'Trung bình' },
      { name: 'Lý Thị Lan', email: 'lan@example.com', phone: '0902233445', gender: 'FEMALE' as const, level: 'TB_PLUS' as const, levelDescription: 'Trung bình mạnh' },
      { name: 'Võ Minh Quang', email: 'quang@example.com', phone: '0903344556', gender: 'MALE' as const, level: 'K' as const, levelDescription: 'Khá' },
      { name: 'Đỗ Thị Hồng', email: 'hong@example.com', phone: '0904455667', gender: 'FEMALE' as const, level: 'TB' as const, levelDescription: 'Trung bình' },
      { name: 'Bùi Văn Sơn', email: 'son@example.com', phone: '0905566778', gender: 'MALE' as const, level: 'TB_PLUS' as const, levelDescription: 'Trung bình mạnh' },
      { name: 'Trịnh Thị Nga', email: 'nga@example.com', phone: '0906677889', gender: 'FEMALE' as const, level: 'K' as const, levelDescription: 'Khá' },
    ];

    // Create tournament
    const tournament = await prisma.tournament.create({
      data: {
        name: sampleTournament.name,
        startDate: sampleTournament.startDate,
        endDate: sampleTournament.endDate,
        hostId: session.user.id,
        status: 'PREPARING',
        categories: {
          create: sampleTournament.categories.map((cat) => ({
            name: cat.name,
            type: cat.type,
          })),
        },
        umpires: {
          create: sampleTournament.umpires.map((umpire) => ({
            name: umpire.name,
            email: umpire.email,
            phone: umpire.phone,
          })),
        },
        scoringDevices: {
          create: sampleTournament.scoringDevices.map((device) => ({
            name: device.name,
            deviceType: device.deviceType,
          })),
        },
        courts: {
          create: sampleTournament.courts.map((court) => ({
            courtNumber: court.courtNumber,
            courtName: court.courtName,
          })),
        },
      },
      include: {
        categories: true,
        umpires: true,
        scoringDevices: true,
        courts: true,
      },
    });

    // Create players
    const players = await Promise.all(
      samplePlayers.map((player) =>
        prisma.tournamentPlayer.create({
          data: {
            tournamentId: tournament.id,
            name: player.name,
            email: player.email,
            phone: player.phone,
            gender: player.gender,
            level: player.level,
            levelDescription: player.levelDescription,
          },
        })
      )
    );

    // Create pairs
    const pairs = [];
    
    // Men's Double pairs
    const malePlayers = players.filter((p) => p.gender === 'MALE').slice(0, 8);
    for (let i = 0; i < malePlayers.length - 1; i += 2) {
      const pair = await prisma.tournamentPair.create({
        data: {
          tournamentId: tournament.id,
          name: `${malePlayers[i].name} & ${malePlayers[i + 1].name}`,
          members: {
            create: [
              { playerId: malePlayers[i].id, position: 1 },
              { playerId: malePlayers[i + 1].id, position: 2 },
            ],
          },
        },
        include: { members: { include: { player: true } } },
      });
      pairs.push(pair);
    }

    // Women's Double pairs
    const femalePlayers = players.filter((p) => p.gender === 'FEMALE').slice(0, 8);
    for (let i = 0; i < femalePlayers.length - 1; i += 2) {
      const pair = await prisma.tournamentPair.create({
        data: {
          tournamentId: tournament.id,
          name: `${femalePlayers[i].name} & ${femalePlayers[i + 1].name}`,
          members: {
            create: [
              { playerId: femalePlayers[i].id, position: 1 },
              { playerId: femalePlayers[i + 1].id, position: 2 },
            ],
          },
        },
        include: { members: { include: { player: true } } },
      });
      pairs.push(pair);
    }

    // Mixed Double pairs
    const mixedMalePlayers = players.filter((p) => p.gender === 'MALE').slice(0, 4);
    const mixedFemalePlayers = players.filter((p) => p.gender === 'FEMALE').slice(0, 4);
    for (let i = 0; i < Math.min(mixedMalePlayers.length, mixedFemalePlayers.length); i++) {
      const pair = await prisma.tournamentPair.create({
        data: {
          tournamentId: tournament.id,
          name: `${mixedMalePlayers[i].name} & ${mixedFemalePlayers[i].name}`,
          members: {
            create: [
              { playerId: mixedMalePlayers[i].id, position: 1 },
              { playerId: mixedFemalePlayers[i].id, position: 2 },
            ],
          },
        },
        include: { members: { include: { player: true } } },
      });
      pairs.push(pair);
    }

    // Register players/pairs to categories
    for (const category of tournament.categories) {
      if (category.type === CategoryType.MENS_SINGLE || category.type === CategoryType.WOMENS_SINGLE) {
        // Single category - register players
        const gender = category.type === CategoryType.MENS_SINGLE ? 'MALE' : 'FEMALE';
        const categoryPlayers = players.filter((p) => p.gender === gender).slice(0, 8);
        
        for (const player of categoryPlayers) {
          await prisma.categoryRegistration.create({
            data: {
              categoryId: category.id,
              tournamentPlayerId: player.id,
            },
          });
        }
      } else {
        // Double category - register pairs
        let categoryPairs = [];
        if (category.type === CategoryType.MENS_DOUBLE) {
          categoryPairs = pairs.filter((p) => {
            const pairPlayers = p.members?.map((m) => m.player) || [];
            return pairPlayers.every((pp) => pp.gender === 'MALE');
          }).slice(0, 4);
        } else if (category.type === CategoryType.WOMENS_DOUBLE) {
          categoryPairs = pairs.filter((p) => {
            const pairPlayers = p.members?.map((m) => m.player) || [];
            return pairPlayers.every((pp) => pp.gender === 'FEMALE');
          }).slice(0, 4);
        } else if (category.type === CategoryType.MIXED_DOUBLE) {
          categoryPairs = pairs.filter((p) => {
            const pairPlayers = p.members?.map((m) => m.player) || [];
            return pairPlayers.some((pp) => pp.gender === 'MALE') && 
                   pairPlayers.some((pp) => pp.gender === 'FEMALE');
          }).slice(0, 4);
        }
        
        for (const pair of categoryPairs) {
          await prisma.categoryRegistration.create({
            data: {
              categoryId: category.id,
              tournamentPairId: pair.id,
            },
          });
        }
      }
    }

    // Return tournament with all related data
    const result = await prisma.tournament.findUnique({
      where: { id: tournament.id },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        categories: {
          include: {
            _count: {
              select: {
                registrations: true,
                matches: true,
              },
            },
          },
        },
        players: true,
        pairs: {
          include: {
            members: {
              include: {
                player: true,
              },
            },
          },
        },
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

    return successResponse(
      {
        tournament: result,
        summary: {
          playersCreated: players.length,
          pairsCreated: pairs.length,
          categoriesCreated: tournament.categories.length,
          courtsCreated: tournament.courts.length,
          umpiresCreated: tournament.umpires.length,
          scoringDevicesCreated: tournament.scoringDevices.length,
        },
      },
      'Sample tournament created successfully'
    );
  } catch (error) {
    console.error('Error creating sample tournament:', error);
    return errorResponse('Failed to create sample tournament', 500);
  }
}


