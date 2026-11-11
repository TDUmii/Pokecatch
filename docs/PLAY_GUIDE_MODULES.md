# Cẩm nang, thẻ Pokémon và tốc độ

| Cần sửa | Tệp sở hữu | Kiểm tra tập trung |
| --- | --- | --- |
| Khắc hệ, đối thủ bản đồ, xếp đội đang có | `bundle/guide-rules.js` | `node scripts/verify-guide-rules.mjs` |
| Trang Khắc hệ/Đội theo bản đồ trong Cẩm nang | `bundle/guide-ui.js`, `bundle/guide-ui.css` | Trình duyệt, chọn hệ/chương, chuyển về hướng dẫn cũ |
| Hàng Tính cách và tooltip của thẻ | `bundle/pokemon-card.css`, `bundle/pokemon-card.js` | `node scripts/verify-pokemon-card.mjs` và hover/focus/chạm thực trong trình duyệt |
| Lựa chọn tốc độ phiêu lưu | `boot.js`, `CONFIG.SPEEDS` / `SPEED_PACE` trong bundle gốc | `node scripts/verify-adventure-speed.mjs` |

`UmiGuideRules.install(engine)` nối dữ liệu. `typeInfo(type,{defender2})` trả hiệu quả tấn công/phòng thủ; `snapshot(chapterId)` trả bản đồ, đối thủ, hệ nên có, tối đa sáu Pokémon đang sở hữu và gợi ý bắt thêm. Module không ghi game hoặc tự thay đội. Khắc hệ ưu tiên hàm `Adventure.effectiveness`; bản đồ dùng `STORY.CHAPTERS`, đội thủ lĩnh và nhóm gặp thực của engine. Xếp đội là heuristic theo chiêu, chỉ số, cấp hiệu dụng và độ phủ; chưa mô phỏng đầy đủ một trận đấu.

`UmiGuideUI` gắn vào Cẩm nang gốc, không gắn vào hộp Cài đặt có chung một số class. Dùng namespace `umi-guide-`, tránh `ug-` vì Hầm Ngầm đã sở hữu các class đó. CSS cột đáp ứng theo vùng nội dung, không theo riêng chiều rộng cửa sổ.

`UmiPokemonCard.install()` gọi lặp an toàn. Tooltip trong `.dexcard.v2` được chiếu sang `#umi-pokemon-tooltip`, giới hạn trong viewport và đóng khi cuộn/đổi thẻ. Không đổi `overflow` toàn modal để sửa lỗi cắt tooltip.

Thêm mức tốc độ phải đồng thời có nút, giá trị được chấp nhận và hệ số nhịp thực. Bài kiểm tra tốc độ trích hàm gốc: ×20 tạo 200 bước trong 28 giây mô phỏng, ×10 tạo 100. Giới hạn hoạt ảnh và xử lý khi đóng game là cơ chế riêng. Không khôi phục gói quay Sòng bạc giá 1.000 tiền đã bị người dùng yêu cầu gỡ.

Trước phát hành chạy build, chờ xong rồi bộ verify tổng. Kiểm tra thẻ có tên/Tính cách tiếng Việt dài, tooltip gần mép và Cẩm nang trên màn hình hẹp/rộng. Bài Node không thay thế kiểm tra bố cục bằng trình duyệt.
