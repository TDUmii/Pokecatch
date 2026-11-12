# Phòng bí mật

| Cần sửa | Tệp sở hữu | Kiểm tra |
| --- | --- | --- |
| Danh mục, cấp Pokémon/vật phẩm, tài nguyên, hồi phục và Mega | `bundle/sandbox-cheats.js` | `node scripts/verify-sandbox-cheats.mjs` |
| Khám phá bảy lần chạm, nút mở lại, tìm kiếm và dialog | `bundle/sandbox-ui.js`, `bundle/sandbox-ui.css` | Browser 320/390/1366px, sáu/bảy chạm và tải lại |
| Thứ tự tải và hook engine | `index.html`, cuối `sandbox-ui.js` | Build và verify tổng |

`UmiCheats.install(engine)` cài dịch vụ. `catalogPokemon(query)` / `pokemon(query)` đọc mọi ID trong DEX; `catalogItems(query)` / `items(query)` hợp danh mục native và 12 vật phẩm riêng. Tìm kiếm không phân biệt hoa/thường/dấu tiếng Việt, gồm Đ/d. UI chỉ hiện 40 kết quả đầu, truy vấn vẫn chạy trên toàn danh mục.

`grantPokemon({id,level,quantity,shiny,nature?,megaKey?})` dùng hàm tạo Pokémon và đăng ký Pokédex native, đẩy vào PC, không thêm/đổi đội. ID phải có trong game, cấp 1 đến MAX_LEVEL, số lượng 1-100. Dạng Mega trực tiếp phải đúng loài và còn ô; UI hiện cung cấp tạo dạng thường/khác màu và tiện ích mở Mega riêng. Mỗi cá thể có UID riêng, `umiCheatMon:true`, ghi nơi nhận và bật giữ bản trùng theo gia đình.

`grantItem(id,qty)` nhận 1-1.000.000 món có trong danh mục. `grantCurrency({kind,amount})` hỗ trợ money/coin/scrap/mega-shard, số nguyên 1-1.000.000.000. `healTeam()` chỉ hồi HP và xóa trạng thái của đội đang chọn. `unlockMega({forms:true,slots:true})` mở dạng và sáu ô khi người chơi bấm tiện ích này.

Các thao tác yêu cầu nhân vật đã có và không mất TabLock, dùng `UmiArcade.transact` để lưu một lần/rollback. UI bắt lỗi dữ liệu không hợp lệ. Chỉ mở menu hoặc chọn kết quả không ghi tài nguyên.

Module backend tải sau `umi-mega.js` và trước bundle engine. Nó nối tiếp callback bảo vệ gộp lúc tải: `__pokeProtectMegaDuplicate` trả true cho `umiCheatMon` hoặc kết quả hook Mega trước đó. Không thay điểm nối native hoặc làm mất bảo vệ Mega. Kiểm tra phải có Pokémon thường trùng loài sau tải lại; chỉ kiểm tra shiny là chưa đủ vì native đã bỏ qua shiny khi gộp.

`UmiSandboxUI.install(engine)` do hook `__setInternalPoke` nối sau dịch vụ. Bảy lần chạm `.title-fx .ti-logo` trong cửa sổ bốn giây mở menu; có Enter/Space. Khám phá được ghi vào localStorage `umi-cheats-unlocked-v1`, tách bản lưu. Sau đó nút hiện trong `.ti-menu` và `#personal-dialog`; menu chính không bị thêm nút. Khi chuyển thiết bị, có thể khám phá lại bằng bảy lần chạm.

Trước phát hành build rồi verify tổng, kiểm tra thêm Pokémon vào PC không đổi team, vật phẩm/tài nguyên đúng lượng, hồi phục, Mega, nhập sai không ghi dữ liệu, mở lại từ Ngoại tuyến và tải lại còn đủ cả bản thường/khác màu trùng loài.
