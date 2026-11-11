# Bản đồ mô-đun Sòng bạc

Dùng trang này để chọn đúng tệp trước khi đọc hoặc sửa. Phần mở rộng Sòng bạc nằm trong các tệp nhỏ dưới `bundle/`; chỉ cần đọc `app.f9da276408.js` khi thay đổi điểm nối với máy gốc hoặc thuật toán máy gốc.

## Tệp chịu trách nhiệm

| Muốn thay đổi | Tệp chính | Kiểm tra liên quan |
| --- | --- | --- |
| Giá gói ×10/×100, ưu tiên lượt miễn phí, tổng kết quà, giao dịch gói | `bundle/casino-batch.js` | `verify-casino-batch.mjs` |
| Cầu nối quay, cộng xu và thống kê máy gốc | `bundle/casino-native.js` | `verify-native-casino.mjs`, kiểm tra máy trong trình duyệt |
| Quà kèm lượt quay thường hoặc lượt Pachinko; chống nhận quà hai lần | `bundle/casino-rewards.js` | `verify-arcade-integration.mjs`, `verify-native-casino.mjs` |
| Tab Sòng bạc, nút gói, trạng thái và kết quả | `bundle/casino-ui.js`, `bundle/casino-ui.css` | Kiểm tra trình duyệt ở màn hình rộng/hẹp và bàn phím |
| Túi quà, đổi thưởng, lịch sử, thao tác dùng quà | `bundle/umi-arcade-ui.js`, `bundle/umi-arcade.css` | `verify-arcade-integration.mjs`, kiểm tra trình duyệt |
| Lưu trạng thái, giao dịch, cấp và dùng vật phẩm | `bundle/umi-arcade.js` | `verify-arcade-integration.mjs` |
| Danh mục, xác suất quà, bảo hiểm quà hiếm, tăng cơ hội trúng máy gốc | `bundle/umi-arcade-rules.js` | `verify-arcade.mjs`, `verify-native-casino.mjs` |
| Mở khóa và trang bị Mega | `bundle/umi-mega.js` | `verify-mega.mjs` |
| Thứ tự tải hoặc danh sách tệp phát hành | `index.html`, `scripts/build.mjs` | `verify.mjs`, build |

Các tệp kiểm tra ở cột cuối đều nằm trong `scripts/`. Không thêm logic giá, quà hoặc UI vào bundle gốc để thực hiện những thay đổi đã có mô-đun phụ trách.

## Hợp đồng giữa các mô-đun

- `UmiCasinoBridge.create({ game, ledger, ready, draw, evaluate, reels, lines, renderStops })` tạo adapter cho máy gốc. Các callback do điểm nối trong bundle gốc cung cấp. `ledger()` phải trả về sổ thống kê hiện tại, kể cả sau khi phục hồi trạng thái.
- Adapter `ready()` cho biết máy có thể nhận gói; `preview()` lấy điểm dừng đã áp dụng tăng cơ hội trúng và trả `{ stops, result }`. `result.pay = result.total` ở mức nhân 1; bước này cập nhật chuỗi trượt trong sổ máy.
- Adapter `credit(outcome)` cộng số lượt, cược cơ sở, xu và tổng xu trúng, không lưu game. `renderBatch(outcome, summary)` chỉ cập nhật hiển thị. Tổng tiền mua gói được cộng vào `ledger().spent` một lần bởi mô-đun gói.
- `UmiCasinoBatch.install(engine, arcade, native)` nối dịch vụ. `quote(10|100)` trả `{ count, cost, free, paid, available, reason }`; `reason` là câu tiếng Việt hoặc chuỗi rỗng. `spin(10|100)` trả Promise chứa `{ count, cost, free, paid, coins, wins, rewards, lastOutcome }`. Quà được gộp thành `{ kind: 'item', id, qty }` hoặc `{ kind: 'money', amount }`.
- `UmiArcade.transact(action)` chạy thao tác đồng bộ trong một giao dịch: thành công lưu một lần, lỗi phục hồi trạng thái và không lưu. `grant(reward)` cấp tiền/vật phẩm, không tự tạo giao dịch. `state()` và `quantity(id)` cung cấp trạng thái đã chuẩn hóa và số lượng hiện tại.
- `UmiCasinoRewards.install(engine, service)` nối các hook quay thường: `__umiCasinoStops`, `__umiCasinoFreeAvailable`, `__umiCasinoReward(kind, meta)`. Receipt ngăn cấp lại cùng một kết quả. Gói nhiều lượt tự cấp quà bằng cùng `UmiArcadeRules.spin` và `grant`; không gọi hook cấp quà thường lần nữa.
- `UmiCasinoUI.install(engine, arcade, batch)` gắn tab và nút gói; UI chờ `await batch.spin(count)`. `UmiArcadeUI` tiếp tục phụ trách thao tác quà.

