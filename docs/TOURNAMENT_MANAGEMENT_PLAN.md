# Badminton App - Tournament Management Feature Plan

## 📋 Overview

Tính năng quản lý giải đấu cầu lông cho phép tạo và quản lý các giải đấu với nhiều hạng mục (Categories), quản lý trọng tài, thiết bị ghi điểm, sân thi đấu, và quản lý cầu thủ/cặp đấu.

## 🎯 Mục tiêu

- Cho phép HOST tạo và quản lý giải đấu
- Cho phép tất cả người dùng (có đăng nhập hoặc không) xem thông tin giải đấu
- Quản lý nhiều hạng mục trong một giải đấu với các loại: MS, WS, MD, WD, XD
- Quản lý trọng tài, thiết bị ghi điểm, sân thi đấu
- Quản lý cầu thủ và cặp đấu trong giải đấu
- Quản lý các trận đấu trong từng hạng mục

## 🏗️ Kiến trúc Database

### 1. Tournament Model

```prisma
model Tournament {
  id            String        @id @default(cuid())
  name          String
  startDate     DateTime
  endDate       DateTime
  hostId        String
  status        TournamentStatus @default(PREPARING)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  // Relations
  host          User          @relation("HostedTournaments", fields: [hostId], references: [id])
  categories    Category[]
  umpires       TournamentUmpire[]
  scoringDevices TournamentScoringDevice[]
  courts        TournamentCourt[]
  players       TournamentPlayer[]
  pairs         TournamentPair[]

  @@map("tournaments")
}

enum TournamentStatus {
  PREPARING
  IN_PROGRESS
  FINISHED
  CANCELLED
}
```

### 2. Category Model

```prisma
model Category {
  id                      String        @id @default(cuid())
  tournamentId            String
  name                    String
  type                    CategoryType
  hasGroupStage           Boolean       @default(false)
  averageMatchDuration    Int?          // minutes
  groupCount              Int?
  winnersPerGroup         Int?
  playersPerGroup         Int?
  matchFormat             MatchFormat   @default(BEST_OF_3) // 1 set or 3 sets
  createdAt               DateTime      @default(now())
  updatedAt               DateTime      @updatedAt

  // Relations
  tournament              Tournament    @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
  registrations           CategoryRegistration[]
  groups                  CategoryGroup[]
  matches                 CategoryMatch[]

  @@unique([tournamentId, name])
  @@map("categories")
}

enum MatchFormat {
  BEST_OF_1    // 1 set only
  BEST_OF_3    // Best of 3 sets (first to win 2 sets)
}

enum CategoryType {
  MENS_SINGLE      // MS
  WOMENS_SINGLE    // WS
  MENS_DOUBLE      // MD
  WOMENS_DOUBLE    // WD
  MIXED_DOUBLE     // XD
}
```

### 3. Category Registration Model

```prisma
model CategoryRegistration {
  id              String    @id @default(cuid())
  categoryId      String
  tournamentPlayerId String?  // For single categories
  tournamentPairId  String?    // For double categories
  createdAt       DateTime  @default(now())

  // Relations
  category        Category  @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  player          TournamentPlayer? @relation(fields: [tournamentPlayerId], references: [id], onDelete: Cascade)
  pair            TournamentPair? @relation(fields: [tournamentPairId], references: [id], onDelete: Cascade)

  @@unique([categoryId, tournamentPlayerId])
  @@unique([categoryId, tournamentPairId])
  @@map("category_registrations")
}
```

### 4. Category Group Model

```prisma
model CategoryGroup {
  id              String    @id @default(cuid())
  categoryId      String
  groupNumber     Int
  name            String?   // Optional group name
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  category        Category  @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  registrations   CategoryGroupRegistration[]
  matches         CategoryMatch[]

  @@unique([categoryId, groupNumber])
  @@map("category_groups")
}
```

### 5. Category Group Registration Model

```prisma
model CategoryGroupRegistration {
  id                    String          @id @default(cuid())
  groupId               String
  categoryRegistrationId String
  createdAt             DateTime        @default(now())

  // Relations
  group                 CategoryGroup   @relation(fields: [groupId], references: [id], onDelete: Cascade)
  categoryRegistration  CategoryRegistration @relation(fields: [categoryRegistrationId], references: [id], onDelete: Cascade)

  @@unique([groupId, categoryRegistrationId])
  @@map("category_group_registrations")
}
```

### 6. Category Match Model

