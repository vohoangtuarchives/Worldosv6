"use client";

import { useState } from "react";

interface Props { onDirty: () => void }

export default function ApiSection({ onDirty }: Props) {
  const [grpcUrl, setGrpcUrl] = useState("localhost:50051");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  const mark = (fn: () => void) => { fn(); onDirty(); };

  return (
    <div className="section-grid">
      <div className="bento-card bento-full">
        <div className="bento-header">
          <span className="bento-icon">🔌</span>
          <h2 className="bento-title">API & Tích hợp</h2>
        </div>
        <div className="bento-fields">
          <div className="field-row">
            <div className="field-label-group">
              <label className="field-label">gRPC Endpoint</label>
              <p className="field-desc">Địa chỉ Rust Engine gRPC server</p>
            </div>
            <input className="text-input mono" value={grpcUrl} onChange={(e) => mark(() => setGrpcUrl(e.target.value))} />
          </div>
          <div className="field-row">
            <div className="field-label-group">
              <label className="field-label">API Key</label>
              <p className="field-desc">Khóa xác thực nội bộ (Laravel → Rust)</p>
            </div>
            <div className="secret-group">
              <input
                className="text-input mono"
                type={showKey ? "text" : "password"}
                value={apiKey}
                placeholder="sk-worldos-..."
                onChange={(e) => mark(() => setApiKey(e.target.value))}
              />
              <button className="show-btn" onClick={() => setShowKey(!showKey)}>
                {showKey ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
          <div className="field-row">
            <div className="field-label-group">
              <label className="field-label">Trạng thái kết nối</label>
              <p className="field-desc">Kiểm tra kết nối tới Rust Engine</p>
            </div>
            <button className="test-btn">🔗 Kiểm tra kết nối</button>
          </div>
        </div>
      </div>
    </div>
  );
}
