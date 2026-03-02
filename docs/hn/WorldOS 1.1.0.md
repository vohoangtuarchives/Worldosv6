# WorldOS v1.1.0 — Tài liệu Kiến trúc & Vận hành Hệ thống

**Phiên bản:** 1.1.0
**Ngày:** 2026-02-26  
**Trạng thái:** Chính thức  
**Phạm vi:** Toàn bộ hệ thống WorldOS – Core Kernel, Governance, Experimentation, và AI Meta-Layer  

---

## Lời nói đầu

WorldOS không còn là một dự án "sinh truyện" hay "mô phỏng giải trí". Với phiên bản 1.0.0, WorldOS chính thức được định nghĩa là một **Computational Laboratory** (Phòng thí nghiệm Tính toán) nghiên cứu động lực học tiến hóa của các nền văn minh. Hệ thống vận hành dựa trên nền tảng toán học chặt chẽ, các bất biến (invariants) tuyệt đối, và giao thức thí nghiệm (experiment protocol) nghiêm ngặt. Mọi thành phần mở rộng (plugin, genre, AI) đều phải tuân thủ các nguyên tắc này, đảm bảo tính tái lập, ổn định và khả năng mở rộng về mặt khoa học.

Tài liệu này tổng hợp toàn bộ kiến trúc, triết lý, và quy tắc vận hành của WorldOS v1.0.0, là nguồn tham chiếu duy nhất và có giá trị pháp lý cao nhất đối với mọi triển khai.

---

## Mục lục

