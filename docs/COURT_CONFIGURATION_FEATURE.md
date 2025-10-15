# ✅ Court Configuration Feature

## 🏸 **Tính năng mới: Cấu hình Court Number và Court Name khi tạo Session**

### 📋 **Mô tả tính năng:**

Khi tạo session, host có thể:

- **Court Number (bắt buộc)**: Nhập số thứ tự cho từng sân
- **Court Name (không bắt buộc)**: Nhập tên tùy chỉnh cho từng sân
- **Dynamic Courts**: Số lượng court inputs thay đổi theo "Number of Courts"

### 🎯 **Luồng hoạt động:**

#### 1. **Frontend (Host UI)**

- Host chọn "Number of Courts" (1-10)
- System tự động tạo form inputs cho từng sân
- Mỗi sân có 2 trường:
  - `Court Number` (required, number input)
  - `Court Name` (optional, text input)
- Default values:
  - Court 1: Number=1, Name="Sân A"
  - Court 2: Number=2, Name="Sân B"
  - Court 3: Number=3, Name="Sân C"...

#### 2. **Validation**

- Court numbers phải unique trong session
- Court numbers phải >= 1
- Hiển thị error nếu validation fail

#### 3. **API Processing**

- Frontend gửi `courts` array trong request
- Backend sử dụng provided configuration
- Fallback về auto-generation nếu không có courts config

### 🛠️ **Implementation Details:**

#### **Frontend Changes:**

```tsx
// State management
const [numberOfCourts, setNumberOfCourts] = useState(2);
const [courts, setCourts] = useState([
  { courtNumber: 1, courtName: 'Sân A' },
  { courtNumber: 2, courtName: 'Sân B' },
]);

// Dynamic court configuration UI
{
  courts.map((court, index) => (
    <Box key={court.courtNumber}>
      <Input
        value={court.courtNumber}
        onChange={(e) =>
          handleCourtChange(index, 'courtNumber', parseInt(e.target.value))
        }
        placeholder="Court Number"
        required
      />
      <Input
        value={court.courtName}
        onChange={(e) => handleCourtChange(index, 'courtName', e.target.value)}
        placeholder="Court Name (optional)"
      />
    </Box>
  ));
}
```

#### **API Interface:**

```typescript
// New interfaces
export interface CourtConfig {
  courtNumber: number;
  courtName?: string;
}

export interface CreateSessionRequest {
  name: string;
  numberOfCourts: number;
  sessionDuration: number;
  maxPlayersPerCourt: number;
  requirePlayerInfo: boolean;
  startTime?: Date;
  endTime?: Date;
  courts?: CourtConfig[]; // NEW
}
```

#### **Backend Processing:**

```typescript
// API Route: /api/sessions
const courtsConfig = body.courts;

if (courtsConfig && Array.isArray(courtsConfig)) {
  // Use provided configuration
  for (const courtConfig of courtsConfig) {
    courts.push({
      sessionId: session.id,
      courtNumber: courtConfig.courtNumber,
      courtName:
        courtConfig.courtName || generateCourtName(courtConfig.courtNumber),
      status: 'EMPTY' as const,
    });
  }
} else {
  // Fallback to default sequential
  for (let i = 1; i <= session.numberOfCourts; i++) {
    courts.push({
      sessionId: session.id,
      courtNumber: i,
      courtName: generateCourtName(i),
      status: 'EMPTY' as const,
    });
  }
}
```

### 📱 **User Experience:**

#### **Ví dụ sử dụng:**

1. Host chọn "Number of Courts": 3
2. System hiển thị 3 court configuration blocks
3. Host có thể tùy chỉnh:
   - Court 1: Number=1, Name="Sân VIP"
   - Court 5: Number=5, Name="Sân Premium"
   - Court 10: Number=10, Name="Sân Thường"
4. System validate: numbers unique, >= 1
5. Tạo session với courts custom

#### **Features:**

- ✅ **Add Court**: Button "Add Another Court"
- ✅ **Remove Court**: Button "Remove" cho từng sân
- ✅ **Auto-generation**: Default names theo pattern A,B,C...
- ✅ **Validation**: Real-time validation với error messages
- ✅ **Responsive**: UI responsive trên mobile/desktop

### 🎨 **UI Components:**

#### **Court Configuration Block:**

```tsx
<Box p={4} mb={4} borderWidth={2} borderColor="gray.200" borderRadius="md">
  <Flex justify="space-between" align="center" mb={3}>
    <Text fontWeight="semibold">Court {index + 1}</Text>
    {courts.length > 1 && (
      <Button size="sm" colorScheme="red" onClick={() => removeCourt(index)}>
        Remove
      </Button>
    )}
  </Flex>

  <Grid templateColumns="repeat(2, 1fr)" gap={4}>
    <GridItem>
      <Text fontSize="sm" mb={2}>Court Number *</Text>
      <Input
        type="number"
        value={court.courtNumber}
        onChange={...}
        required
      />
    </GridItem>
    <GridItem>
      <Text fontSize="sm" mb={2}>Court Name</Text>
      <Input
        value={court.courtName}
        onChange={...}
        placeholder="e.g., Sân VIP"
      />
    </GridItem>
  </Grid>
</Box>
```

### 🔍 **Testing Scenarios:**

#### **Happy Path:**

1. ✅ Tạo session với default courts (1,2,3)
2. ✅ Tạo session với custom numbers (1,5,10)
3. ✅ Tạo session với custom names ("VIP", "Premium")
4. ✅ Add/remove courts dynamically

#### **Edge Cases:**

1. ✅ Duplicate court numbers → Show error
2. ✅ Invalid court numbers (0, negative) → Show error
3. ✅ Empty court name → Use auto-generated name
4. ✅ Large court numbers (100+) → Valid

#### **Validation:**

- Court numbers must be unique within session
- Court numbers must be >= 1
- Court names are optional
- At least 1 court required

### 🚀 **Benefits:**

1. **Flexibility**: Host có thể tùy chỉnh số và tên sân
2. **Professional**: Tên sân chuyên nghiệp hơn ("Sân VIP" vs "Sân 1")
3. **Scalable**: Hỗ trợ bất kỳ số lượng sân nào
4. **User-friendly**: UI trực quan, validation real-time
5. **Backward Compatible**: Vẫn hỗ trợ auto-generation

---

_Feature completed: July 5, 2025_
_Enhanced session creation with flexible court configuration_
