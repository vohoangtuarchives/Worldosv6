# Specs MOC (030) - Đặc tả Kỹ thuật

Bản đồ nội dung cho các tài liệu đặc tả kỹ thuật, kiến trúc và lược đồ dữ liệu của WorldOS.

## 🏛️ Kiến trúc Hệ thống (SDD/ADR)

- **[[SDD-WorldOS-DataFlow]]**: Quy trình dữ liệu Master Hardfork (Fast Path, Insight Path, Slow Path).
- **[[ADR-001-Fixed-Point-Determinism]]**: Quyết định sử dụng số học dấu phảy cố định.
- **[[ADR-002-WASM-Rules-Integration]]**: Tích hợp WebAssembly vào Simulation Core.

## 🔌 API & Giao thức

- **[[API-Specification]]**: Đặc tả gRPC và REST cho Simulation Engine.
- **[[Observer-API-Contract]]**: Hợp đồng dữ liệu giữa Engine và Observer UI.

## 💾 Dữ liệu & Lược đồ (Schema)

- **[[DB-Entity-Universe]]**: Lược đồ bảng Universe trong PostgreSQL.
- **[[DB-Entity-Zone]]**: Cấu trúc dữ liệu Zone.