```prisma
model CategoryMatch {
  id              String        @id @default(cuid())
  categoryId      String
  groupId         String?
  round           String        // e.g., "Group A", "Quarterfinal", "Semifinal", "Final"
  matchNumber     Int
  status          MatchStatus   @default(SCHEDULED)
  startTime       DateTime?
  endTime         DateTime?
  courtId         String?
  score           String?       // e.g., "21-19, 21-17" or "21-15, 19-21, 21-18"
  // Structured score for better querying and calculations
  sets            Json?         // Array of set scores: [{"setNumber": 1, "player1Score": 21, "player2Score": 19}, ...]
  winnerId        String?       // CategoryRegistration ID
  isDraw          Boolean       @default(false)
  // Score breakdown for group stage calculations
  player1Score    Int?          // Total points scored by player/position 1 (sum of all sets)
  player2Score    Int?          // Total points scored by player/position 2 (sum of all sets)
  player3Score    Int?          // For doubles: points by position 3 (sum of all sets)
  player4Score    Int?          // For doubles: points by position 4 (sum of all sets)
  notes           String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  // Relations
  category        Category      @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  group           CategoryGroup? @relation(fields: [groupId], references: [id], onDelete: Cascade)
  court           TournamentCourt? @relation(fields: [courtId], references: [id])
  participants    CategoryMatchParticipant[]

  @@map("category_matches")
}

enum MatchStatus {
  SCHEDULED
  IN_PROGRESS
  FINISHED
  CANCELLED
}
```

### 7. Category Match Participant Model

```prisma
model CategoryMatchParticipant {
  id                    String            @id @default(cuid())
  matchId               String
  categoryRegistrationId String
  position              Int               // 1 or 2 (for single), 1-4 (for double)
  createdAt             DateTime          @default(now())

  // Relations
  match                 CategoryMatch     @relation(fields: [matchId], references: [id], onDelete: Cascade)
  categoryRegistration CategoryRegistration @relation(fields: [categoryRegistrationId], references: [id], onDelete: Cascade)

  @@unique([matchId, categoryRegistrationId])
  @@unique([matchId, position])
  @@map("category_match_participants")
}
```

### 8. Tournament Umpire Model

```prisma
model TournamentUmpire {
  id            String      @id @default(cuid())
  tournamentId  String
  name          String
  email         String?
  phone         String?
  notes         String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  // Relations
  tournament    Tournament  @relation(fields: [tournamentId], references: [id], onDelete: Cascade)

  @@map("tournament_umpires")
}
```

### 9. Tournament Scoring Device Model

```prisma
model TournamentScoringDevice {
  id            String      @id @default(cuid())
  tournamentId  String
  name          String
  deviceType    String?     // e.g., "Tablet", "Phone", "Computer"
  deviceId      String?     // Unique device identifier
  notes         String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  // Relations
  tournament    Tournament  @relation(fields: [tournamentId], references: [id], onDelete: Cascade)

  @@map("tournament_scoring_devices")
}
```

### 10. Tournament Court Model

```prisma
model TournamentCourt {
  id            String      @id @default(cuid())
  tournamentId  String
  courtNumber   Int
  courtName     String?
  notes         String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  // Relations
  tournament    Tournament  @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
  matches       CategoryMatch[]

  @@unique([tournamentId, courtNumber])
  @@map("tournament_courts")
}
```

### 11. Tournament Player Model

```prisma
model TournamentPlayer {
  id            String      @id @default(cuid())
  tournamentId  String
  name          String
  email         String?
  phone         String?
  gender        Gender?
  level         Level?
  levelDescription String?
  notes         String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  // Relations
  tournament    Tournament  @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
  userId        String?     // Optional link to User account
  user          User?       @relation("TournamentPlayers", fields: [userId], references: [id])
  registrations CategoryRegistration[]
  pairMembers   TournamentPairMember[]

  @@map("tournament_players")
}
```

### 12. Tournament Pair Model

```prisma
model TournamentPair {
  id            String      @id @default(cuid())
  tournamentId  String
  name          String?     // Optional pair name
  notes         String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  // Relations
  tournament    Tournament  @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
  members       TournamentPairMember[]
  registrations CategoryRegistration[]

  @@map("tournament_pairs")
}
```

### 13. Tournament Pair Member Model

```prisma
model TournamentPairMember {
  id                String            @id @default(cuid())
  pairId            String
  playerId          String
  position          Int               // 1 or 2
  createdAt         DateTime          @default(now())

  // Relations
  pair              TournamentPair    @relation(fields: [pairId], references: [id], onDelete: Cascade)
  player            TournamentPlayer  @relation(fields: [playerId], references: [id], onDelete: Cascade)

  @@unique([pairId, playerId])
  @@unique([pairId, position])
  @@map("tournament_pair_members")
}
```

