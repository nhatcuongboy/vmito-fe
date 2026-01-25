# i18n Translation Scripts

Bộ công cụ tự động để quản lý và đồng bộ file translation.

## 📋 Available Scripts

### 1. Check i18n (`npm run i18n:check`)
```bash
npm run i18n:check
# hoặc
node scripts/check-i18n.js
```

**Chức năng:**
- Kiểm tra số lượng keys trong mỗi file
- Tìm keys thiếu trong VI và CN
- Tìm keys thừa trong VI và CN
- Phát hiện duplicate keys
- Báo cáo chi tiết các vấn đề

**Output ví dụ:**
```
========================================
📊 Translation Files Comparison Report
========================================

📈 Statistics:
   EN: 1318 keys
   VI: 1318 keys
   CN: 1318 keys

✅ All translation files are synchronized!
```

---

### 2. Fix i18n (`npm run i18n:fix`)
```bash
npm run i18n:fix
# hoặc
node scripts/fix-i18n.js
```

**Chức năng:**
- Tự động thêm keys thiếu vào VI và CN (dùng giá trị EN làm placeholder)
- Tự động xóa keys thừa
- Cập nhật file và báo cáo số lượng thay đổi

**Output ví dụ:**
```
🔧 Starting i18n fix process...

📝 Fixing VI translations...
   ✅ Added: pages.tournaments.playersLabel
   🗑️  Removed extra: pages.tournaments.players.title

✨ Fix complete!
   VI: 29 keys added, 28 keys removed
   CN: 86 keys added, 46 keys removed
```

---

### 3. Sort i18n (`npm run i18n:sort`)
```bash
npm run i18n:sort
# hoặc
node scripts/sort-i18n.js
```

**Chức năng:**
- Sắp xếp lại thứ tự keys trong VI và CN để giống với EN
- Đảm bảo cấu trúc file đồng nhất
- Dễ dàng so sánh và review

**Output ví dụ:**
```
🔄 Starting key sorting process...

📝 Sorting VI keys to match EN order...
📝 Sorting CN keys to match EN order...

💾 Writing sorted files...
   ✅ vi.json sorted
   ✅ cn.json sorted

✨ Sorting complete!
```

---

### 4. Sync i18n (`npm run i18n:sync`) - **RECOMMENDED** ⭐
```bash
npm run i18n:sync
# hoặc
node scripts/i18n-sync.js
```

**Chức năng:**
Kết hợp tất cả các bước:
1. ✅ Kiểm tra và thêm/xóa keys
2. 🗑️ Xóa empty objects
3. 📋 Sắp xếp keys theo thứ tự EN
4. ✅ Xác minh kết quả cuối cùng

**Output ví dụ:**
```
========================================
   i18n Synchronization Tool
========================================

📖 Reading translation files...
   EN: 1318 keys
   VI: 1318 keys
   CN: 1318 keys

🔍 Checking for missing/extra keys...
   ✅ No missing or extra keys

🗑️  Removing empty objects...
   ✅ No empty objects found

📋 Sorting keys to match EN order...
   ✅ Keys sorted

💾 Writing files...
   ✅ Files updated

✅ Verification...
   EN: 1318 keys
   VI: 1318 keys
   CN: 1318 keys

========================================
   ✨ All files synchronized! ✨
========================================
```

---

## 🔄 Workflow Khuyến Nghị

### Khi thêm translation keys mới:

1. **Thêm vào file EN trước** (file gốc):
   ```json
   // src/i18n/messages/en.json
   {
     "newFeature": {
       "title": "New Feature",
       "description": "This is a new feature"
     }
   }
   ```

2. **Chạy sync để cập nhật VI và CN**:
   ```bash
   npm run i18n:sync
   ```

3. **Dịch các key mới trong VI và CN**:
   ```json
   // src/i18n/messages/vi.json
   {
     "newFeature": {
       "title": "Tính năng mới",
       "description": "Đây là tính năng mới"
     }
   }
   ```

4. **Kiểm tra lại**:
   ```bash
   npm run i18n:check
   ```

### Trước khi commit:

```bash
# Luôn chạy sync để đảm bảo đồng bộ
npm run i18n:sync

# Kiểm tra
npm run i18n:check
```

---

## 📁 File Structure

```
src/i18n/messages/
├── en.json  (Chuẩn - file gốc)
├── vi.json  (Tiếng Việt)
└── cn.json  (中文 - Chinese)
```

---

## ⚙️ Scripts Details

### check-i18n.js
- Read only - không thay đổi file
- Báo cáo chi tiết về synchronization status
- Exit code 1 nếu có vấn đề (dùng cho CI/CD)

### fix-i18n.js
- Tự động sửa missing/extra keys
- Dùng giá trị EN làm placeholder
- Không sắp xếp thứ tự keys

### sort-i18n.js
- Chỉ sắp xếp thứ tự keys
- Không thêm/xóa keys
- Đảm bảo consistency

### i18n-sync.js (All-in-one)
- Kết hợp tất cả chức năng
- **Khuyến nghị sử dụng script này**
- Output có màu sắc dễ đọc

---

## 🎯 Best Practices

1. ✅ **Luôn sửa EN file trước** - EN là source of truth
2. ✅ **Chạy `npm run i18n:sync` sau mỗi lần thay đổi**
3. ✅ **Review VI và CN translations sau khi sync**
4. ✅ **Commit translation files cùng với code changes**
5. ✅ **Chạy `i18n:check` trong CI/CD pipeline**

---

## 🚨 Troubleshooting

### Keys không match sau khi sync?
```bash
# Xóa node_modules/.cache và thử lại
rm -rf node_modules/.cache
npm run i18n:sync
```

### Có duplicate keys?
Scripts sẽ tự động phát hiện và báo cáo. Review code để tìm và xóa duplicates.

### Empty objects vẫn còn?
```bash
# Chạy sync sẽ tự động xóa
npm run i18n:sync
```

---

## 📊 Statistics

Sau khi sync hoàn tất:
- ✅ **1318 keys** trong mỗi file
- ✅ **100% synchronized**
- ✅ **Cùng thứ tự keys**
- ✅ **Không có empty objects**

---

## 🤝 Contributing

Khi thêm translation keys mới:
1. Thêm vào EN với giá trị tiếng Anh đúng
2. Chạy `npm run i18n:sync`
3. Dịch sang VI và CN
4. Commit tất cả 3 files

---

## 📝 Notes

- EN file luôn là source of truth
- VI và CN sẽ tự động follow cấu trúc của EN
- Scripts không ghi đè translations đã có
- Chỉ thêm placeholder cho keys mới (dùng giá trị EN)
