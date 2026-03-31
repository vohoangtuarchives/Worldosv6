"use client";

import { useState } from "react";
import { SliderField } from "../fields";

interface Props { onDirty: () => void }

const TRAITS = [
  { key: "dominance", label: "Dominance", desc: "Xu hướng thống trị và kiểm soát" },
  { key: "fear", label: "Fear", desc: "Ngưỡng sợ hãi phản xạ" },
  { key: "sociability", label: "Sociability", desc: "Xu hướng hợp tác xã hội" },
  { key: "curiosity", label: "Curiosity", desc: "Ham muốn khám phá" },
  { key: "stability", label: "Stability", desc: "Ổn định cảm xúc" },
  { key: "empathy", label: "Empathy", desc: "Khả năng đồng cảm" },
  { key: "creativity", label: "Creativity", desc: "Sáng tạo và đột biến hành vi" },
];

export default function PsychologySection({ onDirty }: Props) {
  const [weights, setWeights] = useState<Record<string, number>>(
    Object.fromEntries(TRAITS.map((t) => [t.key, 50]))
  );
  const [traumaThreshold, setTraumaThreshold] = useState(70);

  const mark = (fn: () => void) => { fn(); onDirty(); };

  return (
    <div className="section-grid">
      <div className="bento-card bento-full">
        <div className="bento-header">
          <span className="bento-icon">🧠</span>
          <h2 className="bento-title">Trọng số 17D Traits (7 cơ bản)</h2>
          <span className="bento-badge">Ảnh hưởng toàn Actor</span>
        </div>
        <div className="bento-fields">
          {TRAITS.map((t) => (
            <SliderField
              key={t.key}
              label={t.label}
              description={t.desc}
              value={weights[t.key]}
              min={0} max={100} unit="%"
              onChange={(v) => mark(() => setWeights((prev) => ({ ...prev, [t.key]: v })))}
            />
          ))}
          <SliderField
            label="Ngưỡng Trauma"
            description="Điểm áp lực tâm lý gây ra hành vi đột biến"
            value={traumaThreshold} min={0} max={100} unit=" pts"
            onChange={(v) => mark(() => setTraumaThreshold(v))}
          />
        </div>
      </div>
    </div>
  );
}
