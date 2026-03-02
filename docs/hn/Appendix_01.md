# WorldOS Kernel: Formal Specification & Regime-Switched Dynamics (RSCD v1.1)

## 1. Cấu hình Core Dimensions & Regime Matrices

### 1.1. Core Dimensions
Hệ thống WorldOS sử dụng 6 Core Dimensions theo thứ tự cố định:
1. **Entropy (E)**
2. **Order (O)**
3. **Innovation (I)**
4. **Cohesion (C)**
5. **Inequality (Q)**
6. **Trauma (T)**

### 1.2. Formulation Cơ Bản
Ma trận Jacobian $J_k$ cho mỗi regime $k$ được định nghĩa bằng biến đổi để dễ kiểm soát *spectral margin*:
$$ J_k = I + \alpha \left[ (A_k - I) - \eta_k I \right] $$
Giả sử tham số toàn cục:
- Hệ số $\alpha = 0.25$
- Target spectral margin $\delta_{\text{target}} = 0.08$ (Yêu cầu $\rho(J_k) \le 0.92$)

Vì các ma trận $A_k$ là ma trận ngẫu nhiên theo hàng (row-stochastic), và $\eta_k > 0$, toàn bộ eigenvalues của hệ thống bị tịnh tiến sang trái, đảm bảo hệ số co $\rho(J_k) < 1$.

### 1.3. Hệ Thống 5 Regime Tiêu Chuẩn

#### 🟢 R1 — Stable Civilization
- **Triết lý:** Order giảm Entropy, Cohesion giảm Trauma, Innovation tăng nhẹ Order, Inequality tăng Entropy nhẹ.
- **Tham số damping:** $\eta_1 = 0.30$
- **Đặc trưng:** Diagonal dominance mạnh, coupling yếu, damping cao. Tạo attractor hiền, trạng thái "golden steady state".

#### 🟡 R2 — Innovation Surge
- **Triết lý:** Innovation đẩy mạnh Order & Inequality, Order giảm Entropy mạnh, Cohesion yếu dần.
- **Tham số damping:** $\eta_2 = 0.22$
- **Đặc trưng:** Coupling Innovation mạnh, damping thấp hơn, gần biên critical. Sinh tăng trưởng nhanh nhưng bất bình đẳng gia tăng.

#### 🟠 R3 — Polarization
- **Triết lý:** Vòng lặp phản hồi Inequality $\leftrightarrow$ Trauma, Cohesion giảm, Entropy tăng theo Trauma.
- **Tham số damping:** $\eta_3 = 0.18$
- **Đặc trưng:** Các thành phần off-diagonal mạnh, diagonal giảm, vận hành sát spectral margin. Tạo ra hiện tượng oscillation (dao động xã hội).

#### 🔴 R4 — Turbulence
- **Triết lý:** Trauma lan sang mọi chiều, Entropy tăng cực mạnh, Order suy yếu.
- **Tham số damping:** $\eta_4 = 0.12$
- **Đặc trưng:** Coupling dày đặc, damping rất thấp, $\rho(J_4) \approx 0.90 \to 0.92$. Trạng thái hỗn loạn nhưng bị chặn (chaotic-looking but bounded).

#### ⚫ R5 — Collapse Basin
- **Triết lý:** Strong damping, convergence về low-energy attractor để reset.
- **Tham số damping:** $\eta_5 = 0.45$
- **Đặc trưng:** Diagonal dominance cực kỳ mạnh, coupling gần như triệt tiêu. Phục vụ như một cú "reset mềm", không bùng nổ.

**Chuỗi Emergent Behavior (Luân hồi tự nhiên):**
Stable (R1) $\to$ Innovation Surge (R2) $\to$ Polarization (R3) $\to$ Turbulence (R4) $\to$ Collapse Basin (R5) $\to$ Reconstruction (R1).
*Động lực này sinh ra hoàn toàn từ cấu trúc coupling, không dùng hàm random.*

---

## 2. Regime Transition Signature (RTS) & World Tree Branching

Sự sụp đổ (collapse) không chỉ tạo ra một snapshot trạng thái, mà còn để lại **Di sản cấu trúc (Regime Transition Signature - RTS)**, đóng vai trò như DNA cho World Tree nhánh con.

