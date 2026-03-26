# Module Psychology - Phân tích Chuyên sâu

## 1. Vai trò (Scope)
Module `Psychology` cung cấp lớp "chủ quan" cho hệ thống. Nếu `Simulation` là thế giới khách quan, thì `Psychology` là cách thế giới đó được cảm nhận bởi các Actors. Nó chuyển đổi các sự kiện thô thành ý nghĩa (Meaning).

## 2. Meaning Engine (Động cơ Ý nghĩa)
`MeaningEngine.php` xử lý theo quy trình 3 lớp (Pipeline):
1. **Lớp Ý nghĩa Cơ bản (Base Meaning)**: Tra cứu từ DSL để xem một sự kiện (ví dụ: `threat_encountered`) có tính chất gì mặc định.
2. **Lớp Định kiến (Bias Layer)**: Áp dụng cá tính (Big Five) và các sang chấn tâm lý (Trauma) từ quá khứ (Freudian hidden bias). Người có tính bất ổn (Neuroticism) cao sẽ nhìn nhận sự kiện tiêu cực hơn.
3. **Lớp Ngữ cảnh (Context Layer)**: Xem xét mối quan hệ xã hội (Liking/Trust) và bộ nhớ gần đây (Confirmation Bias).

## 3. Expression Engine (Động cơ Biểu thức)
Một thành phần kỹ thuật quan trọng là `ExpressionEngine.php`. Nó cho phép đánh giá các biểu thức toán học trong DSL (ví dụ: `fear * 0.6 + stress * 0.3`) một cách an toàn mà không cần dùng hàm `eval()`. Nó sử dụng Whitelist các biến được phép và một bộ lọc token tối giản.

## 4. Các Đối tượng Giá trị (Value Objects)
Để đảm bảo tính bất biến (Immutability) và sạch sẽ trong logic:
- **Meaning**: Chứa `valence` (tích cực/tiêu cực), `intensity` (độ mạnh) và `certainty` (độ tin cậy).
- **TraitVector**: Đại diện cho 5 đặc tính cá tính (Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism).
- **PsychologicalState**: Trạng thái cảm xúc tức thời (Fear, Anger, Joy, Stress).

## 5. Ứng dụng
Kết quả của module này là đầu vào của `Intelligence` module, giúp các Actors không chỉ hành động theo bản năng mà còn theo "cảm xúc" và "trải nghiệm cá nhân".
