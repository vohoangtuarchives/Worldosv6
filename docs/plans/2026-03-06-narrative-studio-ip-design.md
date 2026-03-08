# Thiết kế: Narrative Studio & Mô hình 1 World = 1 IP

**Ngày:** 2026-03-06  
**Phạm vi:** Narrative Studio (ba tầng: Raw → Sử thi → Studio), mô hình IP theo World, và khả năng output "thế giới sinh sử" / "truyện là lát cắt lịch sử".

---

## 1. Tóm tắt yêu cầu

- **Nguyên tắc luồng nội dung:**
  1. **Dữ liệu raw từ WorldOS** — Nguồn chân lý duy nhất.
  2. **Sử thi từ sử gia mù** — Lớp diễn giải lịch sử từ raw (không phải sản phẩm biên tập cuối).
  3. **Studio sản xuất tác phẩm** — Chỉ sau khi đã có sử thi; dùng raw + sử thi để tạo truyện, chapter, beat.

- **Câu hỏi:** Thế giới sinh sử, các câu chuyện chỉ là lát cắt lịch sử — chúng ta có output được các thứ như vậy không?

- **Tầm nhìn:** Mỗi **World** là **một IP** → chứa truyện, tác phẩm, novel, nhân vật, văn hóa, lịch sử.

---

## 2. Trả lời: Có output được "thế giới sinh sử" và "truyện là lát cắt lịch sử" không?

### 2.1 Hiện trạng hệ thống

| Thành phần | Mô tả ngắn | Output liên quan |
|------------|------------|-------------------|
| **Universe + Snapshots** | Trạng thái mô phỏng theo tick (entropy, stability, metrics, state_vector). | **Raw:** Dữ liệu thế giới theo thời gian (thế giới “sinh” dữ liệu lịch sử). |
| **Chronicle** | Bản ghi sử thi/biên niên cho một khoảng tick (from_tick → to_tick). Nội dung từ `NarrativeAiService.generateChronicle()` với persona "Sử gia vũ trụ", prompt tiếng Việt, 3–5 đoạn. | **Sử thi:** Một “lát” lịch sử đã được kể lại (sử gia mù). |
| **NarrativeSeries + SerialChapter** | Series gắn Universe; mỗi chapter = một lát tick (tick_start → tick_end), content từ Chronicle hoặc NarrativeLoom. | **Truyện/tác phẩm:** Chương truyện = lát cắt lịch sử đã biên tập. |
| **StoryBible** | characters, locations, lore theo Series. | **Nhân vật, bối cảnh, văn hóa** trong khuôn khổ một tác phẩm. |

### 2.2 Kết luận

- **“Thế giới sinh sử”** — **Có.**  
  - World → Universes → Snapshots (theo tick) tạo ra **dòng lịch sử raw**.  
  - Chronicle được sinh từ raw (perceived archive, events, civ fields) → đây chính là **sử do thế giới “sinh” ra**, qua lăng kính sử gia mù.

- **“Các câu chuyện chỉ là lát cắt lịch sử”** — **Có.**  
  - Mỗi **SerialChapter** có `tick_start`, `tick_end` và nội dung gắn với một Chronicle (một khoảng tick).  
  - Một **NarrativeSeries** là một “câu chuyện” gồm nhiều chapter = nhiều lát cắt liên tiếp (hoặc có thể chọn lát cắt theo tick cho từng truyện ngắn / one-shot).  
  - Có thể output: danh sách chronicles theo universe (sử thi từng đoạn), danh sách chapters theo series (truyện là lát cắt lịch sử).

**Gap cần làm rõ trong sản phẩm:**  
- API/list view cho “toàn bộ sử thi của một Universe” (chronicles theo thời gian) để người dùng thấy rõ “thế giới sinh sử”.  
- Trong Narrative Studio: tầng 2 (Sử thi) cần hiển thị rõ các Chronicle này và cho phép chọn “lát” (tick range hoặc chronicle) làm đầu vào cho tầng 3 (Studio).

---

## 3. Ba tầng trong Narrative Studio

### 3.1 Tầng 1 — Dữ liệu raw WorldOS

- **Nguồn:** Universe → Snapshots, events (từ engine/backend), metrics (entropy, stability, civ_fields, …).  
- **UI:**  
  - Chọn Universe.  
  - Hiển thị danh sách **sự kiện / snapshot** (tick, entropy, stability, loại event) dưới dạng **chỉ đọc**, gắn nhãn rõ “Dữ liệu WorldOS” hoặc “Raw”.  