1. [Tổng quan & Triết lý cốt lõi](#1-tổng-quan--triết-lý-cốt-lõi)
2. [Các Tiên đề Tối cao (Core Axioms)](#2-các-tiên-đề-tối-cao-core-axioms)
3. [Kiến trúc 3 Lớp (3-Layer Architecture)](#3-kiến-trúc-3-lớp-3-layer-architecture)
4. [Đặc tả Toán học Kernel](#4-đặc-tả-toán-học-kernel)
5. [Các Bất biến (Invariants)](#5-các-bất-biến-invariants)
6. [Giao thức Thí nghiệm (Experiment Protocol)](#6-giao-thức-thí-nghiệm-experiment-protocol)
7. [Governance & Hiến pháp](#7-governance--hiến-pháp)
8. [Myth, Scar, Observer & Narrative](#8-myth-scar-observer--narrative)
9. [Kiến trúc Đa Thể loại (Multi-Genre) & Plugin](#9-kiến-trúc-đa-thể-loại-multi-genre--plugin)
10. [Cây Đa Vũ trụ Tiến hóa (Evolutionary World Tree)](#10-cây-đa-vũ-trụ-tiến-hóa-evolutionary-world-tree)
11. [Lớp AI Meta Tối ưu hóa (AI Meta-Layer)](#11-lớp-ai-meta-tối-ưu-hóa-ai-meta-layer)
12. [Lộ trình Phát triển](#12-lộ-trình-phát-triển)
13. [Kết luận](#13-kết-luận)
14. [Phụ lục đính kèm](#14-phụ-lục-đính-kèm)

---

## 1. Tổng quan & Triết lý cốt lõi

WorldOS là một **hệ thống mô phỏng tiến hóa văn minh đa vũ trụ**, hoạt động ở **rìa hỗn mang (Edge of Chaos)**. Thay vì tạo ra câu chuyện, WorldOS tạo ra các điều kiện vật lý – xã hội – nhận thức để lịch sử tự nổi sinh (emergent history). Các nguyên tắc thiết kế nền tảng:

- **Physics-first, Narrative-observed:** Kernel toán học quyết định sự thật nhân quả; lớp kể chuyện (narrative) chỉ là sự quan sát và diễn giải muộn.
- **Tuyệt đối tất định (Absolute Determinism):** Cùng một tham số và hạt giống (seed) phải tạo ra chuỗi trạng thái giống hệt nhau, bất kể số lần chạy.
- **Ổn định có kiểm soát (Controlled Stability):** Hệ thống là một ánh xạ co (contraction map) với biên phổ (spectral margin) được đảm bảo, nhưng vẫn cho phép các hành vi gần biên (near-critical) để tạo ra sự phức tạp.
- **Thí nghiệm là đơn vị cơ bản (Experiment as a First-Class Citizen):** Mọi hoạt động chạy mô phỏng đều là một thí nghiệm với metadata đầy đủ, có thể tái lập và kiểm toán.
- **Bất biến bất khả xâm phạm (Inviolable Invariants):** 10 bất biến (xem Mục 5) phải được thỏa mãn ở mọi tick, nếu không thí nghiệm bị hủy bỏ.

WorldOS được xây dựng theo mô hình hybrid: **PHP/Laravel** đảm nhiệm orchestration, governance, database; **Python (microservice)** phục vụ tối ưu hóa Bayes và AI meta-layer; **Rust (tương lai)** cho xử lý ma trận hiệu năng cao khi số chiều lớn.

---

## 2. Các Tiên đề Tối cao (Core Axioms)

Tám tiên đề dưới đây là nền tảng bất biến của toàn bộ hệ thống. Mọi quyết định kiến trúc, mở rộng, hay thay đổi đều không được vi phạm.

### AXIOM 1: Bất biến Chiều Cốt lõi (Core Dimensionality is Fixed)
- Vector trạng thái cốt lõi $\mathbf{x} \in \mathbb{R}^{n_{\text{core}}}$ với $n_{\text{core}}$ cố định (tối thiểu 6 chiều: Entropy, Order, Innovation, Cohesion, Inequality, Trauma).
- Các thành phần mở rộng (genre) chỉ được thêm vào state phụ trợ $\mathbf{z}$, và phải chịu ràng buộc bởi $\mathbf{x}$.

### AXIOM 2: Sống ở Rìa Hỗn mang (Regionally Stable, Boundary Critical)
- Trong vùng sinh tồn (Survival Basin), bán kính phổ $\rho(\mathbf{J}) < 1$.
- Tại biên, $\rho(\mathbf{J}) \approx 1$, cho phép tự tổ chức tới hạn (Self-Organized Criticality).
- Hệ thống phải có cơ chế đẩy ra biên (exploration force) để tránh sự trì trệ.

### AXIOM 3: Giới hạn Năng lượng Toàn cục (Energy Budget Constraint)
- Tồn tại một bất biến năng lượng $E(\mathbf{x}) \le E_{\text{max}}$.
- Các hàm bão hòa phi tuyến (ví dụ $-\mu x^3$) phải có mặt để triệt tiêu năng lượng khi vượt ngưỡng.

### AXIOM 4: Tính Tiền định Tuyệt đối (Absolute Determinism)
- Với cùng seed, $\mathbf{x}_0$, tham số $\theta$, và thứ tự plugin, kernel phải sinh ra chuỗi $\mathbf{x}(t)$ giống hệt (sai số chỉ do floating-point, $\le \epsilon_{\text{machine}}$).

### AXIOM 5: Sụp đổ là Công cụ Tiến hóa (Structural Collapse as Evolutionary Incentive)
- Sụp đổ không phải lỗi, mà là hệ quả của tích lũy entropy kép (structural + cognitive).
- Khi sụp đổ, world được đóng băng (snapshot) và trở thành một nhánh trên Cây Đa Vũ trụ.

### AXIOM 6: Mục tiêu Kép của Agent (Survival vs Exploration)
- Các agent (AI) phải cân bằng giữa khám phá (đẩy hệ ra biên) và sinh tồn (giữ $\rho(\mathbf{J}) < 1$).
- Hàm mục tiêu: $\max \text{DistanceToStableCore}$ với ràng buộc $P_{\text{collapse}} \le \tau$.

### AXIOM 7: Nhiễu Loạn Ngoại Lai có Kiểm soát (Perturbation Projection Constraint)
- Mọi tác động từ plugin, genre, hay actor đều phải thông qua vector điều khiển $\mathbf{u}(t)$ và bị chặn bởi $\|\mathbf{u}(t)\| \le \gamma_{\text{cap}}$.
- Không cho phép override kernel matrix $\mathbf{J}$.

### AXIOM 8: Di sản Xuyên Vũ trụ (Memory Residue)
- Khi một world sụp đổ và sinh ra các nhánh con, một phần di sản (meta-knowledge) được chuyển giao.
- Không có total reset; hệ thống học từ sai lầm.

### AXIOM 9: Myth Field Coupling (Trường Huyền Thoại Bền Vững)
- Huyền thoại (Myth) là một trường phân rã chậm (slow-decay field) điều khiển lực khám phá và khuynh hướng hành vi của hệ thống thay vì sụp đổ ngẫu nhiên. Nó tuân theo phương trình $m(t+1) = \alpha m(t) + \mathcal{F}(\text{MajorEvents})$. Hệ số $\alpha \approx 1$.
- Myth không triệt tiêu các luật vật lý (không override kernel $\mathbf{J}$), nó định hướng tính bạo dạn (exploration bias) hoặc sự bảo thủ của hệ quy chiếu đối với trạng thái lõi.

### AXIOM 10: Scar Structural Memory & Transcendent Residue (Sẹo Cấu Trúc và Hồi Phục Tiến Hóa)
- Vết sẹo lịch sử (Scar) tích lũy sau mỗi biến cố lớn và sự sụp đổ. Không giống Entropy (hỗn loạn), Scar làm suy giảm năng lực trần (cap) của hệ thống: $E_{\text{max, eff}} = E_{\text{max}} - \beta\|s\|$.
- Scar phục hồi tiệm cận cực kỳ chậm. Khi sụp đổ, một phần Scar truyền sang đa vũ trụ tạo thành "Ký ức cấu trúc" $\to$ WorldOS lão hóa (aging) và cũng hình thành sự chọn lọc sinh tồn sâu thẳm.

### AXIOM 11: Teleological Drift Constraint (Cơ Chế Khởi Tính Ý Chí Lịch Sử)
- Ideology (Hệ Tư Tưởng) là một mô hình sinh mẫu nội tại phản ánh nhận thức (Perception) và bộ trọng số ưu tiên (Utility Weights). Sự trường tồn của Ideology qua ngàn đời sụp đổ hình thành một Gradient Thống Kê.
- Gradient này hoạt động như Meta-Dynamics. Không xác quyết từ trên xuống, "Ý Chí Lịch Sử" là Attractor xuất hiện tự phát (emergent) khi Đa Vũ Trụ học được cấu trúc nào nên tồn tại lâu dài hơn (Survival Horizon).

---

## 3. Kiến trúc 3 Lớp (3-Layer Architecture)

Để đảm bảo tính cách biệt giữa toán học thuần túy, kiểm soát, và mở rộng, kernel được tổ chức thành ba lớp:

### 3.1 Lớp 1 – MathCore (Thuần toán học)
- **Trách nhiệm:** Thực hiện phép cập nhật trạng thái theo phương trình (xem Mục 4).
- **Đặc điểm:** Pure function, deterministic, không biết gì về governance hay plugin.
- **Đầu vào:** $\mathbf{x}(t), \mathbf{u}(t), \mathbf{A}, \mathbf{L}, \alpha, \lambda, \eta, \beta$.
- **Đầu ra:** $\mathbf{x}(t+1)$.

### 3.2 Lớp 2 – GovernanceGuard (Lớp kiểm soát)
- **Trách nhiệm:** Kiểm tra tất cả các bất biến trước và sau khi gọi MathCore.
- **Nhiệm vụ cụ thể:**
  - Đảm bảo $\|\mathbf{u}\| \le \gamma_{\text{cap}}$.
  - Kiểm tra $\mathbf{A}$ row-stochastic, $\mathbf{L}$ đối xứng và PSD.
  - Tính Gershgorin bound để ước lượng nhanh $\rho(\mathbf{J})$, yêu cầu $\rho \le 1 - \delta$ ($\delta \ge 0.05$).
  - Tính tỷ lệ năng lượng $r(t) = \|\mathbf{x}(t+1)\| / \|\mathbf{x}(t)\|$, nếu $r(t) > 1 - \delta + \epsilon$ thì từ chối cập nhật.
- **Quyền hạn:** Có thể reject tick, rollback snapshot, vô hiệu hóa plugin vi phạm, kết thúc thí nghiệm.

### 3.3 Lớp 3 – ExtensionOrchestrator (Lớp điều phối mở rộng)
- **Trách nhiệm:** Quản lý vòng đời của các plugin, actor, material.
- **Nhiệm vụ:**
  - Thu thập và tổng hợp các đóng góp $\mathbf{u}_i$ từ các extension, đảm bảo tổng chuẩn $\le \gamma_{\text{cap}}$.
  - Xây dựng ma trận $\mathbf{A}$ và $\mathbf{L}$ từ cấu hình world và các plugin (nếu có).
  - Gọi luồng: `ExtensionOrchestrator` $\to$ `GovernanceGuard` $\to$ `MathCore` $\to$ lưu snapshot.

---

## 4. Đặc tả Toán học Kernel

### 4.1 Không gian trạng thái
- **Latent state:** $\mathbf{x}(t) \in \mathbb{R}^n$, không bị chặn.
- **Observable state:** $\mathbf{S}(t) = \sigma(\mathbf{x}(t))$ với $\sigma$ là sigmoid từng phần tử:
  $$ \sigma(x_i) = \frac{1}{1 + e^{-x_i}} \in (0, 1) $$
  Snapshot lưu $\mathbf{x}(t)$.

### 4.2 Phương trình cập nhật
Phương trình cập nhật cho latent state:
$$
\mathbf{x}(t+1) = \mathbf{x}(t) + \alpha \left[ (\mathbf{A} - \mathbf{I})\mathbf{x}(t) - \lambda \mathbf{L} \mathbf{x}(t) - \eta \mathbf{x}(t) + \beta \mathbf{u}(t) \right]
$$

Trong đó:
- $\mathbf{A} \in \mathbb{R}^{n \times n}$ là ma trận row-stochastic: $A_{ij} \ge 0$, $\sum_j A_{ij} = 1 \ \forall i$.
- $\mathbf{L}$ là graph Laplacian cho tương tác giữa các vùng (multi-region), nếu không có multi-region thì $\lambda = 0$.
- $\eta > 0$: hệ số cản nội tại (intrinsic damping), bắt buộc.
- $\alpha \in (0,1)$: damping factor.
- $\beta \ll 1$: hệ số scale cho đầu vào.
- $\mathbf{u}(t)$: vector điều khiển từ bên ngoài, thỏa $\|\mathbf{u}(t)\| \le \gamma_{\text{cap}}$.

Viết dưới dạng ma trận Jacobian:
$$
\mathbf{J} = \mathbf{I} + \alpha \left[ (\mathbf{A} - \mathbf{I}) - \lambda \mathbf{L} - \eta \mathbf{I} \right]
$$
Khi đó:
$$
\mathbf{x}(t+1) = \mathbf{J}\mathbf{x}(t) + \alpha \beta \mathbf{u}(t)
$$

### 4.3 Điều kiện ổn định
- Với $\mathbf{u} = \mathbf{0}$, hệ là tuyến tính $\mathbf{x}(t+1) = \mathbf{J}\mathbf{x}(t)$. Để hệ co (contraction), cần $\rho(\mathbf{J}) < 1$.
- Điều kiện đủ: $\alpha$ đủ nhỏ, $\lambda \le 0.5$, $\eta > 0$, và $\mathbf{A}$ row-stochastic.
- Với $\mathbf{u} \neq \mathbf{0}$ và bị chặn, hệ là Input-to-State Stable (ISS): tồn tại hằng số $K > 0$, $\rho \in (0,1)$ sao cho:
  $$ \|\mathbf{x}(t)\| \le K \rho^t \|\mathbf{x}(0)\| + \frac{K}{1 - \rho} \sup_{0 \le \tau \le t} \|\alpha \beta \mathbf{u}(\tau)\| $$
  Điều này chứng minh trạng thái luôn bị chặn nếu đầu vào bị chặn.

### 4.4 Chứng minh Lyapunov (tóm tắt)
Chọn hàm Lyapunov $V(\mathbf{x}) = \mathbf{x}^\top \mathbf{x}$.
- Khi $\mathbf{u}=0$:
  $$ \Delta V = V(\mathbf{x}(t+1)) - V(\mathbf{x}(t)) = \mathbf{x}^\top (\mathbf{J}^\top \mathbf{J} - \mathbf{I}) \mathbf{x} \le -(1 - \rho(\mathbf{J})^2) \|\mathbf{x}\|^2 $$
  Vì $\rho(\mathbf{J}) < 1$, hệ ổn định tiệm cận.
- Khi có $\mathbf{u}$, sử dụng bất đẳng thức:
  $$ V(t+1) \le \rho(\mathbf{J})^2 V(t) + K \|\mathbf{u}\|^2 $$
  Suy ra tính ISS.

---

## 5. Các Bất biến (Invariants)

10 bất biến bắt buộc, được kiểm tra bởi GovernanceGuard ở mọi tick. Vi phạm bất kỳ bất biến nào sẽ dẫn đến reject tick và đánh dấu thí nghiệm invalid.

| #  | Tên                           | Mô tả                                                                                                   | Công thức / Điều kiện                                                                 |
|----|-------------------------------|---------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------|
| 1  | Spectral Margin               | Bán kính phổ của $\mathbf{J}$ phải nhỏ hơn $1 - \delta$ ($\delta \ge 0.05$)                             | $\rho(\mathbf{J}) \le 1 - \delta$ hoặc Gershgorin bound cho mọi hàng: $|J_{ii}| + \sum_{j \neq i} |J_{ij}| < 1$ |
| 2  | Intrinsic Damping             | $\eta$ phải dương và $\alpha \eta < 1$                                                                 | $\eta > 0$, $\alpha \eta < 1$                                                          |
| 3  | Diffusion Positivity          | Nếu multi-region, $\mathbf{L}$ phải đối xứng, PSD, $\lambda \ge 0$                                      | $\mathbf{L} = \mathbf{L}^\top$, $\mathbf{L} \succeq 0$, $\lambda \ge 0$                |
| 4  | Input Norm Bound              | Tổng lực tác động ngoại sinh bị chặn                                                                   | $\|\mathbf{u}(t)\| \le \gamma_{\text{cap}}$                                            |
| 5  | Stability Budget              | Tỷ lệ tăng năng lượng giữa hai tick không vượt quá ngưỡng                                              | $r(t) = \frac{\|\mathbf{x}(t+1)\|}{\|\mathbf{x}(t)\|} \le 1 - \delta + \epsilon$, với $\epsilon$ nhỏ (vd 0.01) |
| 6  | Boundedness                   | Trạng thái luôn bị chặn bởi $R_{\max}$                                                                 | $\|\mathbf{x}(t)\| \le R_{\max}$ (nếu vượt, hard stop)                                 |
| 7  | Tick Determinism              | Cùng cấu hình phải cho cùng kết quả                                                                    | Hash của $\mathbf{x}(t)$ phải giống nhau giữa các lần chạy                             |
| 8  | Execution Order Determinism   | Thứ tự plugin phải được sắp xếp rõ ràng, không phụ thuộc vào container                                  | Ví dụ: sắp xếp theo UUID hoặc tên plugin                                               |
| 9  | Hash Chain Integrity          | Mỗi snapshot phải được liên kết với snapshot trước bằng hash                                           | $\text{hash}_t = \text{SHA256}(\text{hash}_{t-1} + \text{serialize}(\mathbf{x}_t))$  |
| 10 | Parameter Immutability        | Các tham số $\alpha, \lambda, \eta, \gamma_{\text{cap}}$ không thay đổi giữa chừng                      | Không được phép mutation mid-run                                                        |

---

## 6. Giao thức Thí nghiệm (Experiment Protocol)

Mọi thí nghiệm (experiment) trên WorldOS phải tuân thủ các quy tắc sau. Nếu không, kết quả được coi là không hợp lệ.

### 6.1 Định nghĩa experiment
Một experiment là một lần chạy mô phỏng với:
- Kernel version cố định.
- Bộ tham số $\theta = (\alpha, \lambda, \eta, \gamma_{\text{cap}}, \delta_{\text{target}})$ cố định.
- Điều kiện ban đầu $\mathbf{x}(0)$ cố định.
- Danh sách plugin và thứ tự cố định.
- Số tick xác định.

### 6.2 Metadata bắt buộc
Mỗi experiment phải ghi lại:
- **Kernel information:** version, commit hash, checksum MathCore, GovernanceGuard.
- **State dimension:** $n$, số vùng $R$, tổng chiều $n \times R$.
- **Parameters:** $\alpha, \lambda, \eta, \gamma_{\text{cap}}, \delta$.
- **Stability report:** $\rho_{\text{estimate}}$ (hoặc Gershgorin bound), số lần vi phạm budget, $\max \|\mathbf{x}\|$.
- **Initial conditions:** $\mathbf{x}(0)$ hash, seed, phương pháp khởi tạo.
- **Runtime:** số tick, tần suất snapshot, precision mode, hardware specs.
- **Performance metrics:** thời gian trung bình mỗi tick, peak memory, tổng thời gian.

### 6.3 Quy trình thực thi
1. Load cấu hình.
2. Validate invariants (bởi GovernanceGuard).
3. Freeze parameters.
4. Initialize $\mathbf{x}(0)$.
5. Chạy vòng lặp tick tất định.
6. Persist snapshots.
7. Tạo báo cáo cuối cùng.
8. Khóa experiment record (immutable).

### 6.4 Kiểm tra tái lập (Reproducibility Test)
- Trên cùng máy: chạy lại hai lần, snapshot hashes phải giống hệt.
- Trên máy khác (nếu dùng floating-point): sai số $\|\mathbf{x}_1(t) - \mathbf{x}_2(t)\| \le \epsilon_{\text{machine}}$, nếu fixed-point thì byte-identical.

### 6.5 Cấm tuyệt đối
- Thay đổi tham số giữa chừng.
- Bypass GovernanceGuard.
- Plugin sửa trực tiếp $\mathbf{x}$.
- Thứ tự plugin không xác định.
- Sửa snapshot thủ công.

---

## 7. Governance & Hiến pháp

### 7.1 WORLD ENGINE CONSTITUTION (tóm tắt)
- **Article I – World Law:** World Law Profile là tối cao. Mâu thuẫn → dừng simulation.
- **Article II – AI:** AI không tự sửa luật, không tự fork, không tự kill. Mọi output phải có claim, validation, audit.
- **Article III – Human:** Mọi hành động tối thượng phải có audit và justification. Kill World là không thể đảo ngược.
- **Article IV – Incident:** Mọi sự cố phải ghi nhận, post-mortem trước khi resume.
- **Article V – Fork:** Fork chỉ hợp lệ khi có lý do, post-mortem, governance approval.
- **Article VI – Memory:** Event không xóa, incident không che, audit tồn tại lâu dài.

### 7.2 Các nguyên tắc governance mở rộng
- **Seed Governance:** Seed (xung lực) có giới hạn số lượng, không cộng tuyến, có lifecycle DORMANT → ACTIVE → EXHAUSTED. Không reactivate EXHAUSTED.
- **Myth & Scar:**
  - Myth là belief pattern đạt critical mass, có thể DECAY, MERGE, không xóa tay.
  - Scar là hậu quả vĩnh viễn, immutable, append-only.
- **World Trace Repository (WTR):** Lưu trữ các pattern, myth origin, failure, stability để phục vụ meta-learning.

---

## 8. Myth, Scar, Observer & Narrative

Phần này tóm tắt từ ADR Unified Myth, nhưng được điều chỉnh để phù hợp với triết lý Physics-first.

### 8.1 Myth
- **Định nghĩa:** Cấu trúc niềm tin đủ mạnh để tác động reality (soft rule).
- **Điều kiện hình thành:** Belief lặp lại, được chia sẻ, sinh ra hành vi thực (Event/Scar), hệ thống truy xuất được chuỗi.
- **Lifecycle:** Belief lặp lại → Emergence → Active → Decay/Merge → Scar.
- **Governance:** Không tạo/force merge/boost strength, chỉ quan sát.

### 8.2 Scar
- **Định nghĩa:** Dấu vết dài hạn của Myth/Event lên reality.
- **Tính chất:** Bất biến, tích tụ, nguy hiểm (càng nhiều Scar, diễn giải càng sai).
- **Governance:** Immutable, không heal, không forget, chỉ xem.

### 8.3 Observer
- **Định nghĩa:** Thực thể ghi nhận thế giới, không phải tác nhân vận hành.
- **Cấm:** Tự tạo Event, thay đổi Rule, tác động vào Belief.
- **Observer Version:** Mỗi observer có cách diễn giải riêng, không có "chân lý tuyệt đối".
- **AI Observer:** Có thể phân tích pattern, freeze snapshot, nhưng không quyết định canon, không xóa Scar.

### 8.4 Narrative
- **World vs Story:** World là cơ chế vật lý; Story là cách Event được kể lại.
- **Narrative Seeds:** Bắt đầu từ Scar chưa lành, Myth suy yếu, Belief mâu thuẫn.
- **Canon:** Tạm thời, là story được tin nhiều nhất ở một thời điểm.
- **Anti-Story Rules:** Không Deus Ex Machina, không plot armor, không retcon.

---

## 9. Kiến trúc Đa Thể loại (Multi-Genre) & Plugin

### 9.1 Nguyên tắc
- Genre là một lớp nhiễu (perturbation layer) tác động lên core dynamics thông qua $\mathbf{u}$ và các tham số phụ trợ.
- Không được thay đổi core dimensions hay kernel matrix $\mathbf{J}$.

### 9.2 Cấu trúc genre
Mỗi genre định nghĩa:
- **State phụ trợ $\mathbf{z}$:** các chiều đặc thù (ví dụ: linh khí, phóng xạ).
- **Coupling:** cách $\mathbf{z}$ ảnh hưởng $\mathbf{u}$ và ngược lại, nhưng luôn thông qua bộ kiểm soát $\gamma_{\text{cap}}$.
- **Vocabulary maps:** dùng cho lớp narrative.

### 9.3 Plugin
- Plugin đóng góp vào $\mathbf{u}$ hoặc điều chỉnh $\mathbf{A}$, $\mathbf{L}$ trong giới hạn cho phép.
- Mọi thay đổi phải được GovernanceGuard phê duyệt.

---

## 10. Cây Đa Vũ trụ Tiến hóa (Evolutionary World Tree)

### 10.1 Sụp đổ là chọn lọc
Khi một world sụp đổ (collapse), nó không biến mất mà trở thành một node trên cây, với snapshot đóng băng. Các world con (branches) được sinh ra với:
- Đột biến nhẹ tham số $\theta$.
- Loại bỏ các agent/phương pháp gây sụp đổ.
- Kế thừa một phần di sản (meta-knowledge) từ world cha.

### 10.2 Meta-knowledge leak
- Các bài học từ thất bại (failure traces) được lưu trong WTR và có thể ảnh hưởng đến việc chọn seed cho world con.
- Không trao đổi trạng thái $\mathbf{x}$, chỉ trao đổi tri thức dạng pattern.

### 10.3 Censorship filter
- Tri thức được truyền qua bộ lọc dựa trên fitness: những bài học dẫn đến tuyệt diệt hoặc trì trệ bị loại bỏ, nhưng có một phần ngẫu nhiên để giữ đa dạng.

---

## 11. Lớp AI Meta Tối ưu hóa (AI Meta-Layer)

### 11.1 Mục tiêu
Tự động tìm bộ tham số $\theta = (\alpha, \lambda, \eta)$ tối ưu cho một mục tiêu nào đó (ví dụ: tối đa hóa biên ổn định, tối đa hóa đa dạng văn hóa) mà vẫn đảm bảo an toàn.

### 11.2 Phương pháp: Stability-Aware Bayesian Optimization (SABO)
- **Surrogate model:** Gaussian Process (GP) dự đoán margin $m(\theta) = 1 - \rho(\mathbf{J}(\theta))$ và độ bất định.
- **Acquisition function:** Expected Improvement (EI) có ràng buộc: chỉ chọn các điểm có xác suất vi phạm an toàn thấp ($P(m(\theta) > 0) > 0.8$).
- **Công thức cập nhật:**
  Với tập dữ liệu $\mathcal{D} = \{(\theta_i, m_i)\}$, GP cho dự đoán $\mu(\theta)$, $\sigma(\theta)$. Acquisition function:
  $$ \text{EI}(\theta) = \mathbb{E}[\max(m(\theta) - m_{\text{best}}, 0)] $$
  Chọn $\theta_{\text{next}} = \arg\max \text{EI}(\theta)$ thỏa mãn ràng buộc an toàn.

### 11.3 Flow
1. Laravel sinh thí nghiệm với $\theta$ hiện tại, ghi nhận margin.
2. Gửi dữ liệu đến Python microservice.
3. Python cập nhật GP, đề xuất $\theta_{\text{next}}$.
4. Laravel chạy thí nghiệm mới, lặp lại.

---

## 12. Lộ trình Phát triển

### Giai đoạn 1: Hoàn thiện Core (Q1 2026)
- [x] Đặc tả toán học kernel v1.2.
- [x] Xây dựng MathCore, GovernanceGuard, ExtensionOrchestrator (PHP).
- [x] Thiết lập 10 invariants và experiment protocol.
- [x] Cơ sở dữ liệu cho experiments, snapshots, hash chain.

### Giai đoạn 2: Multi-genre & Plugin (Q2 2026)
- [ ] Xây dựng hệ thống plugin cho phép mở rộng an toàn.
- [ ] Triển khai 2-3 genre mẫu (Xianxia, Sci-Fi, Apocalypse).
- [ ] Tích hợp Material Engine và Actor cơ bản.

### Giai đoạn 3: Evolutionary World Tree (Q3 2026)
- [ ] Xây dựng cơ chế collapse và branching.
- [ ] WTR hoàn chỉnh với pattern extraction.
- [ ] Tích hợp meta-knowledge leak.

### Giai đoạn 4: AI Meta-Layer (Q4 2026)
- [ ] Python microservice cho Bayesian Optimization.
- [ ] Tích hợp SABO vào vòng lặp thí nghiệm.
- [ ] Giao diện web cho phép researchers thực hiện thí nghiệm và xem kết quả.

---

## 13. Kết luận

WorldOS v1.0.0 là một bước chuyển mình quan trọng từ một dự án mô phỏng giải trí sang một phòng thí nghiệm tính toán nghiêm túc. Với nền tảng toán học vững chắc, các bất biến tuyệt đối, và giao thức thí nghiệm chặt chẽ, WorldOS đủ khả năng trở thành công cụ nghiên cứu động lực học văn minh, đồng thời mở ra khả năng tích hợp AI để tự động khám phá các vùng tham số tối ưu.

Mọi phát triển trong tương lai đều phải tuân thủ các nguyên tắc và quy định trong tài liệu này. Chỉ có như vậy, WorldOS mới có thể "outlive its creators, without forgetting why it exists."

---

## 14. Phụ lục đính kèm

Để đi sâu vào chứng minh toán học và đặc tả kỹ thuật chi tiết của hệ thống, vui lòng tham khảo các phụ lục cốt lõi sau:

- **[Appendix 01: Thiết kế Cơ bản & Động lực học Chuyển pha (RSCD v1.1)](Appendix_01.md)**: Phân tích 6 Core Dimensions, cấu hình Regime Matrices ($J_k$), trích xuất di sản cấu trúc (RTS), Directed Mutation đa vũ trụ, và tính ổn định qua Perturbation Bound & Meta-Lyapunov Function.
- **[Appendix 02: Kịch tính Tự sinh & Bifurcation Formalization (RSCD v1.2)](Appendix_02.md)**: Khai thác lực căng biểu kiến (Tension-first), Event Extraction, Tension Integral. Giải nghĩa sự sụp đổ như Saddle-Node Bifurcation và mô hình hóa Cây Đa Vũ trụ dưới dạng chuỗi Markov (Markov Chain) mang phân phối bất biến.
- **[Appendix 03: Động lực học Huyền thoại, Ký ức & Tiến hóa Ý nghĩa (RSCD v1.3 - Tầng CAS)](Appendix_03.md)**: Gắn kết không gian Field Layer (Myth, Scar), tầng nhận thức Ideology và Meta-Meaning. Chứng minh WorldOS là một hệ thống CAS có "Ý chí Lịch sử Nổi sinh" thông qua phân cấp thời gian và đột biến hệ tư tưởng.
- **[Appendix 04: Động Lực Học Vô Hướng, Ký Ức & Chuyển Pha Lịch Sử](Appendix_04_Meta_Dynamics.md)**: Xác lập toán học cho các cơ chế bất khả nghịch (Irreversibility $\Sigma$), Lan truyền sẹo vũ trụ, Hỗn loạn tầng siêu nhận thức (Meta-Entropy), và Phá vỡ chế độ (Regime Transition $\Theta$).
- **[Appendix 05: Đặc tả Trường Vật chất & Tri thức (Material & Knowledge Field)](WORLDOS_MATERIAL_KNOWLEDGE_FIELD.md)**: Các định luật Entropy vĩ mô, giới hạn công nghệ (Tech Envelope), kiến trúc thực thi xử lý chu kỳ pha (Meta-Cycle Engine) qua mô hình đa luồng bằng Rust (`Rayon`).
- **[Appendix 06: Đặc tả Tích lũy Lịch sử (Historical Accumulation Layer)](WORLDOS_HISTORICAL_ACCUMULATION_LAYER.md)**: Động lực học ly khai vùng, cấu trúc tổ chức văn hóa, niềm tin thể chế và di sản chấn thương văn minh cạnh tranh.
- **[WORLDOS_ARCHITECTURE_MULTIVERSE: Phân Tích Kiến Trúc Kỹ Thuật Dự Án](WORLDOS_ARCHITECTURE_MULTIVERSE.md)**: Cẩm nang hướng dẫn Microservices, Data-flow, và Database Design mở rộng từ 5 lên 10,000 Universes (Next.js/PHP/Rust/Redis).
- **[WORLDOS_ARCHITECTURE_SIMULATION_ENGINE: Kiến Trúc Lõi Của WorldOS Game Engine & Social Physics](WORLDOS_ARCHITECTURE_SIMULATION_ENGINE.md)**: Đặc tả mô hình Đa vũ trụ A+B (DAG), hệ thống mô phỏng đa phân giải (Hybrid Resolution) kết hợp Deterministic Macro và Stochastic Micro, cấu trúc MicroSession với Semi-Agent 12D Trait, và thiết kế Bimodal Dynamics khám phá điểm chuyển pha lịch sử.
- **[WORLDOS_PHILOSOPHY_HUYEN_NGUYEN_V2: Siêu Hình Học Về Điều Kiện Của Xuất Hiện](WORLDOS_PHILOSOPHY_HUYEN_NGUYEN_V2.md)**: Chuyên luận triết học làm nền tảng cốt lõi của hệ thống, định hình thế giới quan thiết kế WorldOS qua 8 tiên đề phát sinh phân biệt, quan hệ và sự nổi sinh của quy luật lịch sử.

---