### 2.1. Feature Extraction (RTS)
Thay vì lưu chuỗi regime dài, ta trích xuất các đặc trưng:
1. **Transition Matrix ($P_{ij}$):** Ma trận xác suất Markov của sự chuyển pha từ regime $i \to j$.
2. **Dwell Time Vector ($D_i$):** Tỷ lệ thời gian nền văn minh cư trú tại regime $i$.
3. **Oscillation Index (OI):** Số lần flip-flop giữa 2 regime đối nghịch (VD: $R_3 \leftrightarrow R_4$). OI cao biểu thị văn minh bị kẹt.
4. **Collapse Precursor Pattern:** Mã băm chuỗi 10 tick ngay trước thời điểm collapse.

### 2.2. Encode trong World Node
Cấu trúc `WorldNode` mở rộng:
```json
{
  "snapshot_hash": "...",
  "theta": "global_parameters",
  "RTS": {
    "transition_matrix": "[...]",
    "dwell_vector": "[...]",
    "oscillation_index": 12,
    "collapse_signature_hash": "xxx"
  },
  "parent_id": "..."
}
```

### 2.3. Quy Tắc Sinh Đột Biến Hình Học (Regime-Driven Mutation)
Không đơn thuần rải nhiễu trắng vào $\theta$. Đột biến được định hướng bởi hình học quá khứ:
- **Case Turbulence-dominant:** ($D_{R4}$ cao) $\to$ Tăng $\eta$, giảm coupling Trauma-Inequality để tăng stability margin.
- **Case Innovation Break:** ($D_{R2}$ cao, OI thấp) $\to$ Tăng $\lambda$ (diffusion), thêm damping riêng lẻ vào Innovation.
- **Case Oscillation Trap:** (OI rất lớn) $\to$ Đưa vào coupling phi đối xứng, thay đổi ranh giới regime threshold.

Để giữ tính phi hội tụ, WorldTree đánh giá **Regime Entropy Score**: $H = - \sum D_i \log D_i$. World có entropy cao được ưu tiên nhân bản, entropy thấp bị cắt tỉa (prune).

---

## 3. Formal Mutation Operator Design & Thang Đo Sụp Đổ

Toán tử đột biến $M: (\theta, \mathcal{G}, RTS) \to (\theta', \mathcal{G}')$ với $\mathcal{G}$ là hình học (regime geometry).

### 3.1. Vector hóa Mutation (Directed Mutation)
$$\Delta\theta = W \cdot \Phi(RTS)$$
(Với $\Phi$ là feature vector của RTS và $W$ là ma trận trọng số deterministic). Sau khi có $\theta'$, thực hiện phép chiếu để đảm bảo $\mathbf{\rho(J'_k) < 1 - \delta}$.
Cường độ đột biến tự thích nghi: $\|\Delta\theta\| = k \cdot (1 - H)$. (Nền văn minh càng nhàm chán, đột biến cấu trúc càng mạnh).

### 3.2. Boundary & Hysteresis Mutation (Geometry Landscape)
Định nghĩa biên giới regime là siêu phẳng $a^\top x > b$:
- **Boundary Drift:** $b' = b + \epsilon \cdot f(RTS)$. Thay đổi ngưỡng chuyển regime.
- **Hysteresis Gap:** $gap' = gap + \kappa \cdot OI$. Tăng khoảng đệm để cản dao động ping-pong.
- **Geometry Rotation:** $a' = a + \delta a$ (\ $\|a'\| = 1$). Xoay siêu phẳng quyết định để tái cấu trúc "địa hình hút" (attractor landscape).

### 3.3. Collapse Taxonomy Classifier
Dựa trên RTS, các nhánh vỡ phân loại Deterministic thành:
- **Type A (Overexpansion):** Đổi mới quá nhanh, đè nát cấu trúc ($R_2 \to$ Sụp).
- **Type B (Polarization Spiral):** Căng thẳng phân cực không lối thoát (OI sinh từ $R_3 \leftrightarrow R_4$).
- **Type C (Entropy Drift):** Sụp đổ mòn mỏi, nhiệt động lực bị bào mòn.
- **Type D (Critical Edge):** Chết vì đu dây sát mức biên stability ($\rho \approx 0.92$ trong thời gian dài).

---

## 4. Stability & Diversity Preservation (Minh Chứng Toán Học)

