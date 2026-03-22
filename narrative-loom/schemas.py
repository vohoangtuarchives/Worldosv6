from pydantic import BaseModel, Field
from typing import List

class NarrativeBeat(BaseModel):
    title: str = Field(description="Tiêu đề gợi nhớ của nhịp truyện")
    causality: str = Field(description="Nguyên nhân và kết quả logic dẫn đến nhịp truyện này từ dữ liệu mô phỏng")
    impact_scale: str = Field(description="Tầm vóc: Vi mô, Vĩ mô, Xã hội, Tôn giáo, v.v.")

class HistoricalOutline(BaseModel):
    summary: str = Field(description="Tóm tắt bối cảnh tổng quan của Kỷ nguyên/Thời kỳ này")
    beats: List[NarrativeBeat] = Field(description="Danh sách 5-8 nhịp truyện chính (causality chain)")

class Scene(BaseModel):
    setting: str = Field(description="Bối cảnh, thời tiết, âm thanh nền (Không khí)")
    camera_angle: str = Field(description="Góc máy và nhịp điệu (VD: Cận cảnh đôi mắt, Toàn cảnh chiến trường)")
    central_conflict: str = Field(description="Mâu thuẫn và diễn biến hành động cốt lõi trong phân cảnh")
    involved_characters: List[str] = Field(description="Danh sách ID hoặc Tên nhân vật/phe phái tham gia")

class Storyboard(BaseModel):
    title: str = Field(description="Tên của phân đoạn hoặc chương truyện điện ảnh")
    scenes: List[Scene] = Field(description="Danh sách các phân cảnh chi tiết, nối tiếp nhau")

class CriticReview(BaseModel):
    score: int = Field(description="Điểm đánh giá chất lượng văn bản từ 1-10 (10 là kiệt tác)")
    feedbacks: List[str] = Field(description="Danh sách các điểm cần sửa chữa hoặc thêm thắt để tăng tính drama (Ghi rõ cần sửa đoạn nào)")
    is_passed: bool = Field(description="True nếu văn bản đã đủ tốt (score >= 7) và không cần sửa thêm, False nếu cần phải viết lại")
