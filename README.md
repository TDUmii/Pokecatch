# Pokecatch - bản cá nhân ngoại tuyến

Bản chạy riêng để chơi trên máy tính và điện thoại, dựa trên frontend công khai của [Pokecatch Việt Nam](https://pokecatchvn.xyz/). Giữ engine chơi đơn, khám phá, chiến đấu tự động, bắt Pokémon, đội hình, tiến hóa và các khu vực có trong dữ liệu gốc. Đây là bản fan game cá nhân, không phải máy chủ chính thức. Pokémon và các tài sản gốc thuộc chủ sở hữu tương ứng. Xem [nguồn tài nguyên](THIRD_PARTY.md).

Chơi trực tiếp: **https://tdumii.github.io/Pokecatch/**

Bộ tài nguyên đã thu thập gồm 4.839 tệp, khoảng 72,2 MiB: 3.134 PNG, 1.318 GIF, 374 WEBP cùng SVG, intro và font. Sprite bao phủ 556 ID trong dữ liệu game đã khảo sát. Sự hiện diện của tài nguyên Mega không có nghĩa là tích hợp các chức năng quản trị hoặc mở khóa mọi tính năng của máy chủ gốc.

Giao diện tiếng Việt dùng **Be Vietnam Pro**, có đầy đủ dấu tiếng Việt và được lưu cùng game để chơi offline. Logo Latin giữ nét chữ pixel gốc. Các tệp font và giấy phép nằm trong `assets/fonts/`.

Gói tiếng Việt bao gồm giao diện, mô tả của 493 loài gốc (các dạng dùng chung mô tả của loài), thẻ giới thiệu và 38 bản ghi cập nhật. Tên Pokémon, tên chiêu thức và tên riêng được giữ nguyên. Các thuật ngữ thống nhất: Pokémon khác màu, trận đột kích, Tháp Chiến Đấu, Hầm Ngầm, Điểm Chiến Đấu và chế độ ngoại tuyến.

Tiến trình chơi được lưu trong trình duyệt trên từng thiết bị. Bản này không đồng bộ tài khoản, không sử dụng bảng xếp hạng hay giao dịch trực tuyến của trang gốc. Không nhập mật khẩu tài khoản gốc vào bản này.

## Chạy trên máy

Cần Node.js 22 trở lên. Không cần cài thư viện.

```powershell
npm run build
npm run verify
npm start
```

Mở `http://localhost:4173`. Máy chủ lắng nghe mạng nội bộ để thử giao diện trên điện thoại; tính năng service worker cần HTTPS hoặc localhost, vì vậy tải ngoại tuyến trên điện thoại cần bản đã xuất bản qua HTTPS.

## Chơi khi mất mạng

Mở bản HTTPS, bấm **Ngoại tuyến** rồi **Tải trọn bộ để chơi ngoại tuyến** và giữ trang mở đến khi hoàn tất. Lần tải đầu khoảng 80 MB gồm game, ảnh và font, nên dùng Wi-Fi. Khi tải gián đoạn, bấm lại để tiếp tục với các tệp đã lưu. Chỉ khi không còn tệp lỗi, ứng dụng mới thông báo sẵn sàng ngoại tuyến. Trên iPhone, chọn Chia sẻ rồi Thêm vào MH chính; trên Android, chọn cài ứng dụng trong menu trình duyệt hoặc nút cài trong hộp Ngoại tuyến.

Dữ liệu chơi và tệp ngoại tuyến phụ thuộc bộ nhớ trình duyệt. Xóa dữ liệu trang hoặc dùng chế độ riêng tư có thể mất tiến trình; hãy dùng tính năng xuất bản lưu trong game trước khi đổi thiết bị hoặc dọn trình duyệt.

## Xuất bản GitHub Pages

Workflow `.github/workflows/pages.yml` tự build, kiểm tra rồi xuất bản `dist` khi nhánh `main` thay đổi. Các đường dẫn dùng tương đối để hỗ trợ địa chỉ dạng `/Pokecatch/`. Thư mục `.research` và dữ liệu chơi thử không đưa lên Git. Ứng dụng không cần thư viện npm khi build hoặc chạy.

`scripts/verify.mjs` kiểm tra tệp đóng gói, chữ ký tài nguyên và luồng tải ngoại tuyến. Các kiểm tra tự động không thay thế thử chơi thực tế trên điện thoại.
