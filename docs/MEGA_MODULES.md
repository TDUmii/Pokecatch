# Mô-đun Mega

| Thay đổi | Tệp sở hữu | Kiểm tra |
| --- | --- | --- |
| Dạng Mega, chỉ số, hệ, trang bị/tháo | `bundle/umi-mega.js` | `node scripts/verify-mega.mjs` |
| Điều kiện và giá mở ô | `SLOT_RULES` trong `bundle/umi-mega.js` | Cùng kiểm tra Mega, gồm rollback và bản lưu cũ |
| Giao diện tiến độ, nút mở ô và danh sách Pokémon | `bundle/mega-ui.js`, `bundle/mega-ui.css` | Trình duyệt hẹp/rộng, thiếu/đủ điều kiện, đầy ô |
| Gắn vào Vé & quà | `bundle/umi-arcade-ui.js`, wrapper trong `bundle/umi-arcade.js` | Integration và trình duyệt |

`UmiMega.progress()` đọc `{capacity, used, badges, shards, next, milestones}`. Ô đầu miễn phí; ô 2-6 cần 4/8/12/16/24 huy hiệu đạo quán và trả 20/40/60/100/150 mảnh Mega. Huy hiệu đọc từ `adv.badges`, khử trùng và đối chiếu các đạo quán thường trong STORY; không tính chương Liên đoàn hoặc nhà vô địch. Tổng chi phí là 370 mảnh; huy hiệu không bị trừ.

`unlockSlot(capacity)` chỉ mở ô liền sau, kiểm tra điều kiện lại trong giao dịch và lưu một lần. `equip(uid,key)` không tháo con khác, chặn cá thể mới khi hết ô; đổi dạng của con đang dùng ô vẫn được. `unequip(uid)` chỉ tháo cá thể đó. Các hàm này tự sở hữu giao dịch, wrapper của UmiArcade chỉ chuyển tiếp, không bọc thêm giao dịch.

Giới hạn dùng chung bộ sưu tập, gồm PC/Nhà trẻ/Hầm Ngầm, khử trùng UID. Bản lưu cũ thiếu `megaCapacity` mặc định 1; không xóa trang bị cũ vượt giới hạn. Trạng thái mở dạng ở `umiArcade.megaUnlocks`, số ô ở `umiArcade.megaCapacity`, mảnh ở `umiArcade.items['umi-mega-shard']`. Không nhầm mảnh Mega với `umiArcade.scrap` của quầy đổi thưởng.

Để giữ các Mega cùng loài qua lần mở lại, equip bật cờ native `keepDup[Game.candyFamily(mon.id)] = 1` trong cùng giao dịch. Không gọi `Game.setKeep` tại đây vì hàm đó tự lưu. Tháo Mega không xóa lựa chọn giữ bản trùng. Bộ gộp khi tải game có thêm hook `__pokeProtectMegaDuplicate` nhận cá thể, kiểm tra đúng mã dạng và loài ngay trước khi engine cài; cờ giữ trùng riêng không đủ ngăn bước gộp này. Điểm nối nhỏ trong bundle gốc là cần thiết để bảo vệ dữ liệu khi tải. Kiểm tra trình duyệt phải có hai Charizard X, lưu/tải lại còn đủ cá thể, không chỉ kiểm tra JSON giả lập.

Các hook chỉ số, hệ, tên và ảnh nhận chính đối tượng Pokémon; không dùng trạng thái Mega chung theo mã loài. Giữ tỷ lệ HP khi đổi/tháo, không hồi sinh Pokémon ngất. Khi lỗi lưu, tiền/mảnh/số ô/trang bị/giữ trùng phải phục hồi.

Sửa cục bộ chạy kiểm tra Mega. Trước phát hành chạy build, chờ xong rồi verify tổng, kiểm tra browser ở 320/390/1366px và xác nhận bản thật trên GitHub Pages.
