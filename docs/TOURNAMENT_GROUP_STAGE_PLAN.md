# Tournament Group Stage Implementation Plan

## Tổng quan

Plan này mô tả các bước để triển khai tính năng Group Stage cho tournament categories, bao gồm:

1. Group Division - Chọn đội cho các group
2. Group Stage - Quản lý các trận đấu vòng tròn
3. Complete Group Stage - Chuyển sang Knockout Stage

## Phân tích hiện trạng

### Đã có:

- ✅ Database schema hỗ trợ `CategoryGroup`, `CategoryGroupRegistration`
- ✅ API để xem standings và winners của group
- ✅ UI tab "Registrations" để đăng ký đội
- ✅ UI tab "Matches" cơ bản
- ✅ UI tab "Standings" (chưa có nội dung)

### Chưa có:

- ❌ API để tạo và quản lý groups
- ❌ API để assign registrations vào groups
- ❌ API để tự động tạo round-robin matches
- ❌ UI để chọn đội cho groups (Group Division)
- ❌ UI để quản lý matches trong Group Stage
- ❌ Logic để complete group stage

## Các bước triển khai

### Phase 1: Backend APIs

#### 1.1. Group Management APIs

**POST `/api/categories/[id]/groups`**

- Tạo groups dựa trên `groupCount` trong category settings
- Tự động tạo groups với `groupNumber` từ 1 đến `groupCount`
- Response: Danh sách groups đã tạo

**GET `/api/categories/[id]/groups`**

- Lấy tất cả groups của category
- Include registrations trong mỗi group
- Response: `CategoryGroup[]` với `registrations`

**PUT `/api/categories/[id]/groups/[groupId]`**

- Cập nhật thông tin group (name, etc.)

**DELETE `/api/categories/[id]/groups/[groupId]`**

- Xóa group và tất cả group registrations liên quan

#### 1.2. Group Registration Assignment APIs

**POST `/api/categories/[id]/groups/[groupId]/registrations`**

- Assign một registration vào group
- Body: `{ categoryRegistrationId: string }`
- Validate: Registration chưa được assign vào group khác
- Response: `CategoryGroupRegistration`

**DELETE `/api/categories/[id]/groups/[groupId]/registrations/[registrationId]`**

- Remove registration khỏi group
- Response: success message

**POST `/api/categories/[id]/groups/[groupId]/registrations/bulk`**

- Assign nhiều registrations vào group cùng lúc
- Body: `{ categoryRegistrationIds: string[] }`
- Validate: Tất cả registrations đều chưa được assign
- Response: Danh sách `CategoryGroupRegistration[]`

**POST `/api/categories/[id]/groups/auto-assign`**

- Tự động chia đều tất cả registrations vào các groups
- Body: `{ shuffle?: boolean }` (optional, default: true)
- Algorithm: Chia round-robin style (hoặc shuffle trước nếu shuffle=true)
- Validate: Phải có ít nhất 1 registration và ít nhất 1 group
- Response: Map của groupId → CategoryGroupRegistration[]

#### 1.3. Round-Robin Match Generation API

**POST `/api/categories/[id]/groups/[groupId]/generate-matches`**

- Tạo tất cả matches round-robin cho group
- Algorithm: Với n teams, tạo n\*(n-1)/2 matches (mỗi team đấu với tất cả teams khác)
- Mỗi match có:
  - `round`: "Group Stage"
  - `groupId`: ID của group
  - `matchNumber`: Số thứ tự trong group
  - `status`: "SCHEDULED"
  - `participants`: 2 registrations (position 1 và 2)
- Validate: Group phải có ít nhất 2 registrations
- Response: Danh sách matches đã tạo

**GET `/api/categories/[id]/groups/[groupId]/matches`**

- Lấy tất cả matches của group
- Response: `CategoryMatch[]`

#### 1.4. Complete Group Stage API

**POST `/api/categories/[id]/complete-group-stage`**

- Validate: Tất cả matches trong tất cả groups đều đã có kết quả (status = "FINISHED")
- Tính toán standings cho tất cả groups
- Xác định winners của mỗi group (dựa trên `winnersPerGroup`)
- Có thể tạo knockout stage matches tự động (optional)
- Response: Success message và standings summary

