# 19 — Frontend Visualization (V6)

Tài liệu tóm tắt các thành phần UI chính liên quan Giai đoạn 3: Material DAG, Timeline/Chronicles, Interactive Graph (Quick View).

## 19.1 Material DAG

- **Component**: `frontend/src/components/Simulation/MaterialDagGraph.tsx`
- **Công nghệ**: `@xyflow/react` (React Flow), layout bằng `dagre`.
- **Dữ liệu**: Nhận `nodes` (MaterialDagNode) và `edges` (MaterialDagEdge); API `GET /worldos/universes/{id}/material-dag` trả về `{ nodes, edges }`.
- **Hiển thị**:
  - Node có `data.lifecycle === 'active'`: viền xanh (emerald), badge "Active".
  - Node khác: viền xám (slate).
  - Panel góc trên-phải: legend "Active / Inactive", nút "Re-layout".
- **Trang**: `dashboard/materials` — tab "Material DAG" hiển thị đồ thị tiến hóa vật chất (parent → child).

## 19.2 Timeline & Chronicles

- **Component**: `frontend/src/components/Simulation/ChronicleTimelineView.tsx`
- **Dữ liệu**: `api.chronicle(universeId)`, `api.branchEvents(universeId)` — gộp chronicle và branch event, sort theo tick.
- **Hiển thị**:
  - Timeline dọc: chronicle dùng border amber, branch event dùng border emerald dashed.
  - Mỗi chronicle: tick range, **badge type** (narrative, eschaton, ascension nếu có), nội dung.
  - Branch: event_type (vd. "Phân nhánh vũ trụ") và tick.
- **Spacing**: `space-y-6`, `pl-8` để dễ đọc.

## 19.3 Interactive Graph & Quick View

- **Component**: `frontend/src/components/Simulation/GraphView.tsx`
- **Props**: `nodes`, `edges` (Universe / Snapshot / MythScar).
- **Tương tác**: Click vào node → mở **Quick View** panel bên phải (slide-in).
  - Hiển thị: ID, Type, Label, Data (JSON).
  - Nút đóng (X); click lại node đang chọn hoặc đóng để ẩn panel.
  - Node đang chọn có viền amber (ring).
- **Dùng**: Trang/graph hiển thị Multiverse / causal topology; click node để xem chi tiết nhanh không rời màn hình.

---

Xem thêm: [07 API Reference](07-api-reference.md), [09 Material System](09-material-system.md).
