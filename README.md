# 🌸 Gemielle - AI Assistant Widget for Gemini & ChatGPT

**Gemielle** là Chrome Extension hiển thị "Trợ lý AI" sinh động ở góc màn hình khi bạn sử dụng **Google Gemini** (`gemini.google.com`) và **ChatGPT** (`chatgpt.com`). Trợ lý sẽ tự động đổi biểu cảm theo thời gian thực tương ứng với hành vi của bạn và AI (gõ prompt, suy nghĩ, tạo ảnh, sinh chữ, hoàn thành).

---

## 🎭 Các trạng thái trợ lý (Assistant States)

| Trạng thái | Biểu tượng GIF | Mô tả |
| :--- | :---: | :--- |
| **WAITING** | ![Waiting](assets/waiting_user_input.gif) | Trợ lý đang ở trạng thái chờ người dùng nhập prompt. |
| **USER_TYPING** | ![User Typing](assets/user_typing.gif) | Bạn đang gõ văn bản hoặc dán (Ctrl+V) vào ô nhập liệu. |
| **AI_THINKING** | ![AI Thinking](assets/ai_thingking.gif) | AI đang suy nghĩ, xử lý yêu cầu hoặc tìm kiếm thông tin web. |
| **AI_TYPING** | ![AI Typing](assets/ai_typing.gif) | AI đang sinh văn bản hoặc đang tạo hình ảnh. |
| **AI_COMPLETE** | ![AI Complete](assets/ai_complete_answer.gif) | AI đã hoàn thành xong câu trả lời/ảnh. |

---

## 🚀 Hướng dẫn cài đặt

1. **Tải tiện ích:**
   - **Cách 1 (Khuyên dùng):** Truy cập mục **Releases** ở cột bên phải GitHub ➔ Tải bản `.zip` mới nhất và giải nén.
   - **Cách 2:** Nhấn nút **Code** ➔ Chọn **Download ZIP** và giải nén (hoặc dùng `git clone`).
   > 📌 **Lưu ý:** Đảm bảo lưu thư mục sau khi giải nén tại một vị trí cố định trên máy tính (không xóa hay di chuyển thư mục này) để extension hoạt động ổn định.
2. **Mở quản lý Extension:** Mở Google Chrome và truy cập địa chỉ `chrome://extensions/`.
3. **Bật Developer Mode:** Bật công tắc **Chế độ dành cho nhà phát triển (Developer mode)** ở góc trên bên phải.
4. **Cài đặt tiện ích:** Nhấn nút **Tải tiện ích đã giải nén (Load unpacked)** ở góc trên bên trái ➔ Chọn thư mục `Gemielle` vừa giải nén.
5. **Trải nghiệm:** Mở [Google Gemini](https://gemini.google.com/) hoặc [ChatGPT](https://chatgpt.com/) để trải nghiệm trợ lý! 🎉

---

## ⚠️ Miễn trừ trách nhiệm (Disclaimer)

- **Gemielle** là dự án mã nguồn mở cá nhân, hoạt động hoàn toàn ở phía client (Client-side), **không liên kết chính thức với Google LLC hay OpenAI**, và **không thu thập bất kỳ dữ liệu cá nhân nào**.