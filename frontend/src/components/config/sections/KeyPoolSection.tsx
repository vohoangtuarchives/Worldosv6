'use client';

import React, { useState } from 'react';
import { useAiKeys, useAiKeysMutation } from '@/modules/observer/api';
import {
  Key, Plus, Trash2, Clock, Database, Lock,
  X, ShieldCheck, Zap, Globe,
} from 'lucide-react';

interface Props { onDirty: () => void }

export default function KeyPoolSection({ onDirty: _onDirty }: Props) {
  const { data: keys, isLoading } = useAiKeys();
  const { storeMutation, deleteMutation } = useAiKeysMutation();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newKey, setNewKey] = useState({ provider: 'openai', api_key: '', label: '', is_free: true });

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await storeMutation.mutateAsync(newKey);
      setIsAddModalOpen(false);
      setNewKey({ provider: 'openai', api_key: '', label: '', is_free: true });
    } catch (err) {
      console.error('Failed to add key:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="keypool-loading">
        <div className="keypool-loading-text">Đang kết nối kho bảo mật...</div>
      </div>
    );
  }

  return (
    <div className="keypool-wrap">
      {/* Metrics */}
      <div className="keypool-metrics">
        {[
          { label: 'Tổng số Key',        value: keys?.length || 0,                                      Icon: Database,    color: 'kp-blue'   },
          { label: 'Đang hoạt động',     value: keys?.filter(k => k.status === 'active').length || 0,   Icon: ShieldCheck, color: 'kp-green'  },
          { label: 'Cooldown',           value: keys?.filter(k => k.status === 'cooldown').length || 0, Icon: Clock,       color: 'kp-amber'  },
          { label: 'Free Tier',          value: keys?.filter(k => k.is_free).length || 0,               Icon: Zap,         color: 'kp-sky'    },
        ].map((stat, i) => (
          <div key={i} className="kp-stat-card">
            <div className="kp-stat-top">
              <stat.Icon className={`kp-stat-icon ${stat.color}`} size={15} />
              <span className="kp-stat-label">{stat.label}</span>
            </div>
            <div className="kp-stat-val">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="bento-card bento-full" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="kp-table-header">
          <div className="kp-table-title-group">
            <div className="kp-table-icon-wrap"><Key size={18} /></div>
            <div>
              <h2 className="bento-title" style={{ margin: 0 }}>Danh sách Key AI</h2>
              <p className="field-desc" style={{ margin: '3px 0 0' }}>Quản trị tài nguyên &amp; Điều tiết xoay vòng</p>
            </div>
          </div>
          <button className="kp-add-btn" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={14} />
            Đăng ký Key mới
          </button>
        </div>

        <div className="kp-table-scroll">
          <table className="kp-table">
            <thead>
              <tr>
                <th>Trạng thái</th>
                <th>Provider / Nhãn</th>
                <th>Signature</th>
                <th>Lưu lượng</th>
                <th style={{ textAlign: 'right' }}>Lệnh</th>
              </tr>
            </thead>
            <tbody>
              {keys?.map((key) => (
                <tr key={key.id} className="kp-row">
                  <td>
                    <div className="kp-status-cell">
                      <div className={`kp-dot ${
                        key.status === 'active'   ? 'kp-dot-green' :
                        key.status === 'cooldown' ? 'kp-dot-amber' : 'kp-dot-muted'
                      }`} />
                      <span className={`kp-status-text ${
                        key.status === 'active'   ? 'kp-green' :
                        key.status === 'cooldown' ? 'kp-amber' : 'kp-muted'
                      }`}>{key.status}</span>
                    </div>
                  </td>
                  <td>
                    <div className="kp-provider-cell">
                      <div className="kp-provider-icon"><Globe size={13} /></div>
                      <div>
                        <div className="kp-provider-name">{key.provider}</div>
                        <div className="kp-key-label">
                          {key.label || 'Chưa đặt tên'}
                          {key.is_free && <span className="kp-free-badge">Free</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td><code className="kp-code">{key.key_preview}</code></td>
                  <td>
                    <span className="kp-usage">{key.usage_count}</span>
                    <span className="kp-usage-unit"> req</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="kp-delete-btn" onClick={() => deleteMutation.mutate(key.id)}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {keys?.length === 0 && (
            <div className="kp-empty">
              <Lock size={36} className="kp-empty-icon" />
              <p className="kp-empty-text">Không tìm thấy mã định danh nào được đăng ký</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Key Modal */}
      {isAddModalOpen && (
        <div className="kp-modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="kp-modal" onClick={e => e.stopPropagation()}>
            <div className="kp-modal-header">
              <div className="kp-modal-title-group">
                <div className="kp-modal-icon"><Plus size={15} /></div>
                <h3 className="kp-modal-title">Đăng ký tài nguyên AI</h3>
              </div>
              <button className="kp-modal-close" onClick={() => setIsAddModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddKey} className="kp-modal-form">
              <div className="kp-field-group">
                <label className="kp-field-label">Nhà cung cấp (Service)</label>
                <select className="kp-select" value={newKey.provider} onChange={e => setNewKey({ ...newKey, provider: e.target.value })}>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="google">Google</option>
                  <option value="openrouter">OpenRouter</option>
                  <option value="local">Local (Ollama / LM Studio)</option>
                </select>
              </div>

              <div className="kp-field-group">
                <label className="kp-field-label">Nhãn định danh</label>
                <input className="kp-input" type="text" placeholder="VD: Account Chính - Free Tier"
                  value={newKey.label} onChange={e => setNewKey({ ...newKey, label: e.target.value })} />
              </div>

              <div className="kp-field-group">
                <label className="kp-field-label">Mã API Signature</label>
                <div className="kp-secret-wrap">
                  <Lock size={14} className="kp-secret-icon" />
                  <input className="kp-input kp-input-pl" type="password" placeholder="sk-..." required
                    value={newKey.api_key} onChange={e => setNewKey({ ...newKey, api_key: e.target.value })} />
                </div>
              </div>

              <label className="kp-checkbox-row">
                <input type="checkbox" className="kp-checkbox" checked={newKey.is_free}
                  onChange={e => setNewKey({ ...newKey, is_free: e.target.checked })} />
                <span className="field-label">Ưu tiên sử dụng như tài nguyên miễn phí</span>
              </label>

              <div className="kp-modal-actions">
                <button type="button" className="kp-cancel-btn" onClick={() => setIsAddModalOpen(false)}>Hủy bỏ</button>
                <button type="submit" className="kp-submit-btn" disabled={storeMutation.isPending}>
                  {storeMutation.isPending ? 'Đang mã hóa...' : 'Xác nhận đăng ký'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
