# Pokecatch - bản cá nhân ngoại tuyến

Game cá nhân của Umi để chơi trên máy tính và điện thoại: khám phá, chiến đấu tự động, bắt Pokémon, quản lý đội hình và tiến hóa. Các liên kết cộng đồng, quảng bá và ủng hộ của dự án khác đã được gỡ khỏi giao diện. Pokémon và các tài nguyên bên thứ ba thuộc chủ sở hữu tương ứng; thông tin nguồn và giấy phép được giữ trong [THIRD_PARTY.md](THIRD_PARTY.md).

Chơi trực tiếp: **https://tdumii.github.io/Pokecatch/**

Bộ tài nguyên gồm 4.899 tệp trong manifest, khoảng 73 MiB: 3.176 PNG, 1.318 GIF, 374 WEBP, 20 SVG cùng intro, font và giấy phép. Sprite bao phủ 556 ID trong dữ liệu game đã khảo sát. Danh mục vật phẩm gốc được kiểm tra đủ 136 biểu tượng, bổ sung 16 phiến hệ và 12 biểu tượng phần thưởng Sòng bạc. Bản nâng cấp hỗ trợ sử dụng 48 dạng Mega/Nguyên thủy, không tích hợp chức năng quản trị của máy chủ gốc.

Giao diện tiếng Việt dùng **Be Vietnam Pro**, có đầy đủ dấu tiếng Việt và được lưu cùng game để chơi offline. Logo Latin giữ nét chữ pixel gốc. Các tệp font và giấy phép nằm trong `assets/fonts/`.

Gói tiếng Việt bao gồm giao diện, mô tả của 493 loài gốc (các dạng dùng chung mô tả của loài), thẻ giới thiệu và 38 bản ghi cập nhật. Tên Pokémon, tên chiêu thức và tên riêng được giữ nguyên. Các thuật ngữ thống nhất: Pokémon khác màu, trận đột kích, Tháp Chiến Đấu, Hầm Ngầm, Điểm Chiến Đấu và chế độ ngoại tuyến.

## Sòng bạc dễ trúng hơn và tốc độ ×10

Mở **Hoạt động → Sòng bạc** và dùng máy quay hoặc Pachinko có sẵn. Không có khu hay ba máy quay riêng. Thuật toán chỉ hỗ trợ kết quả trượt, giữ nguyên các kết quả vốn đã thắng; sau hai lượt trượt liên tiếp, lượt tiếp theo trúng. Kiểm tra 20.000 lượt mỗi cấu hình hàng ghi nhận tỷ lệ trúng khoảng 82-87%, thay vì 7-35% trước đó. Đây là tỷ lệ trúng xu, không phải lợi nhuận theo tiền cược. Túi quà Pachinko rộng gấp ba, hai túi trượt thu hẹp; vị trí và cách chơi gốc được giữ nguyên.

Mỗi lần quay hoặc mua một đợt bóng Pachinko có thêm vật phẩm, ghi vào cùng bản lưu. Mở tab **Vé & quà** trên hàng tab Sòng bạc để dùng quà, tái chế, đổi thưởng hoặc trang bị Mega. Quà bổ sung có tỷ lệ cơ bản Thường 50%, Ít gặp 30%, Hiếm 15%, Sử thi 4%, Độc đắc 1%, với bảo đảm quà Hiếm sau 10 lần và Sử thi sau 50 lần. Các lượt thưởng miễn phí và vé cũ chuyển sang lượt quay ở máy Sòng bạc gốc; hệ thống tự dùng vé trước khi trừ tiền cược. Mọi quà, mảnh, mục tiêu và Mega của bản trước được giữ lại.

Các gói quay nhanh ×10/×100 giá 1.000 tiền đã được gỡ theo yêu cầu. Máy quay thường và Pachinko tiếp tục hoạt động; vé, xu và phần thưởng đã nhận được giữ trong cùng bản lưu.

Quầy **Đổi thưởng** chia quà thành Vé & tiếp tế, Bạn đồng hành, Tiến hóa & Mega. Có bộ lọc đủ mảnh, giá, số đang có, số còn thiếu và mục tiêu đổi quà. Điện thoại dùng hàng rộng, màn hình lớn dùng hai cột. Quầy **Đổi xu** cuộn cùng trang; đội hình, Pokédex, cửa hàng, header và thanh điều hướng có điều chỉnh cho màn hình nhỏ.

Túi quà có 12 vật phẩm riêng: vé thường, vé 10 lượt, vé chọn quà, rương tiến hóa, mảnh Mega, vé chọn Đá Mega, trứng tự chọn, vé săn loài còn thiếu, Bùa chiến lợi phẩm, vé chọn Pokémon khác màu, thùng tiếp tế và thỏi vàng. Trứng nở sau 3 phút hoặc 5 trận thắng. Vé săn ưu tiên cuộc gặp phù hợp tiếp theo trong vùng hiện tại; tỷ lệ bắt vẫn áp dụng bình thường. Bùa tăng phần thưởng sau mỗi 5 trận thắng trong 60 phút. Đồ dư phù hợp có thể tái chế thành mảnh, đặt mục tiêu và đổi phần thưởng.

20 mảnh Mega đổi một vé chọn Đá Mega. Có 48 dạng tương thích với dữ liệu Pokémon của bản này (46 Mega và 2 Nguyên thủy); mở khóa xong, vào mục Đá Mega để trang bị cho đúng loài. Có một ô Mega miễn phí, mở dần tối đa sáu ô bằng huy hiệu đạo quán và mảnh Mega. Không tự tháo dạng của con khác; thay đổi giữ tỷ lệ HP. Chỉ số, hệ và sprite được dùng trong chiến đấu thật.

