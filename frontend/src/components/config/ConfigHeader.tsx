"use client";

import { ConfigSection } from "@/app/config/page";

const SECTION_LABELS: Record<ConfigSection, string> = {
  general:    "Cài đặt Tổng quát",
  physics:    "Vật lý Thế giới",
  simulation: "Tham số Mô phỏng",
  psychology: "Hệ thống Tâm lý học 17D",
  events:     "Sự kiện & Entropy",
  display:    "Hiển thị & Logs",
  api:        "API & Tích hợp",
  keypool:    "AI Key Pool",
};

interface Props {
  section: ConfigSection;
  isDirty: boolean;
  onSave: () => void;
}

export default function ConfigHeader({ section, isDirty, onSave }: Props) {
  return (
    <header className="config-header">
      <div className="header-left">
        <h1 className="header-title">{SECTION_LABELS[section]}</h1>
        {isDirty && <span className="dirty-badge">● Chưa lưu</span>}
      </div>
      <div className="header-right">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input className="search-input" placeholder="Tìm tham số..." />
        </div>
        <button
          className={`save-btn${isDirty ? " active" : ""}`}
          onClick={onSave}
          disabled={!isDirty}
        >
          💾 Lưu cấu hình
        </button>
      </div>
    </header>
  );
}
