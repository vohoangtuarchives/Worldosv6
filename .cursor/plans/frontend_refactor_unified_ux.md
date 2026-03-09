# Kế hoạch: Refactor Frontend — Giao diện thống nhất, bám sát backend

## Mục tiêu

1. **Giao diện thống nhất, dễ dùng**: Một design system duy nhất (CSS variables); component dùng chung cho card, empty, error, loading; không còn trùng lặp style và nav.
2. **Bám sát kiến trúc backend**: API client (`api.*`) và types thống nhất; dashboard/simulation bám WorldOS (simulation-status, stream); narrative/materials/IP Factory đúng endpoint.

---

## Hiện trạng

### Hai “theme” song song

- **Token (globals.css)**: `--background`, `--card`, `--border`, `--muted-foreground` — dùng ở main layout, IP Factory.
- **Hardcode slate**: `border-slate-800`, `bg-slate-900/40`, `text-slate-400` — dùng ở Dashboard, Materials, DashboardCard, DashboardEmptyState, DashboardErrorBanner.

### Nav trùng lặp

- **Main layout**: Bảng điều khiển, Cosmologic, Narrative, Material, Mạng lưới, Timeline.
- **Dashboard sidebar**: Micro, Macro, Simulation, Cosmologic, Narrative, Materials, Networks.
- User có hai cách vào Cosmologic / Narrative / Materials → dễ rối.

### Layout không thống nhất

- **Dashboard**: DashboardShell (sidebar + header + PageContainer).
- **Materials**: Layout riêng (sidebar + content), không dùng PageContainer, style slate.
- **Timeline**: Full-screen ReactFlow, loading/error inline, màu hardcode.
- **IP Factory**: Layout riêng (header + aside + main), dùng token.
- **Narrative / Networks**: Cần rà lại có dùng PageContainer và card chung không.

### Empty / Error / Loading

- Dashboard: DashboardEmptyState, DashboardErrorBanner.
- Timeline: div loading/error riêng.
- Materials: không có empty state chung.
- IP Factory: empty state inline.
- Chưa có component Loading (spinner/skeleton) dùng chung toàn app.

---

## Hướng xử lý

### 1. Một design system (token)

- **Chuẩn**: Mọi component dùng token từ `globals.css`: `bg-background`, `bg-card`, `border-border`, `text-foreground`, `text-muted-foreground`, `bg-destructive`, v.v.
- **Hành động**:
  - Thêm hoặc chỉnh token nếu thiếu (ví dụ card “nền tối” = `bg-card`, viền = `border-border`).
  - **DashboardCard**: Đổi từ `border-slate-800 bg-slate-900/40` sang `border-border bg-card/60` (hoặc tương đương).
  - **DashboardEmptyState**, **DashboardErrorBanner**: Dùng `bg-card`, `border-border`, `text-muted-foreground`; error dùng `bg-destructive/20 border-destructive/50 text-destructive`.
  - **DashboardShell** (sidebar, header): Thay slate bằng token (sidebar: `bg-card`, `border-border`).
  - **Materials page**: Sidebar và card dùng token; có thể dùng component Card từ `components/ui/card.tsx` nếu đã có, hoặc DashboardCard đã chuẩn hóa.

### 2. Component dùng chung toàn app

- **PageContainer**: Giữ, dùng cho mọi trang nội dung (dashboard content đã dùng; Materials, Narrative, Networks, Timeline wrapper nếu cần).
- **Card**: Một loại card chính — hoặc nâng cấp `components/ui/card.tsx` với variant (default, muted), hoặc DashboardCard đổi sang dùng token và export dùng chung (ví dụ `components/ui/section-card.tsx`).
- **EmptyState**: Đưa DashboardEmptyState lên `components/ui/empty-state.tsx` (hoặc tương đương), dùng token; dashboard và các trang khác import từ đây.
- **ErrorBanner**: Đưa DashboardErrorBanner lên `components/ui/error-banner.tsx`, dùng token; dùng ở layout hoặc từng trang.
- **Loading**: Tạo `components/ui/loading-spinner.tsx` (và/hoặc skeleton) dùng token; Timeline, Materials, IP Factory, dashboard dùng chung.

### 3. Nav — bớt trùng

