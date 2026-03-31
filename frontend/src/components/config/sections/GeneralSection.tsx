"use client";

import { useState } from "react";
import { ToggleField, NumberField, SelectField } from "../fields";

interface Props { onDirty: () => void }

export default function GeneralSection({ onDirty }: Props) {
  const [name, setName] = useState("Alpha-001");
  const [seed, setSeed] = useState(42069);
  const [autoSave, setAutoSave] = useState(true);
  const [lang, setLang] = useState("vi");

  const mark = (fn: () => void) => { fn(); onDirty(); };

  return (
    <div className="section-grid">
      <div className="bento-card bento-wide">
        <div className="bento-header">
          <span className="bento-icon">🌌</span>
          <h2 className="bento-title">Định danh Vũ trụ</h2>
        </div>
        <div className="bento-fields">
          <div className="field-row">
            <div className="field-label-group">
              <label className="field-label">Tên Vũ trụ</label>
              <p className="field-desc">Tên định danh duy nhất cho vũ trụ này</p>
            </div>
            <input
              className="text-input"
              value={name}
              onChange={(e) => mark(() => setName(e.target.value))}
            />
          </div>
          <NumberField
            label="Random Seed"
            description="Seed ngẫu nhiên để tái tạo vũ trụ y hệt"
            value={seed}
            onChange={(v) => mark(() => setSeed(v))}
          />
        </div>
      </div>

      <div className="bento-card">
        <div className="bento-header">
          <span className="bento-icon">⚙️</span>
          <h2 className="bento-title">Hệ thống</h2>
        </div>
        <div className="bento-fields">
          <ToggleField
            label="Tự động lưu"
            description="Lưu cấu hình mỗi 5 phút"
            value={autoSave}
            onChange={(v) => mark(() => setAutoSave(v))}
          />
          <SelectField
            label="Ngôn ngữ"
            description="Ngôn ngữ giao diện"
            value={lang}
            options={[
              { value: "vi", label: "Tiếng Việt" },
              { value: "en", label: "English" },
            ]}
            onChange={(v) => mark(() => setLang(v))}
          />
        </div>
      </div>

      <div className="bento-card bento-stat">
        <div className="stat-label">Vũ trụ đang chạy</div>
        <div className="stat-value">1</div>
        <div className="stat-sub">của tối đa 5</div>
      </div>
    </div>
  );
}