### 14. Update User Model

```prisma
model User {
  // ... existing fields ...

  // Add new relations
  hostedTournaments Tournament[] @relation("HostedTournaments")
  tournamentPlayers TournamentPlayer[] @relation("TournamentPlayers")
}
```

## 📁 Cấu trúc Routes

### Public Routes (Tất cả người dùng có thể xem)

```
/[locale]/tournaments                    - Danh sách tất cả giải đấu
/[locale]/tournaments/[id]               - Chi tiết giải đấu (view only)
/[locale]/tournaments/[id]/categories/[categoryId] - Chi tiết hạng mục (view only)
```

### Protected Routes (Chỉ HOST)

```
/[locale]/tournaments/new                - Tạo giải đấu mới
/[locale]/tournaments/[id]/manage        - Quản lý giải đấu
/[locale]/tournaments/[id]/manage/categories/[categoryId] - Quản lý hạng mục
/[locale]/tournaments/[id]/manage/players - Quản lý cầu thủ
/[locale]/tournaments/[id]/manage/pairs   - Quản lý cặp đấu
```

## 🔌 API Endpoints

### Tournament APIs

#### `GET /api/tournaments`

Lấy danh sách tất cả giải đấu (public)

**Response:**

```typescript
{
  success: true,
  data: Tournament[]
}
```

#### `GET /api/tournaments/:id`

Lấy chi tiết giải đấu (public)

**Response:**

```typescript
{
  success: true,
  data: Tournament & {
    host: User,
    categories: Category[],
    umpires: TournamentUmpire[],
    scoringDevices: TournamentScoringDevice[],
    courts: TournamentCourt[],
    _count: {
      players: number,
      pairs: number,
      categories: number
    }
  }
}
```

#### `POST /api/tournaments`

Tạo giải đấu mới (HOST only)

**Request Body:**

```typescript
{
  name: string,
  startDate: Date,
  endDate: Date,
  categories: Array<{
    name: string,
    type: CategoryType
  }>,
  umpires?: Array<{
    name: string,
    email?: string,
    phone?: string
  }>,
  scoringDevices?: Array<{
    name: string,
    deviceType?: string
  }>,
  courts?: Array<{
    courtNumber: number,
    courtName?: string
  }>
}
```

#### `PUT /api/tournaments/:id`

Cập nhật thông tin giải đấu (HOST only)

#### `DELETE /api/tournaments/:id`

Xóa giải đấu (HOST only)

#### `PUT /api/tournaments/:id/umpires`

Cập nhật danh sách trọng tài (HOST only)

#### `PUT /api/tournaments/:id/scoring-devices`

Cập nhật danh sách thiết bị ghi điểm (HOST only)

#### `PUT /api/tournaments/:id/courts`

Cập nhật danh sách sân thi đấu (HOST only)

### Category APIs

#### `GET /api/tournaments/:id/categories`

Lấy danh sách hạng mục của giải đấu

#### `POST /api/tournaments/:id/categories`

Tạo hạng mục mới (HOST only)

**Request Body:**

```typescript
{
  name: string,
  type: CategoryType
}
```

#### `GET /api/categories/:id`

Lấy chi tiết hạng mục

#### `PUT /api/categories/:id`

Cập nhật hạng mục (HOST only)

**Request Body:**

```typescript
{
  hasGroupStage?: boolean,
  averageMatchDuration?: number,
  groupCount?: number,
  winnersPerGroup?: number,
  playersPerGroup?: number,
  matchFormat?: 'BEST_OF_1' | 'BEST_OF_3'  // 1 set or 3 sets
}
```

#### `DELETE /api/categories/:id`

Xóa hạng mục (HOST only)

#### `GET /api/categories/:id/registrations`

Lấy danh sách đăng ký tham gia hạng mục

#### `POST /api/categories/:id/registrations`

Đăng ký cầu thủ/cặp vào hạng mục (HOST only)

**Request Body:**

```typescript
{
  tournamentPlayerId?: string,  // For single categories
  tournamentPairId?: string      // For double categories
}
```

#### `DELETE /api/categories/:id/registrations/:registrationId`

Hủy đăng ký (HOST only)

#### `GET /api/categories/:id/matches`

Lấy danh sách trận đấu trong hạng mục

#### `POST /api/categories/:id/matches`

