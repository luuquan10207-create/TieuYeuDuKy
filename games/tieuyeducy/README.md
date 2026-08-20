# Farm Quái RPG — MVP

Web MVP dùng Phaser 3 + TypeScript/Vite, Express và SQLite.

## Chạy local

```bash
npm install
npm run dev
```

Mở `http://localhost:5173`. API chạy tại cổng `3001`.

## Android

```bash
VITE_API_URL=https://api-cua-ban.example/api npm run android:apk
```

APK debug nằm tại `android/app/build/outputs/apk/debug/app-debug.apk`. Với Android Emulator, mặc định app gọi API máy host qua `http://10.0.2.2:3001/api`; điện thoại thật cần một URL backend trong mạng LAN hoặc HTTPS công khai.

## Đã có

- Đăng ký/đăng nhập bằng JWT + bcrypt, dữ liệu SQLite.
- Chọn đủ 7 class với kỹ năng riêng.
- Combat click-to-attack, crit, EXP, lên cấp, vàng, kim cương và rarity drop.
- 5 map mở khóa theo level; UI responsive.
- Nhiệm vụ ngày nhận 5 kim cương, chống nhận lặp ở server.
- 3 pet với tốc độ farm khác nhau và phần thưởng offline tối đa 8 giờ.

## Sau MVP

Persist trạng thái sau mỗi trận, inventory/trang bị, boss AI, skill tree, nhiệm vụ, rate-limit/captcha, refresh token và authoritative combat server.
