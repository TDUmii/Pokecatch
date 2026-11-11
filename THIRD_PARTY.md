# Nguồn game và tài nguyên

Bản fan game cá nhân, phi thương mại này bảo toàn frontend và phong cách của [Pokecatch VN](https://pokecatchvn.xyz/), thu thập từ các tệp công khai ngày 10/11/2026. Các tên Pokémon, nhân vật và tài nguyên liên quan thuộc Nintendo, Game Freak, Creatures và các chủ sở hữu tương ứng. Không tuyên bố sở hữu hay cấp lại giấy phép cho tài nguyên bên thứ ba.

Các sprite được trang tham chiếu ghi nguồn Pokémon Showdown và PokéSprite. Nguồn gốc cụ thể, dung lượng và SHA-256 của mỗi tài nguyên đã thu thập được ghi trong `assets-manifest.json`. Các tệp GIF giữ hoạt ảnh gốc. Với tài nguyên Mega đóng gói, bộ thu thập áp dụng cùng phép biến đổi byte mà service worker công khai của trang dùng để trình duyệt hiển thị ảnh.

Phông Jersey 10 và Jersey 15 được lấy qua CSS Google Fonts mà trang intro công khai sử dụng và lưu cục bộ để hỗ trợ offline; các phông này do Soft Type phát hành theo SIL Open Font License 1.1. Các tệp giấy phép của dự án phông được lưu kèm trong `assets/fonts/`.

Giao diện tiếng Việt dùng Be Vietnam Pro của The Be Vietnam Pro Project Authors (Lâm Bảo, Tony Le, ViệtAnh Nguyễn), lấy từ kho Google Fonts chính thức theo SIL Open Font License 1.1. Các tệp font đầy đủ ký tự và giấy phép được lưu trong `assets/fonts/`; giao diện không cần kết nối Google Fonts khi chơi.

Phần thích ứng cá nhân gồm shell PWA, cơ chế cache và tải offline, khóa lưu riêng, xuất/nhập tiến trình, chặn kết nối máy chủ gốc, đường dẫn tương đối cho GitHub Pages và kiểm tra đóng gói. Bản này không kết nối tài khoản, sàn giao dịch hoặc bảng xếp hạng của máy chủ gốc.

Mười hai biểu tượng SVG trong `assets/umi/` được vẽ riêng cho khu quà của bản cá nhân. Phần mở rộng Mega chỉ dùng bảng dạng, chỉ số, hệ và tài nguyên hình tương ứng từ các tệp công khai đã thu thập; không chạy hoặc tích hợp mã quản trị, xác thực hay máy chủ của bên khác.