### 4.1. Formal Stability Under Mutation
Sử dụng Bound Perturbation:
$|\rho(J'_k) - \rho(J_k)| \le \|\Delta J_k\|$
Với phép chiếu (Projection Operator):
$$ P(J') = \begin{cases} J' & \text{với } \rho(J') < 1 - \delta \\ \frac{(1-\delta-\epsilon)}{\rho(J')} J' & \text{còn lại} \end{cases} $$
Hệ luôn đáp ứng Uniform Exponential Stability (ổn định hàm mũ đồng nhất) vì mỗi Jacobian bị khống chế $\rho \le 1 - \delta$, không thể bùng nổ bất kể world phân nhánh bao nhiêu lần.

### 4.2. Mathematical Diversity Preservation
Để tránh World Tree tiệm cận về một trạng thái phẳng, ta bảo vệ phổ đa dạng bằng cách cấu hình khoảng vi phân dưới (Lower bound) cho đột biến:
$ \|\Delta \theta\| \ge \mu(1 - H) $
Kết hợp tiêu chuẩn cắt tỉa (Pruning) nếu Distance $d(W_p, W_c) < \epsilon_{\text{sim}}$, đảm bảo cây nhánh hình thành *$\epsilon$-separated metric tree*, không bao giờ dồn về 1 attractor chung.

---

## 5. Meta-Lyapunov Function cho World Tree Cấp Thượng Hệ

Hệ thống có hai cấp Lyapunov:
- **Level 1 (State):** $V(x) = x^\top x$ chứng minh sự co tiệm cận (contractive / ISS) trong nội tại mỗi world.
- **Level 2 (Evolution Space):** Định nghĩa không gian tiến hóa $\Theta = (\theta, J_k, \mathcal{G})$.

### 5.1. Hàm Meta-Lyapunov
$$ L(\Theta) = w_1 \cdot \text{StabilityMargin} + w_2 \cdot \text{RegimeEntropy} - w_3 \cdot \text{GeometryEnergy} $$
Trong đó:
- **Stability Margin ($m$):** $m = 1 - \max_k \rho(J_k) \ge \delta$
- **Regime Entropy ($H$):** $H = -\sum D_i \log D_i$
- **Geometry Energy ($E_G$):** $E_G = \sum \|J_k\|_F^2 + \sum \|a_i\|^2$

### 5.2. World Tree Stability Theorem
Thông qua toán tử chiếu chặn Stability Margin khỏi triệt tiêu, và Mutation bound chặn Geometry Energy khỏi vô cực; Meta-Lyapunov biến World Tree thành một **Controlled Evolutionary Dynamical Manifold**.
- Tree không thể bùng nổ hình học cực đại (Geometry Explode).
- Tree không thể hội tụ chết về 1 nhánh duy nhất (Complete Attractor Convergence).

---

## 6. Invariant Measure, Bifurcation & Markov Chain

WorldOS lúc này đóng vai trò không chỉ như một logic mô phỏng, mà là một Dynamical System tiến hóa.

### 6.1. Invariant Measure trong Không Gian Tham Số
Không gian $\Theta$ compact (đóng và bị chặn). Toán tử phân nhánh $M(\Theta)$ liên tục. Theo định lý điểm bất động Brouwer, luôn tồn tại một điểm $\Theta^* = M(\Theta^*)$.
Hệ quả suy ra tồn tại **Invariant Measure**, nghĩa là sự phân bổ hình học xuyên suốt các thế giới con đều hội tụ về một phân phối ổn định toàn cuộc, không "khùng điên" vô tận.

### 6.2. Collapse dưới góc nhìn Bifurcation (Saddle-Node)
Độ co thực tế không nằm trên từng Jacobian mà nằm ở Jacobian hiệu dụng:
$ J_{\text{eff}} = \sum_k D_k J_k $
Collapse không phải do $x$ quá lớn, mà là một dạng **Saddle-Node Bifurcation** do chuyển đổi (switching). Khi $\rho(J_{\text{eff}}) \to 1$, attractor basin thu hẹp và triệt tiêu. *Snapshot* collapse là khoảnh khắc quỹ đạo rời khỏi vùng hố sập cũ bị suy giảm.

### 6.3. World Tree như Markov Chain
Nhìn nhận World Tree như mạng Markov trên Attractor Manifold: Các node chia thành nhóm {Stable, Innovation, Polarization, Trap, Edge}.
Cây phân nhánh trở thành chuỗi Markov hữu hạn trạng thái. Sự cân bằng trạng thái (Stationary Distribution $\pi$) định nghĩa tỷ lệ vĩ mô (Ex: 40% Stable, 25% Innovation, 15% Edge,...) của toàn thể các nền văn minh trong vũ trụ WorldOS.

---
*Tài liệu đúc kết luận cứ kiến trúc cốt lõi của WorldOS, dịch chuyển vị thế system từ một game engine thông thường sang một **Deterministic Evolution of Stable Dynamical Systems** cấp độ nghiên cứu.*
