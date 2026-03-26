# Tham chiếu Cấu hình (Configuration)

## 1. Biến môi trường Backend (.env)
Dưới đây là các biến quan trọng cần lưu ý khi thiết lập hệ thống:

### Kết nối Database
- `DB_CONNECTION`: `pgsql`
- `DB_HOST`: `postgres`
- `DB_PORT`: `5432`
- `DB_DATABASE`: `worldos`

### Kết nối Neo4j (Narrative Pipeline)
- `NEO4J_PROTOCOL`: `bolt`
- `NEO4J_HOST`: `neo4j`
- `NEO4J_PORT`: `7687`

### Simulation Engine
- `SIMULATION_ENGINE_URL`: `http://engine:50052`

### Real-time (Centrifugo)
- `CENTRIFUGO_URL`: `http://centrifugo:8000`
- `CENTRIFUGO_SECRET`: Mã bí mật để ký token.

## 2. Biến môi trường Frontend
- `NEXT_PUBLIC_API_URL`: URL trỏ đến Backend (mặc định http://localhost:8080/api).
- `NEXT_PUBLIC_WS_URL`: URL trỏ đến Centrifugo.

## 3. Cấu hình Docker
Các file cấu hình chính nằm tại thư mục `deployment/`:
- `docker-compose.prod.yml`: Cấu hình chạy toàn bộ stack.
- `nginx/default.conf`: Cấu hình routing cho Nginx.
