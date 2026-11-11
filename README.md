# Pokecatch - bản cá nhân ngoại tuyến

Game cá nhân của Umi để chơi trên máy tính và điện thoại: khám phá, chiến đấu tự động, bắt Pokémon, quản lý đội hình và tiến hóa. Các liên kết cộng đồng, quảng bá và ủng hộ của dự án khác đã được gỡ khỏi giao diện. Pokémon và các tài nguyên bên thứ ba thuộc chủ sở hữu tương ứng; thông tin nguồn và giấy phép được giữ trong [THIRD_PARTY.md](THIRD_PARTY.md).

Chơi trực tiếp: **https://tdumii.github.io/Pokecatch/**

Bộ tài nguyên gồm 4.899 tệp trong manifest, khoảng 73 MiB: 3.176 PNG, 1.318 GIF, 374 WEBP, 20 SVG cùng intro, font và giấy phép. Sprite bao phủ 556 ID trong dữ liệu game đã khảo sát. Danh mục vật phẩm gốc được kiểm tra đủ 136 biểu tượng, bổ sung 16 phiến hệ và 12 biểu tượng riêng cho khu quà. Bản nâng cấp hỗ trợ sử dụng 48 dạng Mega/Nguyên thủy, không tích hợp chức năng quản trị của máy chủ gốc.

Giao diện tiếng Việt dùng **Be Vietnam Pro**, có đầy đủ dấu tiếng Việt và được lưu cùng game để chơi offline. Logo Latin giữ nét chữ pixel gốc. Các tệp font và giấy phép nằm trong `assets/fonts/`.

Gói tiếng Việt bao gồm giao diện, mô tả của 493 loài gốc (các dạng dùng chung mô tả của loài), thẻ giới thiệu và 38 bản ghi cập nhật. Tên Pokémon, tên chiêu thức và tên riêng được giữ nguyên. Các thuật ngữ thống nhất: Pokémon khác màu, trận đột kích, Tháp Chiến Đấu, Hầm Ngầm, Điểm Chiến Đấu và chế độ ngoại tuyến.

## Khu quà Umi và tốc độ ×10

Mở **Hoạt động → Khu quà Umi**. Có 3 máy: Tiếp tế (500 ₽), Tiến hóa (2.500 ₽), Pokémon (1 vé). Quay 1 hoặc 10 lượt; ba lượt Pokémon và một thùng tiếp tế được tặng một lần khi dùng bản nâng cấp. Quà được ghi vào bản lưu trước hoạt ảnh, tránh mất quà khi đóng trang.

Tỷ lệ cơ bản: Thường 50%, Ít gặp 30%, Hiếm 15%, Sử thi 4%, Độc đắc 1%. Bộ đếm riêng từng máy bảo đảm ít nhất Hiếm mỗi 10 lượt và Sử thi mỗi 50 lượt. Lượt thường từ bậc Hiếm có 12% cơ hội mở 5 lượt miễn phí; lượt miễn phí có 10% cơ hội nhân đôi quà và không tạo vòng mới.

Túi quà có 12 vật phẩm riêng: vé thường, vé 10 lượt, vé chọn quà, rương tiến hóa, mảnh Mega, vé chọn Đá Mega, trứng tự chọn, vé săn loài còn thiếu, Bùa chiến lợi phẩm, vé chọn Pokémon khác màu, thùng tiếp tế và thỏi vàng. Trứng nở sau 3 phút hoặc 5 trận thắng. Vé săn ưu tiên cuộc gặp phù hợp tiếp theo trong vùng hiện tại; tỷ lệ bắt vẫn áp dụng bình thường. Bùa tăng phần thưởng sau mỗi 5 trận thắng trong 60 phút. Đồ dư phù hợp có thể tái chế thành mảnh, đặt mục tiêu và đổi phần thưởng.

20 mảnh Mega đổi một vé chọn Đá Mega. Có 48 dạng tương thích với dữ liệu Pokémon của bản này (46 Mega và 2 Nguyên thủy); mở khóa xong, vào mục Đá Mega để trang bị cho đúng loài. Mỗi lúc chỉ một cá thể dùng Mega; thay đổi giữ tỷ lệ HP. Chỉ số, hệ và sprite được dùng trong chiến đấu thật.

Nút **×10** tăng tốc xử lý phiêu lưu thực tế và giữ lựa chọn qua lần mở lại. Các hoạt ảnh mở quà, bắt Pokémon và cảnh giới thiệu có giới hạn riêng để dễ đọc trên điện thoại.

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
