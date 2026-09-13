
THINH PHAT FOOD — REAL SHOP V1
===============================

Đây là bản có backend thật:
- Node.js + Express
- SQLite database
- Admin đăng nhập bằng tài khoản
- Sản phẩm: thêm/sửa/xóa/giá/mã/quy cách/ảnh
- Đơn hàng được lưu database
- Admin cập nhật trạng thái đơn
- Cài được trên hosting/VPS
- Giao diện responsive cho điện thoại
- Có manifest PWA để có thể "Add to Home Screen"

CHẠY TRÊN MÁY:
1. Cài Node.js 20+
2. Mở terminal trong thư mục này.
3. Chạy: npm install
4. Đặt biến môi trường:
   ADMIN_EMAIL=toda98520@gmail.com
   ADMIN_PASSWORD=Hoailam778979999
   JWT_SECRET=CHUỖI_BÍ_MẬT_DÀI
5. Chạy: npm start
6. Mở http://localhost:3000

QUAN TRỌNG TRƯỚC KHI ONLINE:
- Bắt buộc đổi ADMIN_PASSWORD và JWT_SECRET.
- Dùng HTTPS.
- Sao lưu thư mục data/shop.db.
- Có thể đặt sau Nginx/Cloudflare.
- Bản này chưa tích hợp cổng thanh toán; đơn hàng online đã có, thanh toán có thể nối tiếp.
- Ảnh Julia Alex chỉ hiển thị nếu anh nhập URL/file ảnh được phép sử dụng.
