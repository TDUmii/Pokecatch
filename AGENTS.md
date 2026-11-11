# Quy ước làm việc

@C:\Users\ADMIN\.codex\RTK.md

Với lệnh qua PowerShell của Codex Desktop, thêm `rtk` trước CLI được RTK hỗ trợ. Giữ nguyên lệnh PowerShell và CLI không được hỗ trợ. Chỉ dùng `rtk proxy` khi cần đầu ra đầy đủ hoặc kết quả lọc không dùng được.

## Sửa theo mô-đun

- Trước khi sửa Sòng bạc, đọc `docs/CASINO_MODULES.md` và chọn hàng ứng với tính năng cần đổi.
- Đọc mô-đun sở hữu tính năng, hợp đồng phụ thuộc và kiểm tra tương ứng. Mở rộng phạm vi khi thay đổi hợp đồng, gặp lỗi hoặc có bằng chứng ảnh hưởng tính năng khác.
- Giữ quà quay thường trong `casino-rewards.js`, tab Sòng bạc trong `casino-ui.js`, quầy đổi mảnh trong `casino-exchange-ui.js` và CSS riêng, thao tác quà trong `umi-arcade-ui.js`, bố cục toàn app trong `responsive.css`.
- Không thêm tính năng mới vào `app.f9da276408.js`. Bundle này chỉ giữ các callback nối với engine gốc; sửa điểm nối khi thay đổi native thật sự yêu cầu.
- Sửa nhỏ chạy kiểm tra của tính năng đó. Trước phát hành chạy build rồi bộ kiểm tra tổng; thay đổi UI phải xem cả màn hình hẹp và rộng.
- Giữ bản lưu hiện có và tương thích dữ liệu cũ. Người dùng đã yêu cầu gỡ gói quay nhanh ×10/×100 giá 1.000 tiền vì lỗi; không thêm lại. Tốc độ phiêu lưu ×10 vẫn là tính năng riêng.
