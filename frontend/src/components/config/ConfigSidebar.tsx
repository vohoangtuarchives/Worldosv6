"use client";

import { ConfigSection } from "@/app/config/page";

const NAV_ITEMS: { id: ConfigSection; label: string; icon: string; desc: string }[] = [
  { id: "general",    label: "Tổng quát",        icon: "⚙️",  desc: "Seed, tên vũ trụ" },
  { id: "physics",    label: "Vật lý Thế giới",  icon: "🌍",  desc: "Địa lý, tài nguyên" },
  { id: "simulation", label: "Mô phỏng",          icon: "▶️",  desc: "Tick rate, tốc độ" },
  { id: "psychology", label: "Tâm lý học",        icon: "🧠",  desc: "17D traits, trauma" },
  { id: "events",     label: "Sự kiện & Entropy", icon: "⚡",  desc: "Thiên tai, sụp đổ" },
  { id: "display",    label: "Hiển thị",           icon: "📊",  desc: "Charts, logs" },
  { id: "api",        label: "API & Tích hợp",     icon: "🔌",  desc: "gRPC, API keys" },
  { id: "keypool",    label: "AI Key Pool",         icon: "🗝️",  desc: "Quản lý key AI" },
];

interface Props {
  active: ConfigSection;
  onSelect: (s: ConfigSection) => void;
}

export default function ConfigSidebar({ active, onSelect }: Props) {
  return (
    <aside className="config-sidebar">
      <div className="sidebar-brand">
        <span className="brand-icon">🌌</span>
        <div>
          <div className="brand-title">WorldOS V6</div>
          <div className="brand-sub">Cấu hình Vũ trụ</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`sidebar-item${active === item.id ? " active" : ""}`}
            onClick={() => onSelect(item.id)}
          >
            <span className="item-icon">{item.icon}</span>
            <div className="item-text">
              <span className="item-label">{item.label}</span>
              <span className="item-desc">{item.desc}</span>
            </div>
            {active === item.id && <span className="item-indicator" />}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <span className="footer-badge">v6.0.0-alpha</span>
      </div>
    </aside>
  );
}