Tạo trận đấu mới (HOST only)

**Request Body:**

```typescript
{
  groupId?: string,
  round: string,
  matchNumber: number,
  participants: Array<{
    categoryRegistrationId: string,
    position: number
  }>,
  courtId?: string,
  startTime?: Date
}
```

#### `PUT /api/category-matches/:id`

Cập nhật trận đấu (HOST only)

#### `POST /api/category-matches/:id/start`

Bắt đầu trận đấu (HOST only)

#### `POST /api/category-matches/:id/end`

Kết thúc trận đấu (HOST only)

**Request Body:**

```typescript
{
  score: string,  // e.g., "21-19, 21-17" or "21-15, 19-21, 21-18" (for display)
  sets?: Array<{
    setNumber: number,  // 1, 2, 3
    player1Score: number,  // Points scored by participant at position 1 in this set
    player2Score: number,  // Points scored by participant at position 2 in this set
    player3Score?: number,  // For doubles: points by position 3
    player4Score?: number,  // For doubles: points by position 4
  }>,
  winnerId?: string,  // CategoryRegistration ID
  isDraw?: boolean,
  // Score breakdown for group stage calculations (total across all sets)
  player1Score?: number,  // Total points scored by participant at position 1 (sum of all sets)
  player2Score?: number,  // Total points scored by participant at position 2 (sum of all sets)
  player3Score?: number,  // For doubles: total points by position 3 (sum of all sets)
  player4Score?: number,  // For doubles: total points by position 4 (sum of all sets)
  notes?: string
}
```

**Note:**

- Nếu có `sets` array, hệ thống sẽ tự động tính `player1Score`, `player2Score`, etc. từ tổng các set
- Nếu không có `sets` array, có thể truyền trực tiếp `player1Score`, `player2Score`, etc.
- `score` string vẫn được lưu để hiển thị, nhưng `sets` JSON được dùng để tính toán chính xác

#### `GET /api/categories/:id/groups/:groupId/standings`

Lấy bảng xếp hạng của một group (public)

**Response:**

```typescript
{
  success: true,
  data: {
    group: CategoryGroup,
    standings: Array<{
      categoryRegistrationId: string;
      registration: CategoryRegistration & {
        player?: TournamentPlayer;
        pair?: TournamentPair;
      };
      matchesPlayed: number;
      matchesWon: number;
      matchesLost: number;
      matchesDrawn: number;
      points: number;  // Win = 2, Draw = 1, Loss = 0 (hoặc custom)
      pointsFor: number;  // Tổng điểm ghi được
      pointsAgainst: number;  // Tổng điểm bị thua
      pointDifference: number;  // pointsFor - pointsAgainst
      rank: number;  // Thứ hạng trong group
    }>
  }
}
```

**Note:** Standings được tính toán dựa trên các trận đấu đã kết thúc (status = FINISHED) trong group.

#### `GET /api/categories/:id/standings`

Lấy bảng xếp hạng tổng hợp của tất cả groups trong category (public)

**Response:**

```typescript
{
  success: true,
  data: Array<{
    group: CategoryGroup,
    standings: Array<{
      categoryRegistrationId: string;
      registration: CategoryRegistration;
      matchesPlayed: number;
      matchesWon: number;
      matchesLost: number;
      matchesDrawn: number;
      points: number;
      pointsFor: number;
      pointsAgainst: number;
      pointDifference: number;
      rank: number;
    }>
  }>
}
```

#### `POST /api/categories/:id/groups/:groupId/calculate-standings`

Tính toán lại bảng xếp hạng của group (HOST only)

**Note:** API này tự động tính toán lại standings dựa trên các trận đấu đã kết thúc. Có thể gọi sau mỗi khi kết thúc một trận đấu.

#### `GET /api/categories/:id/groups/:groupId/winners`

Lấy danh sách winners của group (top N theo winnersPerGroup) (public)

**Response:**

```typescript
{
  success: true,
  data: Array<{
    categoryRegistrationId: string;
    registration: CategoryRegistration;
    rank: number;
    standings: {
      matchesPlayed: number;
      matchesWon: number;
      points: number;
      pointDifference: number;
    }
  }>
}
```

### Tournament Player APIs

#### `GET /api/tournaments/:id/players`

Lấy danh sách cầu thủ trong giải đấu

#### `POST /api/tournaments/:id/players`

Tạo cầu thủ mới (HOST only)

**Request Body:**

```typescript
{
  name: string,
  email?: string,
  phone?: string,
  gender?: Gender,
  level?: Level,
  levelDescription?: string,
  userId?: string  // Optional link to User account
}
```