Nút **×10** và **×20** tăng tốc xử lý phiêu lưu thực tế và giữ lựa chọn qua lần mở lại. Từ ×10, trận và lượt bắt thường dùng hiển thị gọn để tránh chờ chuyển cảnh lâu; ×20 có chu kỳ khung ngắn hơn ×10. Các lựa chọn, tiến hóa, Pokémon mới/khác màu và mốc quan trọng giữ luồng tương tác gốc.

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

## Sửa theo tính năng

Xem [bản đồ mô-đun Sòng bạc](docs/CASINO_MODULES.md) trước khi sửa. Giao diện tab, quầy đổi mảnh, quà quay thường, thao tác quà và bố cục toàn app có tệp riêng cùng kiểm tra liên quan; không cần đọc lại toàn bộ bundle gốc cho các thay đổi cục bộ. Quy ước này cũng nằm trong [AGENTS.md](AGENTS.md).

## Cẩm nang chiến thuật và thẻ Pokémon

Trong **Cẩm nang → Khắc hệ**, chọn một hoặc hai hệ để xem tấn công, điểm yếu, kháng và miễn nhiễm. Hệ số đọc từ engine chiến đấu, có trường hợp ×4, ×0,25 và ×0 của Pokémon hai hệ.

Trong **Cẩm nang → Đội theo bản đồ**, chọn chương để xem tối đa sáu Pokémon đang sở hữu phù hợp với đối thủ và chiêu đã học. Gợi ý tính hệ Mega đang trang bị, cấp hiệu dụng, chỉ số và độ phủ. Có đối thủ cần chú ý và nơi săn thêm đã mở. Đây là xếp hạng hỗ trợ, chưa mô phỏng toàn bộ thời tiết, kỹ năng và trạng thái; không tự đổi đội hay dùng vật phẩm. Trên điện thoại mở Cẩm nang từ Cài đặt → Bản tin & Cẩm nang → Cẩm nang.

Thẻ Pokémon dùng hai ô cấp/HP và một hàng Tính cách rộng. Tooltip nổi ngoài vùng cuộn, hỗ trợ trỏ chuột, bàn phím và chạm, giới hạn trong màn hình. Các mô-đun và kiểm tra liên quan ở [docs/PLAY_GUIDE_MODULES.md](docs/PLAY_GUIDE_MODULES.md).

## Mở nhiều ô Mega

Vào **Hoạt động → Sòng bạc → Vé & quà → Đá Mega**. Ô đầu tiên miễn phí. Mở từng ô sau bằng huy hiệu đạo quán đã đạt (không bị trừ) và mảnh Mega trả một lần:

| Ô | Huy hiệu đạo quán | Mảnh Mega trả cho ô đó |
| --- | ---: | ---: |
| 2 | 4 | 20 |
| 3 | 8 | 40 |
| 4 | 12 | 60 |
| 5 | 16 | 100 |
| 6 | 24 | 150 |

Tổng mở đủ sáu ô là 370 mảnh Mega. Huy hiệu tính qua các vùng, loại mốc Liên đoàn/nhà vô địch và ID không hợp lệ. Ô mở vĩnh viễn, dữ liệu nằm trong bản lưu cá nhân. Mỗi Pokémon cần mở khóa đúng dạng Mega tương thích như trước. Hai Charizard riêng có thể cùng dùng Mega X. Khi đầy ô, con đã trang bị vẫn đổi X/Y được, trang bị con mới cần tháo một con hoặc mở thêm ô. Pokémon ở PC, Nhà trẻ hoặc Hầm Ngầm vẫn chiếm ô vì giới hạn dùng chung bộ sưu tập.

Trang bị Mega tự bật Giữ lại bản trùng cho gia đình Pokémon đó, tránh bị gộp khi mở lại game; tháo Mega không tự tắt tùy chọn này. Cấp, HP và tiến độ cũ được giữ. Logic ở `bundle/umi-mega.js`, giao diện riêng ở `bundle/mega-ui.js` và CSS; xem [docs/MEGA_MODULES.md](docs/MEGA_MODULES.md).

## Phòng bí mật

Ở màn hình chào, chạm logo **Poke’Catch 7 lần trong 4 giây** để mở Phòng bí mật. Sau khi khám phá, nút xuất hiện ở màn hình chào và trong **Ngoại tuyến → Phòng bí mật**; không cần chạm lại ở thiết bị này. Hãy bắt đầu hoặc tiếp tục hành trình để có nhân vật trước khi nhận quà.

Menu có ba tab: Pokémon (tìm tên/số Pokédex, cấp1-100, số lượng1-100, tùy chọn khác màu), Vật phẩm (tìm mọi vật phẩm có trong bản game và chọn số lượng), Tiện ích (tiền, xu, mảnh đổi thưởng, mảnh Mega, hồi phục đội, mở toàn bộ48 dạng/sáu ô Mega). Mỗi lần bấm áp dụng lưu một giao dịch; mở menu không tự cấp gì. Pokémon được đưa vào PC, không thay đội. Bản thường và khác màu trùng loài được giữ thành các cá thể riêng sau tải lại.

Module và kiểm tra ở [docs/SANDBOX_MODULES.md](docs/SANDBOX_MODULES.md).
