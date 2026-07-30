# 🌸 Gemielle - Gemini AI Assistant Widget

**Gemielle** là một Chrome Extension giúp hiển thị một "trợ lý AI" sinh động ở góc màn hình khi bạn sử dụng Google Gemini Web (`gemini.google.com`). Trợ lý sẽ tự động biểu cảm và chuyển đổi trạng thái theo thời gian thực tương ứng với hành vi của bạn và AI.

---

## ✨ Tính năng nổi bật

- 🎭 **5 Trạng thái biểu cảm linh hoạt:** Theo dõi chính xác từng bước tương tác giữa User và Gemini.
- 🖱️ **Kéo thả tự do (Drag & Drop):** Bạn có thể dễ dàng "túm" và di chuyển Gemielle đến bất kỳ góc nào trên màn hình.
- ⚡ **Nhận diện chính xác & Mượt mà:**
  - Nhận diện khi user gõ prompt hoặc xoá trắng input.
  - Phân biệt chính xác giữa lúc AI suy nghĩ/tìm kiếm web (Grounding) với lúc AI thực sự sinh chữ.
  - Phản hồi trạng thái ngay lập tức khi AI kết thúc câu trả lời.

---

## 🎭 Các trạng thái trợ lý (Assistant States)

| Trạng thái | Biểu tượng GIF | Mô tả |
| :--- | :---: | :--- |
| **WAITING** | ![Waiting](assets/waiting_user_input.gif) | Trợ lý đang ở trạng thái chờ người dùng nhập prompt. |
| **USER_TYPING** | ![User Typing](assets/user_typing.gif) | Bạn đang gõ văn bản vào ô nhập liệu của Gemini. |
| **AI_THINKING** | ![AI Thinking](assets/ai_thingking.gif) | AI đang suy nghĩ, xử lý yêu cầu hoặc tìm kiếm thông tin trên Web. |
| **AI_TYPING** | ![AI Typing](assets/ai_typing.gif) | AI đang bắt đầu sinh và xuất văn bản trả lời. |
| **AI_COMPLETE** | ![AI Complete](assets/ai_complete_answer.gif) | AI đã hoàn thành xong câu trả lời. |

---

## 🚀 Hướng dẫn cài đặt

1. **Tải/Clone dự án** về máy tính của bạn.
2. Mở trình duyệt Google Chrome và truy cập địa chỉ: `chrome://extensions/`
3. Bật **Chế độ dành cho nhà phát triển (Developer mode)** ở góc trên bên phải.
4. Bấm vào nút **Tải tiện ích đã giải nén (Load unpacked)**.
5. Chọn thư mục dự án **`Gemielle`**.
6. Truy cập [Google Gemini](https://gemini.google.com/) và trải nghiệm! 🎉