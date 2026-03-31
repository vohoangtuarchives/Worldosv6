"use client";

import { useState } from "react";
import { SliderField, ToggleField, SelectField } from "../fields";

interface Props { onDirty: () => void }

export default function DisplaySection({ onDirty }: Props) {
  const [refreshRate, setRefreshRate] = useState(2);
  const [logLevel, setLogLevel] = useState("info");
  const [showGrid, setShowGrid] = useState(true);
  const [showChronicles, setShowChronicles] = useState(true);

  const mark = (fn: () => void) => { fn(); onDirty(); };

  return (
    <div className="section-grid">
      <div className="bento-card bento-full">
        <div className="bento-header">
          <span className="bento-icon">📊</span>
          <h2 className="bento-title">Hiển thị & Logs</h2>
        </div>
        <div className="bento-fields">
          <SliderField label="Chart Refresh Rate" description="Tần suất cập nhật biểu đồ (giây)" value={refreshRate} min={1} max={30} unit="s" onChange={(v) => mark(() => setRefreshRate(v))} />
          <SelectField label="Log Level" description="Mức độ chi tiết của log hệ thống" value={logLevel}
            options={[
              { value: "error", label: "Error — chỉ lỗi nghiêm trọng" },
              { value: "warn",  label: "Warning — cảnh báo + lỗi" },
              { value: "info",  label: "Info — thông tin chung" },
              { value: "debug", label: "Debug — đầy đủ (chậm)" },
            ]}
            onChange={(v) => mark(() => setLogLevel(v))}
          />
          <ToggleField label="Hiện Grid Map" description="Hiển thị lưới bản đồ Zone trên dashboard" value={showGrid} onChange={(v) => mark(() => setShowGrid(v))} />
          <ToggleField label="Hiện Chronicles" description="Hiện dòng sử thi được AI biên soạn" value={showChronicles} onChange={(v) => mark(() => setShowChronicles(v))} />
        </div>
      </div>
    </div>
  );
}
