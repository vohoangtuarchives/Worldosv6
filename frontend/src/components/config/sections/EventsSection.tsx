"use client";

import { useState } from "react";
import { SliderField, ToggleField } from "../fields";

interface Props { onDirty: () => void }

export default function EventsSection({ onDirty }: Props) {
  const [disasterProb, setDisasterProb] = useState(15);
  const [collapseThreshold, setCollapseThreshold] = useState(80);
  const [warThreshold, setWarThreshold] = useState(60);
  const [enablePandemic, setEnablePandemic] = useState(true);
  const [enableFamine, setEnableFamine] = useState(true);
  const [enableRevolution, setEnableRevolution] = useState(true);

  const mark = (fn: () => void) => { fn(); onDirty(); };

  return (
    <div className="section-grid">
      <div className="bento-card bento-wide">
        <div className="bento-header">
          <span className="bento-icon">📊</span>
          <h2 className="bento-title">Xác suất & Ngưỡng</h2>
        </div>
        <div className="bento-fields">
          <SliderField label="Xác suất Thiên tai/tick" description="Khả năng xảy ra thiên tai mỗi tick" value={disasterProb} min={0} max={100} unit="%" onChange={(v) => mark(() => setDisasterProb(v))} />
          <SliderField label="Ngưỡng Sụp đổ Entropy" description="Điểm entropy kích hoạt sự sụp đổ văn minh" value={collapseThreshold} min={0} max={100} unit=" pts" onChange={(v) => mark(() => setCollapseThreshold(v))} />
          <SliderField label="Ngưỡng chiến tranh" description="Điểm áp lực xã hội kích hoạt xung đột vũ trang" value={warThreshold} min={0} max={100} unit=" pts" onChange={(v) => mark(() => setWarThreshold(v))} />
        </div>
      </div>
      <div className="bento-card">
        <div className="bento-header">
          <span className="bento-icon">⚡</span>
          <h2 className="bento-title">Bật/Tắt Sự kiện</h2>
        </div>
        <div className="bento-fields">
          <ToggleField label="Đại dịch" description="Cho phép sự kiện lây lan bệnh" value={enablePandemic} onChange={(v) => mark(() => setEnablePandemic(v))} />
          <ToggleField label="Nạn đói" description="Cho phép sự kiện thiếu lương thực" value={enableFamine} onChange={(v) => mark(() => setEnableFamine(v))} />
          <ToggleField label="Cách mạng" description="Cho phép lật đổ thể chế chính trị" value={enableRevolution} onChange={(v) => mark(() => setEnableRevolution(v))} />
        </div>
      </div>
    </div>
  );
}
