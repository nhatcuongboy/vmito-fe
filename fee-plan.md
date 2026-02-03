Triển khai tính năng quản lý phí session cho các slot cầu lông của người chơi:

- Khi tạo 1 session, host có thể thiết lập phí cho 1 slot cầu lông trong session. phí được thiết lập theo giới tính của người chơi, hiện tại chỉ triển khai cho 2 giới tính: Nam và Nữ. Tạm thời disable các giới tính khác khi đăng ký người chơi
- phí cũng có thể được set theo các option: Đồng giá, chia đều (sau khi session kết thúc, host sẽ chỉ định giá cụ thể)
- Trên session card, hãy hiển thị giá của session
- quản lý trạng thái thanh toán tiền của người chơi, player có thể thanh toán bằng tiền mặt hoặc chuyển khoản. Tạo 1 trang trong session để cho host có thể cấu hình cách thanh toán: STK, tên ngân hàng, tên chủ tài khoản, mã QR… Đồng thời tạo 1 tab trong trang xem session của player để player có thể xem các thông tin thanh toán. Tôi sẽ integrate tính năng kiểm tra chuyển khoản của người chơi sau. Player có thể đánh dấu đã thanh toán bằng tiền mặt hoặc chuyển khoản (kèm bằng chứng) thủ công. Sau đó host sẽ duyệt những yêu cầu này.
- Quản lý phí các slot theo từng user. user có thể thấy danh sách các phiên giao dịch theo từng host (trên nhiều session chung host). Host cũng có thể danh sách các phiên giao dịch theo từng người chơi (user đã tham gia session của host).
- Đối với user đăng ký nhiều slot trên 1 session, phí của tất cả những người này sẽ tính cho user đăng ký
- Triển khai tính năng đảm bảo tính mở rộng
  UPDATED
