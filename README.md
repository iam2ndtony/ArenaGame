# 🚩 MARXARENA - Đấu Trường Trắc Nghiệm Mác – Lênin (Real-time Multiplayer Quiz)

**MarxArena** là website trò chơi trắc nghiệm đấu trường nhiều người chơi theo thời gian thực (lấy cảm hứng từ thể thức mở rương kịch tính của Blooket nhưng mang phong cách hào hùng, độc bản và hiện đại). Dự án phục vụ ôn tập, củng cố kiến thức và thuyết trình học phần **Những nguyên lý cơ bản của Chủ nghĩa Mác – Lênin (MLN131)**.

---

## 🌟 Tính Năng Nổi Bật

1. **Quét Mã QR Vào Phòng Tức Thì**:
   - Chủ phòng (Giảng viên / Nhóm trưởng) tạo phòng trên màn hình máy chiếu.
   - Hệ thống tự động nhận diện IP nội bộ Wi-Fi và sinh mã QR động kèm mã PIN 6 số.
   - Người chơi (Sinh viên) dùng camera điện thoại quét mã QR để vào thẳng phòng, không cần cài app hay đăng ký tài khoản.

2. **Cơ Chế Đấu Trường Mở Rương & Cướp Điểm (Gold Quest Style)**:
   - Người chơi trả lời câu hỏi trắc nghiệm theo nhịp độ cá nhân trong thời gian giới hạn (3, 5, 7 hoặc 10 phút).
   - **Trả lời đúng**: Được chọn 1 trong 3 **Rương Thần Bí** (Cộng +50 đến +350 điểm, x2 điểm hiện có, cướp 15–25% điểm đối thủ, hoán đổi điểm ngoạn mục, hoặc bật khiên bảo vệ 30s).
   - **Trả lời sai**: Nhận giải thích lý thuyết chi tiết và chịu thời gian phạt 3 giây.

3. **Bảng Xếp Hạng & Bục Vinh Danh Podium**:
   - Màn hình máy chiếu hiển thị **Live Leaderboard** mượt mà cùng **Nhật ký đấu trường** (tường thuật ai cướp điểm của ai theo thời gian thực).
   - Khi hết giờ: Tự động kích hoạt hiệu ứng pháo hoa, vinh danh Quán quân Top 3 trên bục trao giải (Huy chương Vàng, Bạc, Đồng) và thống kê độ chính xác % toàn lớp.

4. **Bộ Câu Hỏi Chuẩn & Dễ Dàng Mở Rộng**:
   - Nạp sẵn hơn 30 câu hỏi trắc nghiệm chuẩn về Triết học, Kinh tế chính trị, CNXHKH.
   - Hỗ trợ tải lên file JSON hoặc dán bộ câu hỏi tùy chỉnh trực tiếp trên giao diện web.

5. **Âm Thanh Game Độc Lập**:
   - Sử dụng **Web Audio API Synthesizer** tích hợp sẵn trong trình duyệt (tiếng ting đúng, tiếng buzzer sai, tiếng mở rương báu, nhạc victory fanfare) – không lo lỗi mạng tải file mp3.

---

## 🚀 Cách Cài Đặt Và Khởi Chạy

### Yêu cầu môi trường
- **Node.js**: Phiên bản 18 trở lên (đã kiểm thử mượt mà trên Node.js v24).

### Bước 1: Khởi động máy chủ
Mở terminal tại thư mục `marx-arena` và chạy lệnh:
```bash
npm run dev
```

### Bước 2: Trình chiếu cho lớp học
- Trên máy tính kết nối máy chiếu, mở trình duyệt vào:
  ```
  http://localhost:3000
  ```
- Bấm **"TẠO PHÒNG MÁY CHIẾU (HOST)"**, chọn thời gian (ví dụ 5 phút) rồi bấm **"TIẾN VÀO SẢNH CHỜ"**.
- Màn hình sẽ hiện mã PIN và mã QR to rõ ràng.

### Bước 3: Người chơi tham gia từ điện thoại
- Cả lớp chỉ cần kết nối cùng mạng Wi-Fi với máy tính của bạn.
- Mở Camera hoặc Zalo quét mã QR trên màn hình chiếu, nhập Biệt danh & chọn Linh vật yêu thích rồi sẵn sàng chiến đấu!

---

## 📁 Cấu Trúc Thư Mục

```text
marx-arena/
├── package.json               # Cấu hình dự án và dependencies
├── server.mjs                 # Custom Node.js Server + Socket.IO + IP auto-discovery
├── next.config.mjs            # Cấu hình Next.js
├── tsconfig.json              # TypeScript config
├── src/
│   ├── app/
│   │   ├── globals.css        # Hệ thống giao diện game độc bản, glassmorphism
│   │   ├── layout.tsx         # Layout chính, Google Fonts, Responsive viewport
│   │   ├── page.tsx           # Trang chủ (Vào phòng bằng PIN hoặc Tạo phòng Host)
│   │   ├── host/
│   │   │   ├── new/page.tsx   # Cấu hình thời gian & câu hỏi trước khi mở phòng
│   │   │   └── [pin]/page.tsx # Màn hình máy chiếu (Sảnh chờ, Đấu trường, Bục vinh danh)
│   │   └── play/
│   │       └── [pin]/page.tsx # Giao diện điện thoại người chơi (Chọn avatar, trả lời, mở rương)
│   ├── data/
│   │   └── questions.json     # Bộ 30 câu hỏi chuẩn Mác - Lênin có giải thích chi tiết
│   └── utils/
│       ├── audio.ts           # Web Audio API Synthesizer phát âm thanh trực tiếp
│       └── avatars.ts         # Danh sách 12 linh vật hoạt họa đại diện người chơi
```