### Phase 2: Frontend Services

#### 2.1. Update `CategoryService`

Thêm các methods:

```typescript
// Group management
createGroups: async (categoryId: string): Promise<CategoryGroup[]>
getGroups: async (categoryId: string): Promise<CategoryGroup[]>
updateGroup: async (categoryId: string, groupId: string, data: Partial<CategoryGroup>): Promise<CategoryGroup>
deleteGroup: async (categoryId: string, groupId: string): Promise<void>

// Group registration assignment
assignRegistrationToGroup: async (categoryId: string, groupId: string, registrationId: string): Promise<CategoryGroupRegistration>
removeRegistrationFromGroup: async (categoryId: string, groupId: string, registrationId: string): Promise<void>
bulkAssignRegistrationsToGroup: async (categoryId: string, groupId: string, registrationIds: string[]): Promise<CategoryGroupRegistration[]>
autoAssignAllRegistrations: async (categoryId: string, options?: { shuffle?: boolean }): Promise<Record<string, CategoryGroupRegistration[]>>

// Match generation
generateGroupMatches: async (categoryId: string, groupId: string): Promise<CategoryMatch[]>
getGroupMatches: async (categoryId: string, groupId: string): Promise<CategoryMatch[]>

// Complete group stage
completeGroupStage: async (categoryId: string): Promise<any>
```

### Phase 3: UI Components

#### 3.1. Update Category Manage Page Navigation

Thêm step navigation bar ở đầu page:

```
[1 Basic Settings] [2 Player Registration] [3 Group Division] [4 Group Stage] [5 Knockout Stage]
```

- Highlight step hiện tại
- Có thể click để navigate (optional)

#### 3.2. Tab "Group Division" (Standings Tab)

**Layout:**

- Hiển thị tất cả groups (Group 1, Group 2, ...)
- Mỗi group có:
  - Header: "Group X" với số lượng registrations hiện tại (ví dụ: "Group 1 (3 teams)")
  - Table hiển thị registrations đã assign:
    - Team Name
    - Player 1 / Pair Member 1
    - Player 2 / Pair Member 2
    - Action: Remove button
  - Drop zone hoặc "Add Team" button để thêm registrations

**Features:**

- Drag & drop registrations từ danh sách "Available Teams" vào groups
- Hoặc click "Add Team" → Modal chọn từ danh sách registrations chưa được assign
- Validate: Mỗi registration chỉ có thể ở 1 group
- Button "Auto Assign" để tự động phân bổ đều registrations vào các groups
  - Algorithm: Chia đều (hoặc gần đều) tất cả registrations vào các groups
  - Ví dụ: 10 teams, 3 groups → Group 1: 4 teams, Group 2: 3 teams, Group 3: 3 teams
  - Có thể random shuffle trước khi chia để tránh bias

**UI Structure:**

```
[Group Division Tab]
├── Info: "Total teams: X | Groups: Y | Average: ~Z teams per group"
├── Available Teams (unassigned registrations)
│   └── List of registrations có thể drag & drop
├── Group 1
│   ├── Header: "Group 1 (3 teams)"
│   ├── Table: Team Name | Player 1 | Player 2 | Actions
│   └── "Add Team" button
├── Group 2
│   └── ...
└── "Auto Assign Teams" button (chia đều tất cả teams vào các groups)
```

#### 3.3. Tab "Group Stage"

**Layout:**

- Button "Generate Matches" ở đầu (nếu chưa có matches)
- Button "Complete Group Stage" (chỉ hiển thị khi tất cả matches đã có kết quả)
- Hiển thị groups theo tabs hoặc accordion
- Mỗi group hiển thị:
  - Group header với standings summary (W/L records)
  - Danh sách matches của group
  - Mỗi match card hiển thị:
    - Team 1 vs Team 2
    - Score (nếu đã có)
    - Status badge
    - Settings icon (gear) → Dropdown menu:
      - Configure Match
      - Set Scores
      - View Scoresheet
      - Live Scores

**Match Card UI:**