#### `PUT /api/tournament-players/:id`

Cập nhật thông tin cầu thủ (HOST only)

#### `DELETE /api/tournament-players/:id`

Xóa cầu thủ (HOST only)

### Tournament Pair APIs

#### `GET /api/tournaments/:id/pairs`

Lấy danh sách cặp đấu trong giải đấu

#### `POST /api/tournaments/:id/pairs`

Tạo cặp đấu mới (HOST only)

**Request Body:**

```typescript
{
  name?: string,
  playerIds: string[],  // Array of 2 TournamentPlayer IDs
  notes?: string
}
```

#### `PUT /api/tournament-pairs/:id`

Cập nhật cặp đấu (HOST only)

#### `DELETE /api/tournament-pairs/:id`

Xóa cặp đấu (HOST only)

### Tournament Umpire APIs

#### `GET /api/tournaments/:id/umpires`

Lấy danh sách trọng tài

#### `POST /api/tournaments/:id/umpires`

Thêm trọng tài (HOST only)

#### `PUT /api/tournament-umpires/:id`

Cập nhật trọng tài (HOST only)

#### `DELETE /api/tournament-umpires/:id`

Xóa trọng tài (HOST only)

### Tournament Scoring Device APIs

#### `GET /api/tournaments/:id/scoring-devices`

Lấy danh sách thiết bị ghi điểm

#### `POST /api/tournaments/:id/scoring-devices`

Thêm thiết bị ghi điểm (HOST only)

#### `PUT /api/tournament-scoring-devices/:id`

Cập nhật thiết bị ghi điểm (HOST only)

#### `DELETE /api/tournament-scoring-devices/:id`

Xóa thiết bị ghi điểm (HOST only)

### Tournament Court APIs

#### `GET /api/tournaments/:id/courts`

Lấy danh sách sân thi đấu

#### `POST /api/tournaments/:id/courts`

Thêm sân thi đấu (HOST only)

#### `PUT /api/tournament-courts/:id`

Cập nhật sân thi đấu (HOST only)

#### `DELETE /api/tournament-courts/:id`

Xóa sân thi đấu (HOST only)

## 🎨 UI Components

### 1. Tournament List Page (`/[locale]/tournaments/page.tsx`)

- Hiển thị danh sách tất cả giải đấu
- Filter theo status, date range
- Search theo tên
- Card layout với thông tin cơ bản

### 2. Tournament Detail Page (`/[locale]/tournaments/[id]/page.tsx`)

- View-only page cho tất cả người dùng
- Hiển thị thông tin giải đấu
- Danh sách hạng mục
- Lịch thi đấu
- Kết quả

### 3. Create Tournament Page (`/[locale]/tournaments/new/page.tsx`)

- Form tạo giải đấu
- Fields: name, startDate, endDate
- Dynamic categories list
- Optional: umpires, scoring devices, courts
- Protected route (HOST only)

### 4. Tournament Management Page (`/[locale]/tournaments/[id]/manage/page.tsx`)

- Tab navigation:
  - Overview: Thông tin tổng quan
  - Categories: Danh sách hạng mục với nút "Manage"
  - Players: Quản lý cầu thủ
  - Pairs: Quản lý cặp đấu
  - Umpires: Quản lý trọng tài
  - Scoring Devices: Quản lý thiết bị ghi điểm
  - Courts: Quản lý sân thi đấu
- Protected route (HOST only)

### 5. Category Management Page (`/[locale]/tournaments/[id]/manage/categories/[categoryId]/page.tsx`)

- Form cấu hình hạng mục:
  - Has Group Stage (checkbox)
  - **Match Format** (radio/select):
    - Best of 1 Set (1 set only)
    - Best of 3 Sets (first to win 2 sets)
  - Average Match Duration (number input)
  - Group Count (number input, conditional)
  - Winners per group (number input, conditional)
  - Players per group (number input, conditional)
- Player Registration section:
  - List available players/pairs
  - Add/remove registrations
- **Group Standings section** (nếu có group stage):
  - Hiển thị bảng xếp hạng cho từng group
  - Columns: Rank, Player/Pair, Matches Played, Won, Lost, Drawn, Points, Points For, Points Against, Point Difference
  - Tự động cập nhật khi kết thúc trận đấu
  - Highlight winners (top N theo winnersPerGroup)
