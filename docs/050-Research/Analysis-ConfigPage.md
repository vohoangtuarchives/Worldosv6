---
id: RESEARCH-001
type: research
status: approved
project: WorldOS V6
owner: "@designer"
tags: [ui-ux, settings, configuration, dark-mode, glassmorphism]
linked-to: [[SYSTEM_OVERVIEW_V7]]
created: 2026-03-31
---

# Analysis: Trang Cấu Hình (Configuration Page) — WorldOS V6

## 📌 Bối cảnh

WorldOS V6 là một **Civilizational Dynamics Simulation Engine** với ba lớp:
- PHP Orchestrator (Não — quản lý vũ trụ)
- Rust Engine (Thể xác — tính toán song song)
- **Next.js Dashboard (Mắt — quan sát & cấu hình)**

Trang cấu hình là nơi người dùng điều chỉnh **các tham số mô phỏng** trước khi khởi động vũ trụ: tốc độ tick, dân số ban đầu, tỷ lệ entropy, ngưỡng sự kiện, v.v.

---

## 🔍 Xu hướng Thiết kế 2025–2026

### Kết quả Research

| Xu hướng | Áp dụng cho WorldOS? | Mức độ |
|---|---|---|
| **Dark mode** (baseline `#020617`) | ✅ Đã có | Giữ nguyên |
| **Glassmorphism 2.0** — `backdrop-filter: blur(20px)` | ✅ Thêm vào panels | Cao |
| **Bento Grid Layout** — ô lưới không đồng đều | ✅ Nhóm tham số dạng bento | Cao |
| **Sidebar Navigation** — cố định bên trái | ✅ Điều hướng danh mục cài đặt | Cao |
| **Slider với giá trị số** — thanh kéo có hiển thị số | ✅ Mọi tham số liên tục | Cao |
| **Toggle switches** — bật/tắt boolean | ✅ Flags hệ thống | Cao |
| **Micro-animations** — phản hồi tức thì khi thay đổi | ✅ UX premium | Trung bình |
| **Search settings** — tìm kiếm tham số nhanh | ✅ Rất nhiều tham số | Trung bình |
| **Toast notifications** — xác nhận lưu | ✅ | Cao |

### Insight Chính

1. **Không dùng màu đen tuyệt đối** (#000). Dùng deep navy (`#020617`) làm nền — đã có.
2. **Accent xanh lá `#22C55E`** phù hợp với theme hiện có, dùng cho active states.
3. **Typography Fira Code/Fira Sans** đã được thiết lập — giữ nguyên, rất phù hợp với "engine dashboard" cảm giác.
4. **Glassmorphism panels** cho các nhóm tham số tạo cảm giác "vũ trụ đang phát sáng từ bên dưới".
5. **Bento Grid** phù hợp để nhóm: Simulation Core / World Physics / Actor Psychology / Event Thresholds.

---

## 🗺️ Phạm vi Trang Cấu Hình

### Danh mục Settings (Sidebar)

| Danh mục | Icon | Mô tả |
|---|---|---|
| **Tổng quát** | ⚙️ | Tên vũ trụ, seed ngẫu nhiên, ngôn ngữ |
| **Vật lý Thế giới** | 🌍 | Địa lý, tài nguyên, khí hậu |
| **Mô phỏng** | ▶️ | Tick rate, tốc độ mô phỏng, giới hạn Actor |
| **Tâm lý học** | 🧠 | Trọng số 17D traits, ngưỡng trauma |
| **Sự kiện & Entropy** | ⚡ | Xác suất thiên tai, ngưỡng sụp đổ |
| **Hiển thị** | 📊 | Chart refresh rate, log verbosity |
| **API & Tích hợp** | 🔌 | API key, gRPC endpoint URL |

### Components cần thiết

1. **SettingsSidebar** — navigation cố định
2. **SettingsHeader** — breadcrumb + search tham số + Save button
3. **SettingsSection** — glass card chứa nhóm tham số (bento)
4. **SliderField** — `<input type="range">` với giá trị số + label
5. **ToggleField** — switch bật/tắt
6. **NumberField** — input số với validation
7. **SelectField** — dropdown chọn preset
8. **TextareaField** — mô tả / notes
9. **ToastNotification** — xác nhận lưu 
10. **ResetButton** — khôi phục default

---

## 🎨 Creative Direction

### Phong cách: "Quantum Control Room"

> Cảm giác như đứng trước bảng điều khiển của một nhà khoa học vũ trụ. Mọi tham số đều là một biến số ảnh hưởng đến thực tại.

- **Màu nền**: Deep navy `#020617` với grid pattern mờ
- **Panels**: Glassmorphism — `rgba(15,23,42,0.5)` + `backdrop-blur(16px)`
- **Accent**: Xanh lá neon mờ `#22C55E` cho active, hover states
- **Border**: `rgba(34, 197, 94, 0.15)` — viền xanh mờ
- **Typography**: Fira Code cho labels kỹ thuật, số, giá trị
- **Highlight**: Gradient micro-glow khi hover vào control

### Palette

| Token | Giá trị | Dùng cho |
|---|---|---|
| `--bg-void` | `#020617` | Page background |
| `--surface-glass` | `rgba(15,23,42,0.5)` | Card surfaces |
| `--border-quantum` | `rgba(34,197,94,0.15)` | Card borders |
| `--accent-matrix` | `#22C55E` | Active, CTA |
| `--text-primary` | `#F8FAFC` | Main text |
| `--text-muted` | `#64748B` | Labels, captions |
| `--slider-track` | `#1E293B` | Slider background |
| `--slider-fill` | `#22C55E` | Slider active fill |

---

## 📐 Layout Specification

```
┌─────────────────────────────────────────────────────┐
│  HEADER: [🌌 WorldOS Config] [Search...] [💾 Lưu]   │
├──────────┬──────────────────────────────────────────┤
│          │  SECTION TITLE ────────────────────────  │
│ SIDEBAR  │                                           │
│          │  ┌───────────┬───────────┬─────────────┐ │
│ • Tổng   │  │  BENTO 1  │  BENTO 2  │   BENTO 3   │ │
│   quát   │  │  (large)  │  (small)  │   (small)   │ │
│          │  ├───────────┴───────────┼─────────────┤ │
│ • Vật lý │  │       BENTO 4        │   BENTO 5   │ │
│ Thế giới │  │  (medium)            │   (tall)    │ │
│          │  └──────────────────────┴─────────────┘ │
│ • Mô     │                                           │
│   phỏng  │  ┌────────────────────────────────────┐  │
│          │  │  SLIDER GROUP (full width)          │  │
│ • Tâm lý │  └────────────────────────────────────┘  │
│ học      │                                           │
│          │                                           │
│ • Sự     │                                           │
│   kiện   │                                           │
│          │                                           │
│ • Hiển   │                                           │
│   thị    │                                           │
│          │                                           │
│ • API    │                                           │
└──────────┴──────────────────────────────────────────┘
```

---

## ✅ Kết luận

Hướng thiết kế **"Quantum Control Room"**:
- Glassmorphism panels + deep navy background ✅
- Bento grid layout cho nhóm tham số ✅  
- Sidebar navigation với active indicator ✅
- Sliders + toggles với micro-animations ✅
- Fira Code typography (đã có sẵn) ✅
- Accent xanh lá `#22C55E` (đã có sẵn) ✅

**Bước tiếp theo**: Prototype HTML/CSS
