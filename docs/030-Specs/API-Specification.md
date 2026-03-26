# Tài liệu Đặc tả API (API Specification)

## Tổng quan
Các API của WorldOS V6 tập trung vào việc quản lý vũ trụ, theo dõi tiến trình mô phỏng và truy xuất các dữ liệu lịch sử/nhân vật. Base path: `/api/worldos/`.

## 1. Quản lý Vũ trụ (Universe Management)
| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| GET | `/universes` | Danh sách các vũ trụ hiện có. |
| GET | `/universes/{id}` | Chi tiết một vũ trụ và trạng thái hiện tại. |
| PATCH | `/universes/{id}` | Cập nhật cấu hình vũ trụ. |
| POST | `/universes/{id}/toggle-status` | Kích hoạt hoặc tạm dừng mô phỏng. |
| GET | `/universes/{id}/snapshots` | Lấy danh sách các bản ghi trạng thái (Snapshots). |

## 2. Quản lý Thế giới (World Management)
| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| GET | `/worlds` | Danh sách các thế giới (mẫu cơ sở). |
| GET | `/worlds/{id}/simulation-status` | Trạng thái kỹ thuật của quá trình mô phỏng. |

## 3. Biên niên sử & Cốt truyện (Narrative & Chronicles)
| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| GET | `/universes/{id}/chronicles` | Danh sách biên niên sử đã ghi chép. |
| GET | `/universes/{id}/myth-scars` | Các "vết sẹo thần thoại" (biến cố lớn). |
| GET | `/universes/{id}/history-timeline` | Dòng thời gian lịch sử tổng quát. |
| POST | `/universes/{id}/generate-chronicle` | Yêu cầu Sử gia tổng hợp biên niên sử mới. |

## 4. Thực thể & Nhân vật (Actors & Entities)
| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| GET | `/universes/{id}/actors` | Danh sách các nhân vật chính trong vũ trụ. |
| GET | `/actors/{id}` | Chi tiết nhân vật, thuộc tính và tâm lý. |
| GET | `/actors/{id}/events` | Các sự kiện quan trọng gắn liền với nhân vật. |
| GET | `/universes/{id}/supreme-entities` | Thông tin về các thực thể tối cao (Demiurges). |

## 5. Điều khiển Mô phỏng (Simulation Control)
| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| POST | `/simulation/advance` | Tiến hành một hoặc nhiều Tick mô phỏng. |
| POST | `/universes/{id}/fork` | Nhánh hóa vũ trụ (tạo dòng thời gian song song). |
| GET | `/analytics/ticks` | Phân tích hiệu năng và dữ liệu tick. |