- Matches section:
  - Show matches in tables
  - Group by groups (if has group stage)
  - Group by rounds (if knockout)
  - Create/edit/delete matches
  - Start/end matches
  - **Score input form**:
    - Nếu BEST_OF_1: Nhập 1 set score
    - Nếu BEST_OF_3: Nhập từng set (Set 1, Set 2, Set 3) - tự động dừng khi có người thắng 2 set
    - Hiển thị tổng điểm và winner
  - Khi end match, tự động cập nhật standings
- Protected route (HOST only)

### 6. Tournament Players Page (`/[locale]/tournaments/[id]/manage/players/page.tsx`)

- List of tournament players
- Create new player form
- Edit/delete players
- Search and filter
- Protected route (HOST only)

### 7. Tournament Pairs Page (`/[locale]/tournaments/[id]/manage/pairs/page.tsx`)

- List of tournament pairs
- Create new pair form (select 2 players)
- Edit/delete pairs
- Search and filter
- Protected route (HOST only)

## 📝 TypeScript Types

### Add to `src/lib/api/types.ts`

```typescript
// Tournament types
export enum TournamentStatus {
  PREPARING = 'PREPARING',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
  CANCELLED = 'CANCELLED',
}

export enum CategoryType {
  MENS_SINGLE = 'MENS_SINGLE',
  WOMENS_SINGLE = 'WOMENS_SINGLE',
  MENS_DOUBLE = 'MENS_DOUBLE',
  WOMENS_DOUBLE = 'WOMENS_DOUBLE',
  MIXED_DOUBLE = 'MIXED_DOUBLE',
}

export enum MatchStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
  CANCELLED = 'CANCELLED',
}

export enum MatchFormat {
  BEST_OF_1 = 'BEST_OF_1', // 1 set only
  BEST_OF_3 = 'BEST_OF_3', // Best of 3 sets (first to win 2 sets)
}

export interface Tournament {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  hostId: string;
  status: TournamentStatus;
  createdAt: Date;
  updatedAt: Date;
  host?: {
    id: string;
    name: string;
    email: string;
  };
  categories?: Category[];
  umpires?: TournamentUmpire[];
  scoringDevices?: TournamentScoringDevice[];
  courts?: TournamentCourt[];
  _count?: {
    players: number;
    pairs: number;
    categories: number;
  };
}

export interface Category {
  id: string;
  tournamentId: string;
  name: string;
  type: CategoryType;
  hasGroupStage: boolean;
  averageMatchDuration?: number;
  groupCount?: number;
  winnersPerGroup?: number;
  playersPerGroup?: number;
  matchFormat: MatchFormat; // BEST_OF_1 or BEST_OF_3
  createdAt: Date;
  updatedAt: Date;
  registrations?: CategoryRegistration[];
  groups?: CategoryGroup[];
  matches?: CategoryMatch[];
}

export interface CategoryRegistration {
  id: string;
  categoryId: string;
  tournamentPlayerId?: string;
  tournamentPairId?: string;
  player?: TournamentPlayer;
  pair?: TournamentPair;
  createdAt: Date;
}

export interface CategoryGroup {
  id: string;
  categoryId: string;
  groupNumber: number;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MatchSet {
  setNumber: number; // 1, 2, 3
  player1Score: number;
  player2Score: number;
  player3Score?: number; // For doubles
  player4Score?: number; // For doubles
}

export interface CategoryMatch {
  id: string;
  categoryId: string;
  groupId?: string;
  round: string;
  matchNumber: number;
  status: MatchStatus;
  startTime?: Date;
  endTime?: Date;
  courtId?: string;
  score?: string; // e.g., "21-19, 21-17" (for display)
  sets?: MatchSet[]; // Structured set scores
  winnerId?: string;
  isDraw: boolean;
  // Score breakdown for group stage calculations (total across all sets)
  player1Score?: number; // Sum of all sets
  player2Score?: number; // Sum of all sets
  player3Score?: number; // For doubles: sum of all sets
  player4Score?: number; // For doubles: sum of all sets
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  participants?: CategoryMatchParticipant[];
  court?: TournamentCourt;
}

export interface CategoryMatchParticipant {
  id: string;
  matchId: string;
  categoryRegistrationId: string;
  position: number;
  categoryRegistration?: CategoryRegistration;
}

export interface TournamentUmpire {
  id: string;
  tournamentId: string;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TournamentScoringDevice {
  id: string;
  tournamentId: string;
  name: string;
  deviceType?: string;
  deviceId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TournamentCourt {
  id: string;
  tournamentId: string;
  courtNumber: number;
  courtName?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TournamentPlayer {
  id: string;
  tournamentId: string;
  name: string;
  email?: string;
  phone?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  level?: Level;
  levelDescription?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
}

export interface TournamentPair {
  id: string;
  tournamentId: string;
  name?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  members?: TournamentPairMember[];
}

export interface TournamentPairMember {
  id: string;
  pairId: string;
  playerId: string;
  position: number;
  player?: TournamentPlayer;
}

// Request types
export interface CreateTournamentRequest {
  name: string;
  startDate: Date;
  endDate: Date;
  categories: Array<{
    name: string;
    type: CategoryType;
  }>;
  umpires?: Array<{
    name: string;
    email?: string;
    phone?: string;
  }>;
  scoringDevices?: Array<{
    name: string;
    deviceType?: string;
  }>;
  courts?: Array<{
    courtNumber: number;
    courtName?: string;
  }>;
}

export interface UpdateCategoryRequest {
  hasGroupStage?: boolean;
  averageMatchDuration?: number;
  groupCount?: number;
  winnersPerGroup?: number;
  playersPerGroup?: number;
  matchFormat?: MatchFormat; // BEST_OF_1 or BEST_OF_3
}

export interface CreateCategoryRegistrationRequest {
  tournamentPlayerId?: string;
  tournamentPairId?: string;
}

export interface CreateCategoryMatchRequest {
  groupId?: string;
  round: string;
  matchNumber: number;
  participants: Array<{
    categoryRegistrationId: string;
    position: number;
  }>;
  courtId?: string;
  startTime?: Date;
}

export interface EndCategoryMatchRequest {
  score: string; // e.g., "21-19, 21-17" (for display)
  sets?: MatchSet[]; // Structured set scores
  winnerId?: string;
  isDraw?: boolean;
  // Score breakdown for group stage calculations (total across all sets)
  // If sets array is provided, these will be calculated automatically
  player1Score?: number; // Total points (sum of all sets)
  player2Score?: number; // Total points (sum of all sets)
  player3Score?: number; // For doubles: total points (sum of all sets)
  player4Score?: number; // For doubles: total points (sum of all sets)
  notes?: string;
}

// Group Standings types
export interface GroupStanding {
  categoryRegistrationId: string;
  registration: CategoryRegistration & {
    player?: TournamentPlayer;
    pair?: TournamentPair;
  };
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  matchesDrawn: number;
  points: number; // Win = 2, Draw = 1, Loss = 0 (hoặc custom)
  pointsFor: number; // Tổng điểm ghi được
  pointsAgainst: number; // Tổng điểm bị thua
  pointDifference: number; // pointsFor - pointsAgainst
  rank: number; // Thứ hạng trong group
}

export interface GroupStandingsResponse {
  group: CategoryGroup;
  standings: GroupStanding[];
}

export interface CategoryStandingsResponse {
  group: CategoryGroup;
  standings: GroupStanding[];
}
[];
```

