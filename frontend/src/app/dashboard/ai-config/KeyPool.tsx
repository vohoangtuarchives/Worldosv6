'use client';

import React, { useState } from 'react';
import { useAiKeys, useAiKeysMutation } from '../../../modules/observer/api';
import {
  Key,
  Plus,
  Trash2,
  Clock,
  Database,
  Lock,
  X,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';

export const KeyPool: React.FC = () => {
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
      <div className="flex items-center justify-center h-64 border border-slate-100 rounded-2xl bg-slate-50 animate-pulse">
        <div className="text-slate-400 font-heading font-black uppercase tracking-widest text-[10px]">Đang kết nối kho bảo mật...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng số Key', value: keys?.length || 0, icon: Database, color: 'text-primary' },
          { label: 'Đang hoạt động', value: keys?.filter(k => k.status === 'active').length || 0, icon: ShieldCheck, color: 'text-emerald-500' },
          { label: 'Đang nghỉ (Cooldown)', value: keys?.filter(k => k.status === 'cooldown').length || 0, icon: Clock, color: 'text-amber-500' },
          { label: 'Free Tier', value: keys?.filter(k => k.is_free).length || 0, icon: Zap, color: 'text-sky-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-[10px] font-heading font-black uppercase tracking-wider text-slate-400">{stat.label}</span>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm">
              <Key className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Danh sách Key AI</h3>
              <p className="text-[10px] text-slate-500 font-heading font-black uppercase tracking-wider mt-0.5">Quản trị tài nguyên & Điều tiết xoay vòng</p>
            </div>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-3 px-6 py-3 bg-primary text-white rounded-xl font-heading font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 hover:translate-y-[-2px] active:translate-y-0 transition-all"
          >
            <Plus className="w-4 h-4" />
            Đăng ký Key mới
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-heading font-black uppercase tracking-widest text-slate-400">Trạng thái</th>
                <th className="px-6 py-4 text-[10px] font-heading font-black uppercase tracking-widest text-slate-400">Provider / Nhãn</th>
                <th className="px-6 py-4 text-[10px] font-heading font-black uppercase tracking-widest text-slate-400">Signature</th>
                <th className="px-6 py-4 text-[10px] font-heading font-black uppercase tracking-widest text-slate-400">Lưu lượng</th>
                <th className="px-6 py-4 text-[10px] font-heading font-black uppercase tracking-widest text-slate-400 text-right">Lệnh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {keys?.map((key) => (
                <tr key={key.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        key.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' :
                        key.status === 'cooldown' ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'
                      }`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${
                        key.status === 'active' ? 'text-emerald-600' :
                        key.status === 'cooldown' ? 'text-amber-600' : 'text-slate-400'
                      }`}>{key.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-white transition-colors">
                        <Globe className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-tighter text-slate-400">{key.provider}</div>
                        <div className="text-sm font-bold text-slate-700 leading-tight flex items-center gap-2">
                          {key.label || 'Chưa đặt tên'}
                          {key.is_free && (
                            <span className="px-1.5 py-0.5 bg-sky-50 text-sky-600 border border-sky-100 rounded text-[8px] font-black uppercase tracking-tighter">Free</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">{key.key_preview}</code>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-700">{key.usage_count}</span>
                      <span className="text-[9px] font-heading font-black uppercase tracking-tighter text-slate-300">Requests</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => deleteMutation.mutate(key.id)}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {keys?.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center">
              <Lock className="w-12 h-12 text-slate-100 mb-4" />
              <p className="text-[10px] font-heading font-black uppercase tracking-widest text-slate-300">Không tìm thấy mã định danh nào được đăng ký</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Key Modal Overlay */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-xl border border-slate-200">
                  <Plus className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Đăng ký tài nguyên AI</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddKey} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-heading font-black uppercase tracking-widest text-slate-400 ml-1">Nhà cung cấp (Service)</label>
                <select
                  value={newKey.provider}
                  onChange={(e) => setNewKey({ ...newKey, provider: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm font-bold text-slate-700 focus:border-primary transition-all outline-none"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="google">Google</option>
                  <option value="openrouter">OpenRouter</option>
                  <option value="local">Local (Ollama/LM Studio)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-heading font-black uppercase tracking-widest text-slate-400 ml-1">Nhãn định danh</label>
                <input
                  type="text"
                  placeholder="VD: Account Chính - Free Tier"
                  value={newKey.label}
                  onChange={(e) => setNewKey({ ...newKey, label: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm font-bold text-slate-700 focus:border-primary transition-all outline-none placeholder:text-slate-300"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-heading font-black uppercase tracking-widest text-slate-400 ml-1">Mã API Signature</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input
                    type="password"
                    placeholder="sk-..."
                    required
                    value={newKey.api_key}
                    onChange={(e) => setNewKey({ ...newKey, api_key: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-sm font-bold text-emerald-600 focus:border-primary transition-all outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative flex items-center h-5">
                  <input
                    type="checkbox"
                    id="is_free"
                    checked={newKey.is_free}
                    onChange={(e) => setNewKey({ ...newKey, is_free: e.target.checked })}
                    className="w-5 h-5 rounded-lg border-slate-200 bg-slate-50 text-emerald-500 focus:ring-emerald-500/20 transition-all cursor-pointer"
                  />
                </div>
                <label htmlFor="is_free" className="text-xs font-bold text-slate-500 cursor-pointer">Ưu tiên sử dụng như tài nguyên miễn phí</label>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-heading font-black uppercase tracking-widest text-[10px] transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={storeMutation.isPending}
                  className="flex-1 px-6 py-3.5 bg-primary text-white rounded-xl font-heading font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 hover:translate-y-[-2px] active:translate-y-0 transition-all disabled:opacity-50"
                >
                  {storeMutation.isPending ? 'Đang mã hóa...' : 'Xác nhận đăng ký'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
