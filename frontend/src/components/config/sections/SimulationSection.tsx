"use client";

import { useState } from "react";
import { SliderField, ToggleField, NumberField } from "../fields";

interface Props { onDirty: () => void }

export default function SimulationSection({ onDirty }: Props) {
  const [tickRate, setTickRate] = useState(20);
  const [speed, setSpeed] = useState(1.0);
  const [maxActors, setMaxActors] = useState(5000);
  const [parallelWorkers, setParallelWorkers] = useState(4);
  const [pauseOnEvent, setPauseOnEvent] = useState(false);
  const [logVerbose, setLogVerbose] = useState(false);

  const mark = (fn: () => void) => { fn(); onDirty(); };

  return (
    <div className="section-grid">
      <div className="bento-card bento-wide">
        <div className="bento-header">
          <span className="bento-icon">⚡</span>
          <h2 className="bento-title">Hiệu năng Engine</h2>
        </div>
        <div className="bento-fields">
          <SliderField
            label="Tick Rate"
            description="Số tick mô phỏng mỗi giây (TPS)"
            value={tickRate} min={1} max={120} step={1} unit=" TPS"
            onChange={(v) => mark(() => setTickRate(v))}
          />
          <SliderField
            label="Tốc độ Mô phỏng"
            description="Bội số tốc độ so với thời gian thực"
            value={speed} min={0.1} max={10} step={0.1} unit="x"
            onChange={(v) => mark(() => setSpeed(v))}
          />
          <NumberField
            label="Số Actor tối đa"
            description="Giới hạn Actor đồng thời trong Engine Rust"
            value={maxActors} min={100} max={100000} unit="actors"
            onChange={(v) => mark(() => setMaxActors(v))}
          />
          <NumberField
            label="Parallel Workers"
            description="Số luồng Rust xử lý song song (khuyến nghị: CPU cores)"
            value={parallelWorkers} min={1} max={32} unit="threads"
            onChange={(v) => mark(() => setParallelWorkers(v))}
          />
        </div>
      </div>

      <div className="bento-card">
        <div className="bento-header">
          <span className="bento-icon">🎛️</span>
          <h2 className="bento-title">Điều khiển</h2>
        </div>
        <div className="bento-fields">
          <ToggleField
            label="Tạm dừng khi sự kiện lớn"
            description="Dừng mô phỏng khi có sự kiện nghiêm trọng"
            value={pauseOnEvent}
            onChange={(v) => mark(() => setPauseOnEvent(v))}
          />
          <ToggleField
            label="Log chi tiết"
            description="Ghi log đầy đủ (ảnh hưởng hiệu năng)"
            value={logVerbose}
            onChange={(v) => mark(() => setLogVerbose(v))}
          />
        </div>
      </div>

      <div className="bento-card bento-stat">
        <div className="stat-label">Tick hiện tại</div>
        <div className="stat-value">48,291</div>
        <div className="stat-sub">~{Math.round(48291 / tickRate / 3600)}h mô phỏng</div>
      </div>
    </div>
  );
}
