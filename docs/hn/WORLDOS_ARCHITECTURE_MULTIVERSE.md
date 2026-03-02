# Phân Tích Kiến Trúc Dự Án WorldOS (Đa Nền Tảng & Đa Vũ Trụ)
**Tài liệu:** WORLDOS_ARCHITECTURE_MULTIVERSE.md  
**Phiên bản:** 1.0  
**Ngày cập nhật:** 2026-02-25

---

## 1. Tổng Quan Kiến Trúc (Architecture Overview)

WorldOS là một hệ thống mô phỏng Đa Vũ Trụ (Multiverse) yêu cầu năng lực tính toán vật lý song song quy mô lớn. Kiến trúc được tách bạch rõ ràng giữa tầng Giao diện (Client), tầng Điều phối (Orchestration) và tầng Tính toán (Simulation Engine).

```text
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                         │
│         Web (Next.js) │ Mobile │ Desktop                │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS / WSS
┌────────────────────▼────────────────────────────────────┐
│                    API GATEWAY                          │
│     Rate Limiting │ Auth Verify │ Load Balancing        │
└──────┬──────────────────┬──────────────────┬────────────┘
       │                  │                  │
┌──────▼──────┐  ┌────────▼───────┐  ┌──────▼──────────┐
│ Account     │  │ Orchestration  │  │  Simulation     │
│ Management  │  │ Service (PHP)  │  │  Engine (Rust)  │
│ Service     │  │                │  │                 │
└──────┬──────┘  └────────┬───────┘  └──────┬──────────┘
       │                  │                  │
       └──────────────────▼──────────────────┘
                          │
              ┌───────────▼──────────┐
              │   MESSAGE BROKER     │
              │  (Redis / RabbitMQ)  │
              └───────────┬──────────┘
                          │
              ┌───────────▼──────────┐
              │      DATABASE        │
              │  PostgreSQL / Redis  │
              └──────────────────────┘
```

---

## 2. API Gateway
Gateway là điểm chạm duy nhất (Single Entry Point) cho mọi luồng request từ phía Client.

**Trách nhiệm chính:**
- Xác thực JWT token (chỉ verify, không issue).
- Giới hạn tốc độ (Rate limiting) theo IP hoặc User.
- Điều hướng Request (Routing) đến đúng Microservice.
- SSL Termination và Logging tập trung.

*Gợi ý Công nghệ:* Nginx + Lua, Kong, AWS API Gateway, hoặc Laravel Gateway.

---

## 3. Orchestration Service (PHP / Laravel)
Đóng vai trò điều phối viên (não bộ) của hệ thống đa vũ trụ. Không tự thực hiện tính toán vật lý nặng.

**Trách nhiệm chính:**
- Nhận request mô phỏng từ Gateway.
- Xác thực Business Logic & Quyền hạn (thông qua Account Service).
- Quản lý vòng đời Vũ trụ (Universe CRUD, Branching, Merging).
- Gửi các lệnh (Job) xuống Rust Engine (qua Message Queue hoặc gRPC).
- Theo dõi trạng thái tính toán và cập nhật Database.
- Bắn thông báo (Notify) về Client thông qua Webhook hoặc WebSocket.

---

## 4. Simulation Engine (Rust)
Chịu trách nhiệm thực thi các khối tính toán đặc thù phức tạp: Vật lý, Mô phỏng, Vi phân, Ma trận Jacobian.

**Lý do chọn Rust:**
- Hiệu năng xử lý (CPU-bound) tiệm cận C/C++.
- An toàn bộ nhớ (Memory Safety) cực cao (không crash do Null Pointer).
- Mô hình Concurrency mạnh mẽ với `tokio` (Actor Model).

**Giao tiếp giữa PHP và Rust:**
- **Đồng bộ (Sync) / Real-time:** Sử dụng **gRPC** (nhanh, ràng buộc kiểu dữ liệu chặt chẽ qua Protobuf).
- **Bất đồng bộ (Async) / Batch:** Sử dụng **Message Queue** (Redis / RabbitMQ, đảm bảo tính rời rạc và khả năng retry tự động).

