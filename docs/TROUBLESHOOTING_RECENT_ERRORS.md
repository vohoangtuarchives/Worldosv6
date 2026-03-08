# Tại sao một số lỗi “mới” xuất hiện (trước đây không có)

Tài liệu ngắn giải thích nguyên nhân các lỗi gần đây khi chạy seed / Docker và cách đã xử lý.

---

## 1. `Call to undefined function Database\Factories\fake()`

**Nguyên nhân:**

- **UserFactory** nằm trong namespace `Database\Factories`. Trong PHP, khi gọi `fake()` (không có `\` phía trước), PHP ưu tiên tìm hàm **trong namespace hiện tại** (`Database\Factories\fake()`). Hàm này không tồn tại → lỗi.
- Laravel mặc định dùng `fake()` trong UserFactory và thường vẫn chạy được vì helper `fake()` được load rất sớm và thường được gọi trong ngữ cảnh đã bootstrap đủ. Lỗi xuất hiện khi:
  - **Chạy seed lần đầu** sau khi thêm/create user qua `User::factory()->create()` trong DatabaseSeeder (trước đó có thể bạn chưa chạy nhánh code này).
  - **Môi trường khác** (Docker, CI, `composer install --no-dev`): thứ tự load file hoặc thiếu dependency (Faker chỉ ở `require-dev`) khiến lúc gọi `fake()` thì hàm chưa tồn tại hoặc namespace bị resolve sai.

**Đã xử lý:** Đổi sang dùng `$this->faker` trong UserFactory (instance Faker có sẵn trong Factory), không phụ thuộc helper global → ổn định với mọi môi trường và cả khi chạy với `--no-dev`.

---

## 2. `Class "Monolog\Handler\AbstractHandler" not found`

**Nguyên nhân:**

- **Thứ tự load:** Khi Laravel load `config/logging.php`, nó dùng các class như `StreamHandler`, `NullHandler`. Chúng kế thừa `AbstractProcessingHandler` → `AbstractHandler`. Nếu một class “con” được autoload **trước** class “cha”, Composer autoload có thể chưa load file chứa `AbstractHandler` → lỗi.
- Thường gặp khi:
  - Chạy **artisan** (ví dụ `db:seed`) trong môi trường mới (Docker, CI).
  - Sau **composer update / dump-autoload**, thứ tự trong classmap/psr-4 thay đổi.

**Đã xử lý:** Trong `AppServiceProvider::register()` gọi `class_exists(\Monolog\Handler\AbstractHandler::class, true)` sớm để ép load class nền trước khi config logging dùng các handler.

---

## 3. Whoops `Input/output error` khi include file trong Docker

**Nguyên nhân:**

- **Docker compose cũ** mount cả thư mục host: `../backend:/var/www`. Mọi thứ trong container (kể cả `vendor`) đều là file trên ổ host.
- Trên **Windows**, bind mount một thư mục rất nhiều file nhỏ (như `vendor`) dễ gây lỗi I/O khi PHP đọc file (đặc biệt với Whoops/Collision vì chúng được load khi có exception).
- Image build với `composer install --no-dev` **không** cài Whoops (dev dependency), nhưng vì mount ghi đè `/var/www`, container lại dùng `vendor` của host (có dev deps) → vừa dùng Whoops vừa đọc qua mount → dễ lỗi I/O.

**Đã xử lý:** Đổi docker-compose prod: **không** mount cả `../backend` lên `/var/www`. Chỉ mount volume cho `storage`, `bootstrap/cache`, `public`. Code và `vendor` trong container dùng từ **image** (đã `composer install --no-dev`) → không Whoops, không đọc vendor qua bind mount → hết lỗi I/O. Khi cần deploy code mới thì rebuild image.

---

## Tóm tắt

| Lỗi | Nguyên nhân chính | Cách xử lý |
|-----|-------------------|------------|
| `fake()` undefined | Namespace + môi trường/seed path mới chạy | Dùng `$this->faker` trong UserFactory |
| Monolog AbstractHandler | Thứ tự autoload khi load config logging | Gọi `class_exists(AbstractHandler)` sớm trong AppServiceProvider |
| Whoops I/O error | Bind mount vendor từ Windows + dev deps trong container | Bỏ mount full backend; dùng vendor trong image, chỉ mount storage/cache/public |

Các thay đổi trên đã được áp dụng trong code. Nếu bạn chạy seed/Docker trong môi trường mới (prod, CI, máy khác) lần đầu, có thể sẽ gặp lại các lỗi tương tự; khi đó kiểm tra lại: đã dùng UserFactory với `$this->faker`, đã có fix Monolog, và compose prod không mount full backend.

---

## 4. Giải thích các mục trong `storage/logs/laravel.log`

**Lỗi dạng:** `include(/var/www/vendor/...): Failed to open stream: Input/output error`

- **Nghĩa:** PHP trong container (đường dẫn `/var/www`) không đọc được file trong `vendor` — thường do **bind mount** từ Windows lên container, đọc nhiều file nhỏ gây I/O error.
- **Xuất hiện khi:** Chạy `migrate:fresh --seed` hoặc artisan trong Docker với setup **cũ** (compose vẫn mount `../backend:/var/www`).
- **Cách xử lý:** Dùng **docker-compose.prod.yml** đã sửa (chỉ mount `backend_storage`, `backend_bootstrap_cache`, `backend_public`; không mount cả backend). Rebuild image và `up` lại. Sau khi đổi, log dạng này sẽ không còn (vendor nằm trong image, không đọc qua mount).

**Lỗi dạng:** `SQLSTATE[08006] could not connect to server: Connection refused ... 127.0.0.1:5432`

- **Nghĩa:** Ứng dụng (Laravel) đang cố kết nối PostgreSQL tại `127.0.0.1:5432` nhưng không có server nào lắng nghe ở đó.
- **Xuất hiện khi:** Chạy **trên máy host** (ví dụ `php artisan db:seed` trong thư mục backend; stack trace có đường dẫn `C:/Users/...`) với `.env` có `DB_HOST=127.0.0.1`. Trên host thường không chạy Postgres trừ khi bạn cài local.
- **Cách xử lý:**
  - **Chạy seed trong Docker:** `docker compose -f deployment/docker-compose.prod.yml exec backend php artisan db:seed --force` (container dùng `DB_HOST=postgres`).
  - **Hoặc chạy Postgres trên host** (port 5432) và giữ `DB_HOST=127.0.0.1` khi chạy artisan trên host.