- **Main layout**: Giữ một link **“Bảng điều khiển”** → `/dashboard`. Các mục còn (Cosmologic, Narrative, Material, Mạng lưới, Timeline) có hai lựa chọn:
  - **A**: Bỏ khỏi top nav; vào từ dashboard sidebar (nav rõ, không trùng).
  - **B**: Giữ làm “quick links” nhưng đổi nhãn/link cho thống nhất (ví dụ “Cosmologic” → `/dashboard/cosmologic`) và style giống nhau.
- **Dashboard sidebar**: Giữ như hiện tại (Micro, Macro, Simulation, Cosmologic, Narrative, Materials, Networks); là nơi chính để đi sâu vào từng khu vực.

### 4. Từng khu vực trang

- **Dashboard (Micro, Macro, Simulation, Cosmologic)**: Đã refactor; chỉ cần đổi style sang token (DashboardCard, EmptyState, ErrorBanner, Shell).
- **Materials**: Đổi layout dùng PageContainer; sidebar + content dùng token; card list dùng Card/DashboardCard đã chuẩn; empty state dùng EmptyState chung.
- **Timeline**: Giữ full-screen ReactFlow; loading/error dùng LoadingSpinner + ErrorBanner chung, màu dùng token (nền `bg-background`, chữ `text-foreground` / `text-muted-foreground`).
- **IP Factory**: Đã dùng token; chỉ cần đảm bảo empty/error dùng EmptyState/ErrorBanner chung nếu cần.
- **Narrative, Networks**: Kiểm tra dùng PageContainer + card/empty/error chung.

### 5. Bám sát backend

- **API**: Giữ `lib/api.ts`; đảm bảo dashboard dùng `api.worldSimulationStatus`, `api.worldSimulationStatusStreamUrl` (SSE); materials dùng `api.materialDag`; narrative/IP Factory đúng endpoint như hiện tại.
- **Types**: Types simulation (`WorldSimulationStatusResponse`) đã có; kiểm tra types cho materials, narrative, IP Factory trùng với response backend.
- **SimulationMonitor**: Đã có; chỉ cần style dùng token và error/empty dùng component chung.

---

## Thứ tự thực hiện gợi ý

1. **Token cho dashboard**: Đổi DashboardCard, DashboardEmptyState, DashboardErrorBanner, DashboardShell sang token; kiểm tra Dashboard SectionTitle.
2. **Component UI chung**: Tạo hoặc chuẩn hóa `EmptyState`, `ErrorBanner`, `LoadingSpinner` trong `components/ui/`, dùng token; dashboard chuyển sang dùng nếu tách file.
3. **Nav**: Chọn A hoặc B ở trên; sửa main layout; giữ dashboard sidebar.
4. **Materials**: Refactor layout + style sang token + PageContainer + Card/EmptyState.
5. **Timeline**: Thay loading/error inline bằng LoadingSpinner + ErrorBanner; màu token.
6. **Narrative, Networks**: Rà soát PageContainer + card/empty/error.
7. **Kiểm tra API/types**: Rà nhanh các trang gọi API và types tương ứng với backend.

---

## File cần chỉnh / tạo (tóm tắt)

| Hành động | File |
|-----------|------|
| Sửa | `components/dashboard/DashboardCard.tsx` — dùng token |
| Sửa | `components/dashboard/DashboardEmptyState.tsx` — dùng token |
| Sửa | `components/dashboard/DashboardErrorBanner.tsx` — dùng token |
| Sửa | `components/dashboard/DashboardShell.tsx` — sidebar/header dùng token |
| Tạo (optional) | `components/ui/empty-state.tsx`, `components/ui/error-banner.tsx`, `components/ui/loading-spinner.tsx` — dùng token, dùng chung |
| Sửa | `app/(main)/layout.tsx` — nav (bớt trùng) |
| Sửa | `app/(main)/dashboard/materials/page.tsx` — PageContainer, token, Card/EmptyState |
| Sửa | `app/(main)/timeline/page.tsx` — LoadingSpinner, ErrorBanner, token |
| Rà | Narrative, Networks pages — PageContainer + component chung |

Sau khi xong: một design system (token), ít trùng nav, empty/error/loading nhất quán, các trang bám API và types backend.
