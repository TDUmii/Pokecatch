# A Heart Written in Code

A full-screen, neon-pink particle heart inspired by the famous coding scene in **Lighter & Princess** (*Chiếc Bật Lửa và Váy Công Chúa*, episode 5).

Một trái tim màu hồng được kết từ hàng nghìn hạt sáng, đập theo nhịp đôi trên nền đen, tương tự hiệu ứng được thấy trong phim.

## Xem và chạy

Mở `index.html` bằng trình duyệt. Không cần cài npm, Python, thư viện bên ngoài hay máy chủ.

Hoặc chạy local server để thử trên điện thoại cùng mạng:

```bash
python -m http.server 8000
```

Sau đó truy cập `http://localhost:8000` trên máy tính.

## Tính năng

- Trái tim hạt sáng tạo bằng HTML Canvas và công thức tham số toán học.
- Hiệu ứng tụ hạt lúc mở trang, đập hai nhịp, hạt lấp lánh và ánh sáng lan tỏa.
- Chạm hoặc nhấn chuột để trái tim đập mạnh hơn, di chuyển chuột để trái tim nghiêng nhẹ.
- Tự co giãn theo màn hình điện thoại, máy tính; hạn chế số hạt và pixel ratio trên thiết bị nhỏ.
- Hỗ trợ `prefers-reduced-motion` và tạm dừng khi trang không hiển thị.
- Không chứa logo, lời đề tặng, thư viện hay tài nguyên từ phim.

## Chỉnh sửa

Màu hạt: sửa `palette` trong `heart.js`. Độ lớn: sửa `unit` trong hàm `resize`. Số lượng hạt: sửa `count` trong `buildParticles`. Tốc độ nhịp tim: sửa `heartbeat`.

## Ghi chú

Đây là tác phẩm code được viết mới, **lấy cảm hứng từ** hiệu ứng trái tim trong phim, không phải video hay mã nguồn chính thức của đoàn phim. Không thể khẳng định giống 100% từng khung hình nếu không có bản gốc để đối chiếu.

## License

MIT. See `LICENSE`.