```
┌─────────────────────────────────────┐
│ [Team 1] vs [Team 2]          [⚙️] │
│ Player 1, Player 2    Player 1, P2  │
│─────────────────────────────────────│
│ Umpire: [Name]                      │
│ Scoring Device: [Device] [⚙️]        │
│ Court: [Court]                      │
│ Time: [DateTime]                     │
│─────────────────────────────────────│
│ Scores: [21] [19] | [0] [0] | [-] [-]│
└─────────────────────────────────────┘
```

**Features:**

- Click "Generate Matches" → Tạo tất cả round-robin matches cho tất cả groups
- Click Settings icon → Modal "Configure Match":
  - Umpire dropdown
  - Scoring Device dropdown
  - Court dropdown
  - Date Time picker
  - Number of Games (Best of 1/3)
- Click "Set Scores" → Modal "Match Scores":
  - Input scores cho từng game
  - Validate scores
  - Save → Update match status to "FINISHED"
- Click "Complete Group Stage":
  - Validate tất cả matches đã có kết quả
  - Tính toán standings
  - Show confirmation modal với standings summary
  - Confirm → Call API complete group stage
  - Navigate đến Knockout Stage tab (nếu có)

#### 3.4. Match Configuration Modal

**Fields:**

- Umpire: Dropdown (từ tournament umpires)
- Scoring Device: Dropdown (từ tournament scoring devices)
- Court: Dropdown (từ tournament courts)
- Date Time: DateTime picker
- Number of Games: Radio/Select (Best of 1, Best of 3)

#### 3.5. Match Scores Modal

**Fields:**

- Game 1: Team 1 Score, Team 2 Score
- Game 2: Team 1 Score, Team 2 Score (nếu Best of 3)
- Game 3: Team 1 Score, Team 2 Score (nếu Best of 3)
- Validate: Scores phải hợp lệ (0-30, winner phải >= 21 hoặc 2 điểm hơn nếu > 21)
- Auto-determine winner dựa trên scores
- Save → Update match với scores và status

### Phase 4: Round-Robin Algorithm

**Function: `generateRoundRobinMatches(registrations: CategoryRegistration[])`**

```typescript
function generateRoundRobinMatches(
  registrations: CategoryRegistration[]
): Array<{
  participant1Id: string;
  participant2Id: string;
}> {
  const matches = [];
  const n = registrations.length;

  // Round-robin: mỗi team đấu với tất cả teams khác
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      matches.push({
        participant1Id: registrations[i].id,
        participant2Id: registrations[j].id,
      });
    }
  }

  return matches;
}
```

### Phase 5: Auto-Assign Algorithm

**Function: `autoAssignTeamsToGroups(registrations: CategoryRegistration[], groupCount: number)`**

```typescript
function autoAssignTeamsToGroups(
  registrations: CategoryRegistration[],
  groupCount: number
): Map<number, CategoryRegistration[]> {
  // Shuffle để random (optional, có thể bỏ nếu muốn giữ thứ tự)
  const shuffled = [...registrations].sort(() => Math.random() - 0.5);

  // Chia đều vào các groups
  const groups = new Map<number, CategoryRegistration[]>();

  // Initialize groups
  for (let i = 1; i <= groupCount; i++) {
    groups.set(i, []);
  }

  // Distribute teams round-robin style
  shuffled.forEach((registration, index) => {
    const groupNumber = (index % groupCount) + 1;
    groups.get(groupNumber)!.push(registration);
  });

  return groups;
}
```

**Logic:**

- Chia đều (hoặc gần đều) tất cả registrations vào các groups
- Ví dụ: 10 teams, 3 groups
  - Group 1: teams 0, 3, 6, 9 (4 teams)
  - Group 2: teams 1, 4, 7 (3 teams)
  - Group 3: teams 2, 5, 8 (3 teams)
- Có thể shuffle trước khi chia để tránh bias theo thứ tự đăng ký

### Phase 6: Standings Calculation

**Logic tính standings:**

1. Với mỗi match đã hoàn thành:
   - Winner: +1 win
   - Loser: +1 loss
   - Tính points (nếu cần)
