# Cẩm nang, thẻ Pokémon và tốc độ

| Cần sửa | Tệp sở hữu | Kiểm tra tập trung |
| --- | --- | --- |
| Khắc hệ, đối thủ bản đồ, xếp đội đang có | `bundle/guide-rules.js` | `node scripts/verify-guide-rules.mjs` |
| Trang Khắc hệ/Đội theo bản đồ trong Cẩm nang | `bundle/guide-ui.js`, `bundle/guide-ui.css` | Trình duyệt, chọn hệ/chương, chuyển về hướng dẫn cũ |
| Hàng Tính cách và tooltip của thẻ | `bundle/pokemon-card.css`, `bundle/pokemon-card.js` | `node scripts/verify-pokemon-card.mjs` và hover/focus/chạm thực trong trình duyệt |
| Hiển thị nhanh ×10/×20, thời gian chờ và caption | `bundle/adventure-speed.js`, `bundle/adventure-speed.css` | `node scripts/verify-adventure-presentation.mjs`, đo luồng Phiêu lưu đang hiển thị |
| Lựa chọn tốc độ phiêu lưu | `boot.js`, `CONFIG.SPEEDS` / `SPEED_PACE` trong bundle gốc | `node scripts/verify-adventure-speed.mjs` |

`UmiGuideRules.install(engine)` nối dữ liệu. `typeInfo(type,{defender2})` trả hiệu quả tấn công/phòng thủ; `snapshot(chapterId)` trả bản đồ, đối thủ, hệ nên có, tối đa sáu Pokémon đang sở hữu và gợi ý bắt thêm. Module không ghi game hoặc tự thay đội. Khắc hệ ưu tiên hàm `Adventure.effectiveness`; bản đồ dùng `STORY.CHAPTERS`, đội thủ lĩnh và nhóm gặp thực của engine. Xếp đội là heuristic theo chiêu, chỉ số, cấp hiệu dụng và độ phủ; chưa mô phỏng đầy đủ một trận đấu.

`UmiGuideUI` gắn vào Cẩm nang gốc, không gắn vào hộp Cài đặt có chung một số class. Dùng namespace `umi-guide-`, tránh `ug-` vì Hầm Ngầm đã sở hữu các class đó. CSS cột đáp ứng theo vùng nội dung, không theo riêng chiều rộng cửa sổ.

`UmiPokemonCard.install()` gọi lặp an toàn. Tooltip trong `.dexcard.v2` được chiếu sang `#umi-pokemon-tooltip`, giới hạn trong viewport và đóng khi cuộn/đổi thẻ. Không đổi `overflow` toàn modal để sửa lỗi cắt tooltip.

Thêm mức tốc độ phải đồng thời có nút, giá trị được chấp nhận và hệ số nhịp thực. Bài kiểm tra tốc độ trích hàm gốc: ×20 tạo 200 bước trong 28 giây mô phỏng, ×10 tạo 100. Ở ×10/×20, sự kiện thông thường dùng khung hiển thị gọn với chu kỳ 280ms/140ms. Lựa chọn, tiến hóa, bắt loài mới/khác màu, huy hiệu và các mốc không được nhận diện vẫn chạy hiển thị gốc. Tiến trình khi đóng game là cơ chế riêng. Không khôi phục gói quay Sòng bạc giá 1.000 tiền đã bị người dùng yêu cầu gỡ.

Trước phát hành chạy build, chờ xong rồi bộ verify tổng. Kiểm tra thẻ có tên/Tính cách tiếng Việt dài, tooltip gần mép và Cẩm nang trên màn hình hẹp/rộng. Bài Node không thay thế kiểm tra bố cục bằng trình duyệt.

## Đo tốc độ trên màn hình

Không dùng riêng `Adventure.addTime` hoặc generator giả lập để kết luận tốc độ nhìn thấy. `hs()` gốc vẫn gọi `Adventure.step()` một lần rồi chuyển các sự kiện đã được engine xử lý qua callback `__umiAdventurePresentFrame`. Module hiển thị không gây sát thương, không bắt Pokémon và không cấp quà thêm. Callback dùng reducer gốc và dựng lại arena từ state thực; nếu không thuộc allowlist thì giữ `Is()` gốc.

Chu kỳ khung trừ thời gian render, kiểm tra lại màn hình/modal/tốc độ sau chờ và cập nhật caption. Đổi tốc độ qua nút thật reset cờ fast. Khi render đã bắt đầu mà lỗi thì không phát lại các tác dụng UI để tránh lặp thông báo.

Đo 15 giây với Phiêu lưu đang hiển thị, hoạt ảnh bình thường, Chrome1366x900, cùng nhóm hoang dã cấp2-3, fixture HP cao chống thua và các loài đã bắt để tránh modal mới; không giả lập timer hoặc kết quả bước. Kết quả cũ: ×10 15 bước/4 trận thắng, ×20 17 bước/4 thắng. Sau sửa: ×10 53 bước/14 thắng, ×20 93 bước/32 thắng. Loài và lượt đánh ngẫu nhiên nên không dùng số trận này làm cam kết trên mọi bản đồ.

Kiểm tra mobile390 đã thực hiện bắt thường, bản trùng thành XP, hồi máu, KO/thay Pokémon, modal khi bắt loài mới và khác màu, đổi ×20→×1→×20. Các nhánh huy hiệu/tiến hóa/lựa chọn còn được kiểm tra bằng allowlist unit; cần giữ fallback gốc khi bổ sung sự kiện mới.