- **Logic:** Giữ nguyên `buildNarrativeFacts()` (hoặc tương đương) từ snapshots + chronicles raw — nhưng **hiển thị** và **ngôn ngữ** chuyển sang tiếng Việt (xem mục 5).  
- **Output:** Danh sách fact/event đã chọn làm đầu vào cho tầng 2 và 3.

### 3.2 Tầng 2 — Sử thi từ sử gia mù

- **Nguồn:** Raw (tầng 1) + Chronicle có sẵn (nếu đã có) hoặc sinh mới.  
- **Hành vi:**  
  - Nút/hành động rõ ràng: **“Sinh sử thi”** hoặc **“Sinh biên niên”** (gọi backend sinh Chronicle cho một khoảng tick từ raw).  
  - Kết quả hiển thị ở khu vực riêng: **“Sử thi – Sử gia mù”** (không nhầm với editor sản xuất).  
- **Output:** Văn bản sử thi (content của Chronicle) — có thể lưu tạm ở frontend hoặc chỉ hiển thị từ API, không bắt buộc lưu Chronicle ngay nếu chưa có quy ước.  
- **Backend:** Tận dụng `NarrativeAiService::generateChronicle(universeId, fromTick, toTick, 'chronicle')` — đã là persona sử gia, tiếng Việt, epic chronicle.

### 3.3 Tầng 3 — Studio sản xuất tác phẩm

- **Đầu vào:** Raw (facts) + **bản sử thi** (tầng 2) + preset (Chronicle / Story / Beats).  
- **Hành vi:**  
  - Editor draft nhận raw + sử thi làm context.  
  - “AI viết lại” / “Tự sinh” gửi kèm **đoạn sử thi** vào API (backend nhận thêm trường `epic_chronicle` hoặc tương đương).  
  - Lưu phiên bản, khôi phục, xuất — giữ như hiện tại nhưng rõ ràng đây là **sản phẩm biên tập**, không phải sử thi thô.  
- **Output:** Draft sản xuất (story, chapter beats, chronicle-style draft) và có thể đẩy sang IP Factory (Series/Chapter) nếu cần.

### 3.4 Luồng tổng thể

```
[Chọn Universe] → [Tầng 1: Raw – xem/chọn facts]
       ↓
[Tầng 2: Sinh sử thi] → Hiển thị "Sử thi – Sử gia mù"
       ↓
[Tầng 3: Studio] Nhập = Raw + Sử thi → Preset + AI → Draft sản xuất → Lưu / Xuất / Đẩy sang Series
```

---

## 4. Mô hình 1 World = 1 IP

### 4.1 Mục tiêu

Mỗi **World** được coi là **một IP** chứa:

- **Truyện / tác phẩm / novel:** NarrativeSeries (+ SerialChapter) thuộc các Universe của World đó.  
- **Nhân vật, văn hóa, lịch sử:** Từ StoryBible (theo Series) và từ Chronicles (sử thi) của các Universe trong World.

### 4.2 Hiện trạng

- **World** có nhiều **Universe** (multiverse).  
- **NarrativeSeries** thuộc **Universe** (không trực tiếp thuộc World).  
- **StoryBible** (characters, locations, lore) gắn với **Series**.  
- **Chronicle** gắn **Universe**.

→ Một World đã “chứa” IP thông qua: Universes → Series/Chapters/Chronicles và Bibles; cần **cách tổ chức và hiển thị** theo World.

### 4.3 Đề xuất thiết kế

- **Khái niệm “World IP”:**  
  - **World** = 1 IP.  
  - Mọi thứ thuộc IP này: truyện (series/chapters), nhân vật (bible.characters), văn hóa/lore (bible.lore), lịch sử (chronicles của mọi universe trong world), và sau này có thể mở rộng (novel, game, …).

- **Dữ liệu:**  
  - Giữ nguyên schema: Series → Universe, Bible → Series, Chronicle → Universe.  
  - Thêm **truy vấn theo World:** lấy tất cả Universes của World → từ đó lấy Series, Chapters, Chronicles, và gộp Bible (theo series) để có “World Bible” hoặc “World IP view”.

- **API (đề xuất):**  
  - `GET /worldos/worlds/{id}/ip` hoặc tương đương:  
    - Trả về: danh sách series (và chapters) của mọi universe thuộc world; danh sách chronicles (có thể gộp hoặc phân theo universe); gợi ý “World Bible” (aggregate characters/lore từ các StoryBible của các series trong world).  
  - Hoặc chỉ cần frontend gọi sẵn có: worlds, universes, rồi theo từng universe gọi series, chronicles — sau đó nhóm theo world_id ở client.  
  - Nếu cần chuẩn hóa, có thể thêm endpoint tổng hợp để một request lấy “toàn bộ IP của World”.