2. Sort teams theo:
   - Wins (desc)
   - Head-to-head (nếu bằng wins)
   - Points difference (nếu cần)
3. Assign rank cho mỗi team
4. Xác định winners (top `winnersPerGroup` teams)

### Phase 7: Settings Tab Updates

**Remove `playersPerGroup` field:**

- Không cần input `playersPerGroup` trong Settings tab
- Chỉ giữ lại:
  - `hasGroupStage`: Checkbox
  - `groupCount`: Số lượng groups
  - `winnersPerGroup`: Số lượng winners mỗi group (cho knockout stage)
  - `averageMatchDuration`: Thời gian trung bình mỗi trận
  - `matchFormat`: Best of 1 hoặc Best of 3

**Auto-calculation info:**

- Khi có registrations và `groupCount`, hiển thị thông tin:
  - "X teams sẽ được chia vào Y groups (~Z teams mỗi group)"
  - Tính toán: `Math.ceil(registrations.length / groupCount)`

### Phase 8: Internationalization

Thêm translations vào `vi.json` và `en.json`:

```json
{
  "pages": {
    "tournaments": {
      "categoryManage": {
        "groupDivision": "Phân bảng",
        "groupStage": "Vòng bảng",
        "knockoutStage": "Vòng loại trực tiếp",
        "basicSettings": "Cài đặt cơ bản",
        "playerRegistration": "Đăng ký đội",
        "availableTeams": "Đội chưa phân bảng",
        "assignToGroup": "Phân vào bảng",
        "removeFromGroup": "Xóa khỏi bảng",
        "generateMatches": "Tạo trận đấu",
        "completeGroupStage": "Hoàn thành vòng bảng",
        "configureMatch": "Cấu hình trận đấu",
        "setScores": "Nhập điểm số",
        "viewScoresheet": "Xem bảng điểm",
        "liveScores": "Điểm số trực tiếp",
        "matchDetails": "Chi tiết trận đấu",
        "matchScores": "Điểm số trận đấu",
        "game1": "Ván 1",
        "game2": "Ván 2",
        "game3": "Ván 3",
        "team1Score": "Điểm đội 1",
        "team2Score": "Điểm đội 2",
        "allMatchesCompleted": "Tất cả trận đấu đã hoàn thành",
        "cannotCompleteGroupStage": "Không thể hoàn thành vòng bảng. Vui lòng hoàn thành tất cả trận đấu trước.",
        "groupStageCompleted": "Vòng bảng đã hoàn thành",
        "autoAssignTeams": "Tự động phân bảng",
        "matchesGenerated": "Đã tạo {count} trận đấu",
        "noMatchesYet": "Chưa có trận đấu nào. Nhấn 'Tạo trận đấu' để bắt đầu."
      }
    }
  }
}
```

## Implementation Order

1. **Backend APIs** (Phase 1)
   - Group management APIs
   - Group registration assignment APIs
   - Round-robin match generation API
   - Complete group stage API

2. **Frontend Services** (Phase 2)
   - Update CategoryService với tất cả methods mới

3. **UI Components** (Phase 3)
   - Update navigation với step indicators
   - Implement Group Division tab
   - Implement Group Stage tab
   - Match configuration modal
   - Match scores modal

4. **Testing & Polish**
   - Test round-robin generation với các số lượng teams khác nhau
   - Test standings calculation
   - Test complete group stage flow
   - Add loading states và error handling
   - Add validation messages

## Notes

- **Settings Tab**: Không cần `playersPerGroup`, chỉ cần `groupCount`. Số lượng teams mỗi group sẽ tự động tính dựa trên tổng số registrations và số groups.
- **Auto Assign**: Chia đều (hoặc gần đều) tất cả registrations vào các groups. Có thể shuffle trước khi chia để tránh bias.
- **Round-robin matches**: Với n teams, số lượng matches = n\*(n-1)/2
- **Standings calculation**: Cần xử lý trường hợp bằng điểm (head-to-head, points difference)
- **Complete Group Stage**: Chỉ cho phép khi tất cả matches đã có kết quả
- **Group Division**: Hiển thị số lượng teams hiện tại trong mỗi group, không cần so sánh với `playersPerGroup` nữa
