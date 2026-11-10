# PokéCatch của Umi

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Người dùng chọn HTML, CSS và JavaScript thuần, có thể cài và chơi offline trên điện thoại. Đưa mã nguồn lên GitHub và xuất bản qua GitHub Pages.

## Users

Chủ dự án muốn có bản game riêng, chơi trên điện thoại ngay từ liên kết web và tiếp tục chơi khi mất mạng.

## Product Purpose

Giữ cách chơi và phong cách của https://pokecatchvn.xyz/, dùng bộ asset công khai của trang tham chiếu, có đầy đủ vòng chơi đơn và hoạt ảnh có trong bản frontend đã thu thập.

## Operating Context

Chơi một người. Lưu tiến trình trên thiết bị. Tải game và tài nguyên khi có mạng trước khi chơi offline. Không yêu cầu tài khoản hay kết nối máy chủ của trang tham chiếu.

## Capabilities and Constraints

- Giữ vòng chơi khám phá, chiến đấu, bắt Pokémon, đội hình và tiến hóa của bản frontend được khảo sát.
- Tài nguyên phải được lưu trong dự án, không phụ thuộc CDN lúc chơi offline.
- Tiến trình riêng, có xuất và nhập bản lưu.
- Các tính năng cần người chơi khác hoặc máy chủ không thuộc vòng chơi offline.
- Kiểm tra ở kích thước màn hình điện thoại và máy tính; kiểm tra mất mạng bằng trình duyệt. Chưa có bằng chứng chạy trực tiếp trên điện thoại thật của người dùng.

## Brand Commitments

Người dùng chọn giữ phong cách game tham chiếu và dùng asset của chính trang đó. Giao diện tiếng Việt. Đây là bản fan game cá nhân, phi thương mại, không phải sản phẩm chính thức của Pokémon hay máy chủ Pokecatch.

## Evidence on Hand

Trang tham chiếu được tải ngày 10/11/2026. REA đã mở trang trong Chrome 430 x 932, chụp giao diện và thu DOM, không ghi nhận page-error trong lượt khảo sát. HTML, bộ khởi động và bundle được giữ trong `.research/` để khảo sát, không đưa vào bản xuất bản.

## Product Principles

- Chơi được trước, giữ đúng vòng chơi đã khảo sát.
- Asset, hoạt ảnh và phần lưu hoạt động khi không có mạng.
- Báo trung thực tiến độ tải offline và lỗi thiếu tài nguyên.
- Dùng thao tác quen thuộc trên màn hình cảm ứng.
