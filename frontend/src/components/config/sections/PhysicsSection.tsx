"use client";

import { useState } from "react";
import { SliderField, NumberField } from "../fields";

interface Props { onDirty: () => void }

export default function PhysicsSection({ onDirty }: Props) {
  const [resourceDensity, setResourceDensity] = useState(50);
  const [climateVolatility, setClimateVolatility] = useState(30);
  const [landRatio, setLandRatio] = useState(40);
  const [initPop, setInitPop] = useState(200);

  const mark = (fn: () => void) => { fn(); onDirty(); };

  return (
    <div className="section-grid">
      <div className="bento-card bento-full">
        <div className="bento-header">
          <span className="bento-icon">🌍</span>
          <h2 className="bento-title">Vật lý & Địa lý</h2>
        </div>
        <div className="bento-fields">
          <SliderField label="Mật độ Tài nguyên" description="Lượng tài nguyên ban đầu phân bổ trên map" value={resourceDensity} min={0} max={100} unit="%" onChange={(v) => mark(() => setResourceDensity(v))} />
          <SliderField label="Biến động Khí hậu" description="Mức độ thay đổi khí hậu ngẫu nhiên theo thời gian" value={climateVolatility} min={0} max={100} unit="%" onChange={(v) => mark(() => setClimateVolatility(v))} />
          <SliderField label="Tỷ lệ Đất/Biển" description="Phần trăm diện tích là đất liền" value={landRatio} min={10} max={90} unit="% đất" onChange={(v) => mark(() => setLandRatio(v))} />
          <NumberField label="Dân số khởi đầu" description="Số Actor sinh ra ở tick đầu tiên" value={initPop} min={10} max={10000} unit="actors" onChange={(v) => mark(() => setInitPop(v))} />
        </div>
      </div>
    </div>
  );
}
