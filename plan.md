Mục Tiêu
Cho phép host chỉ định user nào là “thành viên cố định” của một CLB/nhóm theo từng tháng. Khi player tham gia session trong tháng đó, hệ thống tính phí theo trạng thái cố định tháng, không còn suy ra từ việc user thuộc CLB hay không.
Plan Triển Khai
Backend: thêm model đăng ký cố định theo tháng
Tạo bảng mới, ví dụ ClubMonthlyMember hoặc ClubFixedMemberSubscription:
{
id
clubId
userId
month
year
status // ACTIVE | CANCELLED
maleFeeMonthly/femaleFeeMonthly snapshot optional
createdByHostId
createdAt
updatedAt
}
Nên có unique constraint:
unique(clubId, userId, month, year)
Mục đích: một user chỉ có một trạng thái cố định trong một CLB cho một tháng.
Backend: API quản lý thành viên cố định
Thêm API cho host:
GET /clubs/:clubId/fixed-members?month=7&year=2026
POST /clubs/:clubId/fixed-members
DELETE /clubs/:clubId/fixed-members/:userId?month=7&year=2026
Payload khi thêm:
{
userId: string;
month: number;
year: number;
}
Có thể hỗ trợ bulk:
POST /clubs/:clubId/fixed-members/bulk
Backend: tính phí session dựa trên subscription tháng
Khi tạo payment record cho player trong session:
Lấy session.startTime để xác định month/year.
Nếu session có clubId.
Kiểm tra user/player có active monthly fixed subscription trong CLB đó ở tháng đó không.
Nếu có: áp dụng logic “thành viên cố định”.
Nếu không có: áp dụng phí theo buổi hoặc phí vãng lai.
Logic đề xuất:
if (hasMonthlyFixedMembership) {
amount = clubFeeMonthlyAlreadyCollected ? 0 : monthlyFee;
clubFeeApplied = true;
clubFixedMemberApplied = true;
} else if (isClubMember) {
amount = clubFeePerSessionByGender;
} else {
amount = sessionFixedFeeByGender;
}
Quan trọng: không dùng player.isClubMember để xác định fixed member nữa.
Backend: snapshot kết quả tính phí vào PaymentRecord
Nên thêm field để audit rõ ràng:
paymentRecord.feeSource =
'SESSION_FIXED' | 'SESSION_SPLIT' | 'CLUB_PER_SESSION' | 'CLUB_MONTHLY';

paymentRecord.clubId?: string;
paymentRecord.clubFixedMemberApplied?: boolean;
paymentRecord.clubMonthlyMemberId?: string;
Điều này giúp UI hiển thị chính xác và tránh sau này đổi cấu hình phí làm sai lịch sử payment.
Frontend: thêm type API
Trong src/types/club.ts thêm type kiểu:
export interface IClubFixedMember {
id: string;
clubId: string;
userId: string;
month: number;
year: number;
status: 'ACTIVE' | 'CANCELLED';
user: {
id: string;
name: string;
email?: string;
gender?: string;
image?: string;
};
}
Trong ClubsService thêm các method:
getClubFixedMembers(clubId, year, month)
upsertClubFixedMember(clubId, data)
deleteClubFixedMember(clubId, userId, year, month)
Frontend: UI quản lý fixed members theo tháng
Có thể đặt trong trang hiện tại:
[page.tsx](/Users/cuongvnnguyen/Documents/vmito/vmito-fe/src/app/[locale]/host/clubs/[id]/fees/page.tsx)
Trang này đang có cấu hình:
maleFeeMonthly
femaleFeeMonthly
maleFeePerSession
femaleFeePerSession
Nên thêm section bên dưới: Thành viên cố định tháng X/Y
Chức năng:
Chọn tháng/năm dùng chung với cấu hình phí.
Search user/member trong CLB.
Add user vào danh sách cố định tháng.
Remove user khỏi danh sách cố định tháng.
Hiển thị gender để biết phí tháng áp dụng nam/nữ.
Badge trạng thái Đã đăng ký tháng.
Frontend: sửa player/payment UI không gọi nhầm fixed member
Hiện tại SessionPaymentList đang coi player.isClubMember là fixed member. Cần đổi sang field mới từ backend, ví dụ:
payment.clubFixedMemberApplied
Các chỗ cần sửa:
Đếm fixed member.
Filter “fixed members only”.
Badge cạnh amount.
Tooltip “perSessionFee”.
Nên đổi label:
isClubMember -> “Thành viên CLB”
clubFixedMemberApplied -> “Cố định tháng”
Frontend: player management
Trong màn thêm/sửa player hiện có checkbox isClubMember. Không nên dùng checkbox này để quyết định cố định tháng nữa.
Có 2 hướng:
Giữ checkbox “Thành viên CLB” nhưng chỉ dùng để gắn player với CLB.
Thêm badge/read-only “Cố định tháng” nếu user đó có subscription tháng hiện tại.
Không cho host tick fixed member trực tiếp trong session, vì fixed member là trạng thái cấp CLB/tháng, nên quản lý ở trang fees hoặc members.
Migration dữ liệu hiện tại
Nếu production đang có isClubMember dùng như fixed member, cần quyết định migration:
Không tự migrate: tất cả tháng mới host phải chỉ định lại fixed members.
Hoặc migrate mềm: với các player từng có isClubMember = true, gợi ý host import vào fixed members tháng hiện tại.
Mình nghiêng về không auto-migrate để tránh tính sai tiền.
Test cases cần có
Backend:
User thuộc CLB nhưng không fixed tháng -> tính per-session fee.
User fixed tháng -> tính monthly/fixed logic.
User fixed tháng 7 nhưng session tháng 8 -> không áp fixed.
User fixed CLB A nhưng session thuộc CLB B -> không áp fixed.
Guest/non-club player -> tính session fee.
Split-evenly session không bị phá logic.
Frontend:
Trang fees load fixed members theo tháng/năm.
Add/remove fixed member cập nhật list.
Payment list filter đúng theo clubFixedMemberApplied, không theo isClubMember.
Badge “Cố định tháng” chỉ hiện khi backend trả đúng field.
Thứ tự làm hợp lý
Backend model + API fixed monthly members.
Backend payment calculation đổi từ isClubMember sang monthly subscription.
Frontend types + ClubsService.
UI quản lý fixed members trong trang club fees.
Sửa payment UI label/filter/badge.
Test + migration notes.
Điểm cốt lõi: isClubMember chỉ trả lời “người này thuộc CLB không?”, còn “người này là thành viên cố định tháng này không?” phải là một record riêng theo clubId + userId + month + year.