## Quy tắc giá và lượt miễn phí

Mỗi gói ×10 hoặc ×100 có **tổng giá 1.000 Pokédollar** nếu còn ít nhất một lượt phải trả tiền. Nếu toàn bộ gói được bao bằng lượt miễn phí thì giá bằng 0. Đây là giá cho cả gói.

Khi bắt đầu giao dịch, gói dành trước số lượt miễn phí đã có: `nativeFree` trước, rồi `umi-spin-ticket`. Lượt miễn phí và vé trúng trong chính gói đó được giữ cho gói sau. Mỗi lượt dùng kết quả máy gốc và nhận quà theo bộ luật hiện có; không chờ hoạt ảnh từng lượt. Tiền gói, vé, lượt miễn phí, xu, thống kê, quà và lịch sử cùng nằm trong giao dịch. Chặn lần bấm thứ hai ngay khi bắt đầu.

## Dữ liệu cần giữ khi sửa

- `Game.S.money`, `Game.S.items` và thống kê máy gốc do game sở hữu. Xu đi qua `Game.coinIn`; không tự ghi một ví xu mới.
- `Game.S.umiArcade.items`: vật phẩm mở rộng, gồm `umi-spin-ticket`; `nativeFree`: lượt miễn phí máy gốc.
- `umiArcade.nativeReceipts.slots` / `.pachinko`: kết quả cuối đã cấp quà; `lastNativeReward`: quà mới nhất.
- `umiArcade.pity`, `total`, `history`: bảo hiểm và lịch sử quay; `history` giữ tối đa 100 bản ghi.
- `umiArcade.casinoMerged`, `bonus`, `welcomed`: chuyển đổi dữ liệu cũ và quà chào mừng; tránh chạy lại khi chỉnh UI.
- `umiArcade.scrap`, `eggs`, `megaUnlocks`, `pendingEncounter`, `lootUntil`, `lootWins`: trạng thái quà liên quan; không xóa khi đổi màn hình hoặc cập nhật Sòng bạc.
- Sổ máy gốc giữ `spins`, `spent`, `won`, `bets`, `bets2`, `umiMisses`. Truy cập qua adapter `ledger()` thay vì giữ tham chiếu cũ xuyên qua rollback.

## Lệnh kiểm tra theo thay đổi

Chạy từ thư mục dự án, không cần cài thêm thư viện:

```powershell
node scripts/verify-casino-batch.mjs
node scripts/verify-arcade-integration.mjs
node scripts/verify-arcade.mjs
node scripts/verify-native-casino.mjs
node scripts/verify-mega.mjs
node scripts/verify.mjs
node scripts/build.mjs
```

- Sửa giá hoặc thanh toán gói: chạy kiểm tra batch. Nó kiểm tra hai mức giá, lượt miễn phí toàn phần/một phần, không đủ tiền, rollback, bấm kép, receipt và một lần lưu.
- Sửa dịch vụ lưu hoặc cấp quà: chạy integration và batch; sửa bảng thưởng thêm arcade.
- Sửa tăng cơ hội trúng, reels hoặc điểm nối máy gốc: chạy native casino. Kiểm tra này dùng evaluator/reels thực từ bundle và mô phỏng 20.000 lượt mỗi chế độ; đây là kiểm tra thuật toán, không phải bằng chứng thao tác UI thực.
- Sửa Mega: chạy mega và integration.
- Sửa giao diện: kiểm tra trình duyệt thêm việc chuyển tab, dùng bàn phím, hiển thị hẹp, số tiền/vé trước và sau gói, quay thường sau gói. Kiểm tra Node không xác nhận bố cục hoặc tương tác trình duyệt.
- Trước phát hành: chạy build rồi kiểm tra tổng; kiểm tra lại gói xuất trong `dist/`.

Khi chỉ sửa tính năng nhỏ, đọc hàng tương ứng trong bảng, hợp đồng liên quan và kiểm tra của nó. Chỉ mở bundle gốc khi callback native, evaluator hoặc hook thật sự thay đổi.