## 🔐 Authorization & Access Control

### Public Access (No authentication required)

- View tournament list
- View tournament details
- View category details
- View matches and results

### HOST Role Required

- Create tournament
- Update tournament
- Delete tournament
- Manage categories
- Manage players
- Manage pairs
- Manage umpires
- Manage scoring devices
- Manage courts
- Create/edit/delete matches
- Start/end matches

### Middleware Updates

- Add `/tournaments` to public routes
- Add `/tournaments/*/manage` to protected routes with HOST role check

## 📦 Implementation Phases

### Phase 1: Database Schema & Migrations

1. Update Prisma schema với tất cả models
2. Tạo migration
3. Update Prisma client

### Phase 2: API Layer

1. Tournament CRUD APIs
2. Category CRUD APIs
3. Category Registration APIs
4. Category Match APIs
5. **Group Standings APIs** (tính toán và lấy bảng xếp hạng)
6. Tournament Player APIs
7. Tournament Pair APIs
8. Tournament Umpire APIs
9. Tournament Scoring Device APIs
10. Tournament Court APIs

### Phase 3: TypeScript Types & Services

1. Add types to `types.ts`
2. Create `tournament.service.ts`
3. Create `category.service.ts`
4. Create `tournament-player.service.ts`
5. Create `tournament-pair.service.ts`

### Phase 4: UI Components - Public Pages

1. Tournament list page
2. Tournament detail page (view only)
3. Category detail page (view only)

### Phase 5: UI Components - Management Pages

1. Create tournament page
2. Tournament management page (tabs)
3. Category management page
4. Tournament players page
5. Tournament pairs page

### Phase 6: Integration & Testing

