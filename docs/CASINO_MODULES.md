# Bản đồ mô-đun Sòng bạc

Đọc hàng ứng với tính năng cần sửa, hợp đồng và kiểm tra của nó trước khi mở rộng phạm vi. Giữ phong cách game, bản lưu và tài nguyên hiện có.

| Muốn thay đổi | Tệp sở hữu | Kiểm tra |
| --- | --- | --- |
| Tab Sòng bạc, dòng lượt miễn phí | `bundle/casino-ui.js`, `bundle/casino-ui.css` | Trình duyệt, chuyển tab, bàn phím |
| Nhóm và bộ lọc quầy đổi mảnh, bố cục danh mục | `bundle/casino-exchange-ui.js`, `bundle/casino-exchange-ui.css` | `scripts/verify-casino-exchange.mjs`, trình duyệt |
| Túi quà, thao tác dùng/tái chế/đổi quà, mục tiêu, lịch sử | `bundle/umi-arcade-ui.js`, `bundle/umi-arcade.css` | `scripts/verify-arcade-integration.mjs`, trình duyệt |
| Quà kèm quay thường/Pachinko, chống cấp trùng | `bundle/casino-rewards.js` | `scripts/verify-arcade-integration.mjs`, `scripts/verify-native-casino.mjs` |
| Giao dịch, lưu, cấp và dùng vật phẩm | `bundle/umi-arcade.js` | `scripts/verify-arcade-integration.mjs` |
| Giá đổi mảnh, danh mục, xác suất, bảo hiểm và chuỗi trượt | `bundle/umi-arcade-rules.js` | `scripts/verify-arcade.mjs`, `scripts/verify-native-casino.mjs` |
| Trang bị và mở khóa Mega | `bundle/umi-mega.js` | `scripts/verify-mega.mjs` |
| Responsive toàn app và quầy Đổi xu gốc | `bundle/responsive.css` | Ảnh/trình duyệt 320, 390, 768, 1366px |
| Thứ tự tải và gói offline | `index.html`, `scripts/build.mjs`, `sw.js` | Build rồi `scripts/verify.mjs` |

## Gói quay đã gỡ

Người dùng yêu cầu bỏ các gói ×10/×100 giá 1.000 tiền vì lỗi. Đã gỡ module batch, cầu nối chỉ dùng cho batch, nút, thứ tự tải và kiểm tra cũ. Không thêm lại khi sửa UI. Quay thường, Pachinko, lượt miễn phí, xu và quà đã nhận tiếp tục dùng bản lưu hiện có. Tốc độ phiêu lưu ×10 là chức năng riêng.

## Hợp đồng

- `UmiCasinoUI.install(engine, arcade)` gắn tab; `render()` cập nhật phần quà và điều hướng; `refresh()` chỉ cập nhật dòng lượt miễn phí.
- `UmiCasinoExchangeUI.render(snapshot, {items, esc, fmt, img, button})` tạo danh mục, không ghi dữ liệu. `setFilter(value)` chấp nhận các bộ lọc đã định. UI cha xử lý `data-exchange-filter` và `data-exchange-category` qua cùng bộ lọc; `redeem` và `goal` đi qua dịch vụ cũ.
- `UmiArcade.transact(action)` chạy đồng bộ, thành công lưu một lần, lỗi phục hồi trạng thái. `grant(reward)` cấp tiền/vật phẩm trong giao dịch. `state()`, `snapshot()` và `quantity(id)` trả dữ liệu hiện tại.
- `UmiCasinoRewards.install(engine, service)` sở hữu `__umiCasinoStops`, `__umiCasinoFreeAvailable`, `__umiCasinoReward(kind, meta)`. Receipt ngăn cấp lại cùng kết quả máy gốc.
- Bundle gốc chỉ giữ các hook nối máy quay/Pachinko vào phần thưởng. Không đọc hoặc thêm logic vào `app.f9da276408.js` khi chỉ sửa danh mục, giá đổi mảnh hay CSS. Chỉ mở bundle khi thực sự đổi hook hoặc máy gốc.

## Dữ liệu phải giữ

- Tiền, xu, Pokémon và thống kê do game gốc sở hữu.
- `umiArcade.items`, `nativeFree`, `nativeReceipts`, `pity`, `total`, `history`, `lastNativeReward` giữ vật phẩm, lượt miễn phí và lịch sử (tối đa 100 bản ghi).
- `casinoMerged`, `bonus`, `welcomed` giữ chuyển đổi dữ liệu cũ; không chạy lại gói chào mừng.
- `scrap`, `goal`, `eggs`, `megaUnlocks`, `pendingEncounter`, `lootUntil`, `lootWins` giữ tiến độ phần thưởng.
- Không xóa dữ liệu quà cũ khi bỏ nút hoặc đổi giao diện.

## Kiểm tra tập trung

```powershell
node scripts/verify-casino-exchange.mjs
node scripts/verify-arcade-integration.mjs
node scripts/verify-arcade.mjs
node scripts/verify-native-casino.mjs
node scripts/verify-mega.mjs
```

Sửa giao diện phải kiểm tra trình duyệt cả màn hình hẹp và rộng: chuyển tab, lọc, giá/số mảnh trước và sau đổi, trạng thái thiếu mảnh, bàn phím, tải lại và vùng thanh điều hướng. Kiểm tra Node không chứng minh bố cục.

Trước phát hành chạy `rtk npm run build`, chờ xong rồi `rtk npm run verify`; kiểm tra bản thật trên GitHub Pages sau triển khai.
