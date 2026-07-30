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

## 🚀 Hướng dẫn cài đặt chi tiết (Dành cho người không biết code)

### 📌 Bước 1: Tải extension
1. Bấm nút **Code** (màu xanh ở trên cùng trang GitHub này) ➔ Chọn **Download ZIP**.
2. Giải nén tệp `.zip` vừa tải về, bạn sẽ nhận được thư mục chứa extension (ví dụ: `Gemielle`).

### 📌 Bước 2: Lưu trữ thư mục cài đặt
*(Lưu ý: Lưu thư mục vào đúng vị trí dữ liệu tiện ích của Chrome để tránh vô tình xóa tệp khiến Extension ngưng hoạt động)*

- **Dành cho Windows:**
  1. Nhấn tổ hợp phím **Windows + R** trên bàn phím để mở hộp thoại **Run**.
  2. Nhập hoặc dán đường dẫn sau rồi nhấn **Enter**:
     ```text
     %LOCALAPPDATA%\Google\Chrome\User Data\Default\Extensions
     ```
  3. Cửa sổ thư mục sẽ mở ra. Hãy **chép (copy) thư mục `Gemielle`** vào đây.

- **Dành cho macOS:**
  1. Mở **Finder**, nhấn tổ hợp phím **Command + Shift + G** (hoặc chọn menu *Go* ➔ *Go to Folder...*).
  2. Nhập đường dẫn sau rồi nhấn **Return (Enter)**:
     ```text
     ~/Library/Application Support/Google/Chrome/Default/Extensions
     ```
  3. Cửa sổ thư mục sẽ mở ra. Hãy **chép (copy) thư mục `Gemielle`** vào đây.

### 📌 Bước 3: Thêm vào trình duyệt Chrome
1. Mở Google Chrome, nhập địa chỉ sau vào thanh tìm kiếm rồi nhấn **Enter**:
   ```text
   chrome://extensions/
   ```
2. Bật công tắc **Chế độ dành cho nhà phát triển (Developer mode)** ở góc trên bên phải màn hình.
3. Nhấn vào nút **Tải tiện ích đã giải nén (Load unpacked)** ở góc trên bên trái.
4. Chọn đến thư mục `Gemielle` bạn vừa lưu ở Bước 2 và bấm **Select / Open**.
5. Mở [Google Gemini](https://gemini.google.com/) để bắt đầu trải nghiệm trợ lý Gemielle ở góc màn hình! 🎉

---

## ⚠️ Miễn trừ trách nhiệm (Disclaimer)

- **Gemielle** là một dự án mã nguồn mở cá nhân được phát triển độc lập và **không liên kết, hợp tác, đại diện hay được tài trợ bởi Google LLC / Google Gemini**.
- Extension hoạt động hoàn toàn ở phía client (Client-side), chỉ tương tác với DOM giao diện trình duyệt và **không thu thập, lưu trữ hay gửi bất kỳ dữ liệu cá nhân nào** của người dùng.