- **UI:**  
  - Trang/hub **“IP theo World”**: chọn World → thấy tổng quan:  
    - Lịch sử (chronicles theo thời gian / universe),  
    - Truyện/tác phẩm (series + chapters),  
    - Nhân vật & văn hóa (từ StoryBible các series).  
  - Narrative Studio khi chọn Universe vẫn giữ nguyên; có thể thêm link “Xem IP của World này” dẫn sang hub trên.

### 4.4 Mở rộng sau (không bắt buộc cho phase 1)

- **World-level Bible:** Bảng hoặc JSON “world_bibles” (world_id, characters_aggregate, lore_aggregate) nếu muốn một bản bible chung cho cả World.  
- **Slug / public site:** Mỗi World có thể có slug → trang public “IP của World” (truyện, nhân vật, lịch sử) để chia sẻ.

---

## 5. Ngôn ngữ tiếng Việt

- **Tầng 1 (Raw):** Nhãn cột, tiêu đề, loại sự kiện, đơn vị — toàn bộ tiếng Việt. Dữ liệu fact (title, summary, angle) do frontend hoặc backend sinh ra cũng nên tiếng Việt (hiện `buildNarrativeFacts` đang tiếng Anh → cần bản Việt hoặc bước dịch/ sinh tiếng Việt).  
- **Tầng 2 (Sử thi):** Backend `NarrativeAiService` đã prompt tiếng Việt; output giữ tiếng Việt.  
- **Tầng 3 (Studio):** Preset label, nút bấm, placeholder, thông báo — tiếng Việt. Draft do AI (NarrativeStudioService) đã yêu cầu “Viết bằng tiếng Việt” — giữ nguyên.  
- **Chung:** Toàn bộ UI Narrative Studio (headings, mô tả, tooltips) dùng tiếng Việt; tên preset có thể đổi thành “Biên niên”, “Truyện”, “Chapter Beats” nếu muốn thống nhất.

---

## 6. Các thành phần kỹ thuật cần chỉnh/bổ sung

| Hạng mục | Mô tả |
|----------|--------|
| **Narrative Studio UI** | Bố cục 3 tầng rõ ràng: Raw → Sử thi → Studio; nút “Sinh sử thi”; khu vực hiển thị sử thi riêng. |
| **API Narrative Studio** | Payload generate có thể thêm `epic_chronicle` (nội dung sử thi tầng 2) để AI viết lại dựa trên raw + sử thi. |
| **buildNarrativeFacts / buildPresetDraft** | Phiên bản tiếng Việt (label, title, summary, angle, section heading). |
| **World IP view** | API (hoặc aggregate từ API hiện có) + trang hub “IP theo World”: lịch sử, truyện, nhân vật, văn hóa. |
| **List chronicles theo Universe** | Đảm bảo có API/danh sách “toàn bộ sử thi” của universe (đã có `GET universes/{id}/chronicles`) — chỉ cần dùng trong UI tầng 2. |

---

## 7. Thứ tự triển khai gợi ý

1. **Phase 1 — Narrative Studio ba tầng + tiếng Việt**  
   - Chỉnh UI 3 tầng, nút “Sinh sử thi”, khu vực hiển thị sử thi.  
   - Gọi `generateChronicle` (hoặc endpoint wrapper) cho tầng 2.  
   - Chuyển facts/draft/UI sang tiếng Việt.

2. **Phase 2 — Studio dùng sử thi**  
   - API generate nhận `epic_chronicle`; backend NarrativeStudioService đưa nội dung sử thi vào prompt.  
   - Frontend gửi nội dung tầng 2 khi gọi “AI viết lại”.

3. **Phase 3 — 1 World = 1 IP**  
   - API tổng hợp IP theo World (nếu cần).  
   - Trang hub “IP theo World”: lịch sử (chronicles), truyện (series/chapters), nhân vật & văn hóa (bible).

4. **Phase 4 (tùy chọn)** — Auto-generate sử thi khi chọn khoảng tick; World-level Bible; public slug cho World.

---

## 8. Tài liệu tham chiếu

- `docs/system/11-ip-factory.md` — IP Factory, vòng Simulation → Narrative → Curation → Feedback.  
- `docs/system/12-narrative-series.md` — Series, Chapter, StoryBible.  
- Backend: `NarrativeAiService`, `NarrativeStudioService`, `SerialStoryService`; Models: `Chronicle`, `NarrativeSeries`, `SerialChapter`, `StoryBible`, `World`, `Universe`.

---

*Document này là bản thiết kế; triển khai chi tiết từng bước nên lập implementation plan riêng (task list, API spec, UI wireframe) sau khi đồng ý.*