1. Test all API endpoints
2. Test UI flows
3. Test authorization
4. Fix bugs

## 🧪 Testing Checklist

### API Testing

- [ ] Create tournament
- [ ] Update tournament
- [ ] Delete tournament
- [ ] Create category
- [ ] Update category settings
- [ ] Register players/pairs to category
- [ ] Create matches
- [ ] Start/end matches
- [ ] **Calculate group standings**
- [ ] **Get group standings**
- [ ] **Get category standings (all groups)**
- [ ] **Get group winners**
- [ ] Manage players
- [ ] Manage pairs
- [ ] Manage umpires
- [ ] Manage scoring devices
- [ ] Manage courts

### Authorization Testing

- [ ] Public users can view tournaments
- [ ] Public users cannot manage tournaments
- [ ] HOST can create tournaments
- [ ] HOST can manage their tournaments
- [ ] HOST cannot manage other HOST's tournaments

### UI Testing

- [ ] Tournament list displays correctly
- [ ] Tournament detail page works
- [ ] Create tournament form works
- [ ] Tournament management tabs work
- [ ] Category management works
- [ ] **Group standings table displays correctly**
- [ ] **Standings update automatically after match ends**
- [ ] **Winners highlighted correctly in standings**
- [ ] Player management works
- [ ] Pair management works

## 📚 Notes & Considerations

1. **Tournament vs Session**: Tournament là một giải đấu có cấu trúc với nhiều hạng mục và trận đấu, khác với Session là buổi chơi tự do.

2. **Category Types**:
   - Single categories (MS, WS) sử dụng TournamentPlayer
   - Double categories (MD, WD, XD) sử dụng TournamentPair

3. **Group Stage**:
   - Nếu có group stage, cần chia players/pairs vào các groups
   - Winners từ mỗi group sẽ vào vòng loại trực tiếp
   - **Standings Calculation**:
     - Tính điểm dựa trên kết quả các trận đấu đã kết thúc
     - Win = 2 points, Draw = 1 point, Loss = 0 points (có thể customize)
     - Xếp hạng theo: Points → Point Difference → Points For
     - Tự động cập nhật standings sau mỗi trận đấu kết thúc

4. **Match Management**:
   - Matches có thể thuộc group (group stage) hoặc không (knockout)
   - Round field để phân loại: "Group A", "Quarterfinal", "Semifinal", "Final"
   - **Match Format**:
     - BEST_OF_1: Chỉ 1 set, thắng set đó là thắng trận
     - BEST_OF_3: Tối đa 3 sets, thắng 2 sets là thắng trận
     - Format được cấu hình ở Category level, áp dụng cho tất cả matches trong category
   - **Score Format**:
     - Lưu dạng string: "21-19, 21-17" hoặc "21-15, 19-21, 21-18" (for display)
     - Lưu structured `sets` array (JSON) với chi tiết từng set để tính toán chính xác
     - Parse score để tính pointsFor và pointsAgainst cho standings
     - Lưu breakdown points (player1Score, player2Score, etc.) - tổng điểm qua tất cả sets

5. **Standings Calculation Logic**:
   - Chỉ tính các trận đấu có status = FINISHED
   - Tính pointsFor: tổng điểm ghi được trong tất cả các trận (tổng của tất cả sets)
   - Tính pointsAgainst: tổng điểm bị thua trong tất cả các trận (tổng của tất cả sets)
   - Point Difference = pointsFor - pointsAgainst
   - Xếp hạng:
     1. Points (cao nhất)
     2. Point Difference (cao nhất)
     3. Points For (cao nhất)
     4. Head-to-head (nếu có)
   - Winners per group: lấy top N theo rank
   - **Note**: Với BEST_OF_3, điểm được tính từ tất cả các sets đã chơi (kể cả set thua)

6. **Player/Pair Reusability**:
   - TournamentPlayer và TournamentPair chỉ thuộc về một Tournament
   - Có thể link TournamentPlayer với User account (optional)

7. **Court Management**:
   - TournamentCourt khác với Session Court
   - Một CategoryMatch có thể được assign vào một TournamentCourt

8. **Future Enhancements**:
   - Bracket visualization
   - Live scoring
   - Statistics and analytics
   - Export results
   - Email notifications
   - Custom scoring rules (points per win/draw)

## 🚀 Getting Started

1. Review và approve plan
2. Create database migration
3. Start với Phase 1 (Database Schema)
4. Implement theo từng phase
5. Test thoroughly trước khi chuyển phase tiếp theo