Trong Rust, mỗi Universe hoạt động như một **Actor** chạy độc lập trên thread riêng để đảm bảo tốc độ.

---

## 5. Account Management Service (Identity Provider)
Service xử lý danh tính, phân quyền, và vòng đời tài khoản toàn cục.

**Trách nhiệm chính:**
- Đăng nhập, đăng ký, SSO, OAuth2.
- Phát hành (Issue) JWT Token.
- Quản lý Vai trò (Roles & Permissions - RBAC).
- Quét và giới hạn Quota tài nguyên mô phỏng (VD: giới hạn 100 lần chạy/tháng cho tài khoản Dev).

*Gợi ý Công nghệ:* Có thể xây dựng độc lập bằng PHP/Laravel hoặc sử dụng các giải pháp như Keycloak, Zitadel.

---

## 6. Observer Service (Real-time Feed)
Hệ thống bắn luồng dữ liệu (Data Streaming) thời gian thực phục vụ việc quan sát Vũ trụ (Next.js Dashboard).

**Hoạt động:**
- Mở cổng kết nối WebSocket tới Client.
- Đăng ký (Subscribe) lắng nghe hàng đợi trên Redis Streams (`universe:events:{multiverse_id}`).
- Phân phối tin nhắn (Fan-out) theo dạng Pub/Sub để Client vẽ lại World State mà không cần truy vấn Database liên tục.

---

## 7. Thiết Kế Cơ Sở Dữ Liệu (Layer Phả Hệ Đa Vũ Trụ)
Một hệ Đa Vũ Trụ được thiết kế như một Đồ thị có hướng phi chu trình (DAG) phân chia thành 5 tầng lưu trữ.

1. **Tầng Container (multiverses):** Phạm vi tổng lưu trữ các cấu hình chung.
2. **Tầng Universe (universes):** Lưu trữ các định nghĩa luật vật lý riêng, tick hiện tại, bản record ID Universe cha (`parent_id`) để biểu diễn quá trình rẽ nhánh.
3. **Tầng Trạng thái (universe_states):** Snapshot Trạng Thái. Rất đồ sộ, yêu cầu dùng **TimescaleDB** (PostgreSQL extension) để truy vấn chuỗi thời gian cực nhanh.
4. **Tầng Ký sự (branch_events):** Ghi chép dấu vết của mỗi lần "tẽ nhánh" (Branching) hoặc "sụp đổ" (Collapse).
5. **Tầng Tương tác (universe_interactions):** Ghi chép lại các pha "va chạm", rò rỉ hoặc giao thoa trọng lực, ý thức giữa 2 vũ trụ song song.

---

## 8. Chiến Lược Mở Rộng: Design for Scale, Build for Now
Hệ thống WorldOS được thiết kế để hoạt động ổn định từ 5 universes trên môi trường thử nghiệm cho tới hàng triệu universes.

Mô hình thiết kế giao diện hạ tầng (Interface Strategy) cho phép quy mô mở rộng mà không chạm đến Business Logic:

| Thành Phần Khung Hạ Tầng | Giai Đoạn 1 (Staging: 5 Universes) | Giai Đoạn 2 (Production: 10,000+ Universes) |
|--------------------------|-------------------------------------|---------------------------------------------|
| **Rust Compute**         | 1 Process nguyên khối, Đa luồng     | Rust Cluster phân tán (Nhiều Node)          |
| **RDBMS**                | 1 PostgreSQL Node                   | Sharded PostgreSQL + Cụm TimescaleDB        |
| **Message Broker**       | Single Redis Node                   | Redis Cluster / Kafka / NATS                |
| **Orchestration**        | 1 PHP Container                     | Kubernetes (K8s) Auto-scaling Pods          |

Triết lý nhất quán: "Quy mô hệ thống mở rộng, Giao diện API bảo toàn."
