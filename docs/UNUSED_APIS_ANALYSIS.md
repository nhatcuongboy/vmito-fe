# Phân tích API Endpoints - Sử dụng vs Chưa sử dụng

## 📋 Danh sách tất cả API Endpoints có sẵn:

### ✅ **ĐANG SỬ DỤNG (Used API Endpoints)**

#### Sessions APIs:

- ✅ `/sessions` (GET, POST) - SessionService.getAllSessions(), createSession()
- ✅ `/sessions/[id]` (GET, PUT, DELETE) - SessionService.getSession(), updateSession(), deleteSession()
- ✅ `/sessions/[id]/start` (POST) - SessionService.startSession()
- ✅ `/sessions/[id]/end` (POST) - SessionService.endSession()
- ✅ `/sessions/[id]/migrate-end` (POST) - SessionService.migrateEndedSession()
- ✅ `/sessions/[id]/status` (PATCH, GET) - SessionService.updateSessionStatus(), RealTimeService.getSessionStatus()
- ✅ `/sessions/[id]/courts` (GET) - SessionService.getSessionCourts()
- ✅ `/sessions/[id]/players` (GET, POST) - SessionService.getSessionPlayers(), PlayerService.createPlayer()
- ✅ `/sessions/[id]/players/[playerId]` (PATCH, DELETE) - PlayerService.updatePlayerBySession(), deletePlayerBySession()
- ✅ `/sessions/[id]/players/bulk` (POST, GET) - PlayerService.createBulkPlayers(), getBulkPlayersInfo()
- ✅ `/sessions/[id]/players/bulk-update` (PATCH) - PlayerService.bulkUpdatePlayers()
- ✅ `/sessions/[id]/players/statistics` (GET) - SessionService.getPlayerStatistics()
- ✅ `/sessions/[id]/waiting-queue` (GET) - SessionService.getWaitingQueue()
- ✅ `/sessions/[id]/matches` (GET, POST) - SessionService.getSessionMatches(), MatchService.getSessionMatches(), createMatch()
- ✅ `/sessions/[id]/matches/[matchId]/end` (PATCH) - MatchService.endMatch()
- ✅ `/sessions/[id]/auto-assign` (POST) - MatchService.autoAssignPlayers()
- ✅ `/sessions/[id]/wait-times` (PUT, GET) - WaitTimeService.updateSessionWaitTimes(), getWaitTimeStats()
- ✅ `/update-wait-times` (POST) - WaitTimeUpdater.tsx background updates

#### Players APIs:

- ✅ `/players/[id]` (GET, PUT, DELETE) - PlayerService.getPlayer(), updatePlayer(), deletePlayer()
- ✅ `/players/[id]/confirm` (POST) - PlayerService.confirmPlayer()

#### Courts APIs:

- ✅ `/courts/[id]` (GET, PATCH) - CourtService.getCourt(), updateCourt()
- ✅ `/courts/[id]/suggested-players` (GET) - CourtService.getSuggestedPlayersForCourt()
- ✅ `/courts/[id]/select-players` (POST) - CourtService.selectPlayers()
- ✅ `/courts/[id]/deselect-players` (POST) - CourtService.deselectPlayers()
- ✅ `/courts/[id]/start-match` (POST) - CourtService.startMatch()
- ✅ `/courts/[id]/end-match` (POST) - CourtService.endMatch()
- ✅ `/courts/[id]/current-match` (GET) - CourtService.getCurrentMatch()
- ✅ `/courts/[id]/pre-select` (POST, DELETE, GET) - CourtService.preSelectPlayers(), cancelPreSelect(), getPreSelect()

---

## ❌ **CHƯA SỬ DỤNG (Unused API Endpoints)**

### ❌ Health APIs:

- `/health` (GET) - **Chưa được sử dụng trong client-side code**

### ❌ PWA APIs:

- `/pwa/subscribe` (POST, DELETE) - **Chưa được sử dụng trong client-side code**
- `/pwa/sync` (POST, GET) - **Chưa được sử dụng trong client-side code**

### ❌ Player Utils APIs:

- `/players/update-wait-times` (PUT) - **Chưa được sử dụng (có thể deprecated)**

### ✅ **CẬP NHẬT**: Các API được sử dụng sau khi kiểm tra lại:

- ✅ `/update-wait-times` (POST) - **ĐANG SỬ DỤNG** trong `WaitTimeUpdater.tsx`

---

## 🔍 **Chi tiết phân tích:**

### PWA APIs (Chưa sử dụng):

Các API này có thể được sử dụng cho Progressive Web App features:

- **Subscribe**: Để đăng ký push notifications
- **Sync**: Để đồng bộ dữ liệu offline

### Health API (Chưa sử dụng):

- Có thể được sử dụng cho health checks hoặc monitoring
- Thường được gọi bởi load balancers hoặc monitoring tools

### Deprecated APIs:

- `/players/update-wait-times` có vẻ đã được thay thế bởi:
  - `/sessions/[id]/wait-times` trong WaitTimeService
- `/update-wait-times` **VẪN ĐANG SỬ DỤNG** trong WaitTimeUpdater component

---

## 📊 **Thống kê:**

- **Tổng số API endpoints**: 32
- **Đang sử dụng**: 30 endpoints (93.8%)
- **Chưa sử dụng**: 2 endpoints (6.2%)

## 🎯 **Khuyến nghị:**

1. **PWA APIs**: Nên implement PWA features để sử dụng các API này
2. **Health API**: Giữ lại cho monitoring purposes
3. **Deprecated APIs**: Có thể xóa nếu đã được thay thế hoàn toàn
4. **Documentation**: Cập nhật API documentation để phản ánh trạng thái sử dụng
