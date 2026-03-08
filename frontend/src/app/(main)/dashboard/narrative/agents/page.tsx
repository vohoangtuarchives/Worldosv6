"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function NarrativeAgentConfigPage() {
  const [agentName, setAgentName] = useState("The Chronicler");
  const [personality, setPersonality] = useState("Objective");
  const [creativity, setCreativity] = useState(50);
  const [themes, setThemes] = useState<string[]>(["History", "War"]);
  const [newTheme, setNewTheme] = useState("");
  const [modelType, setModelType] = useState("local");
  const [localEndpoint, setLocalEndpoint] = useState("http://localhost:11434/v1/chat/completions");
  const [modelName, setModelName] = useState("mistral");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAgentConfig()
      .then((config: any) => {
        if (config) {
          setAgentName(config.agent_name || "The Chronicler");
          setPersonality(config.personality || "Objective");
          setCreativity(config.creativity || 50);
          setThemes(config.themes || ["History", "War"]);
          setModelType(config.model_type || "local");
          setLocalEndpoint(config.local_endpoint || "http://localhost:11434/v1/chat/completions");
          setModelName(config.model_name || "mistral");
          setApiKey(config.api_key || "");
        }
      })
      .catch((err) => console.error("Failed to load config", err))
      .finally(() => setLoading(false));
  }, []);

  const handleAddTheme = () => {
    if (newTheme && !themes.includes(newTheme)) {
      setThemes([...themes, newTheme]);
      setNewTheme("");
    }
  };

  const handleRemoveTheme = (t: string) => {
    setThemes(themes.filter((theme) => theme !== t));
  };

  const handleSave = () => {
    setLoading(true);
    api.saveAgentConfig({
        agent_name: agentName,
        personality,
        creativity,
        themes,
        model_type: modelType,
        local_endpoint: localEndpoint,
        model_name: modelName,
        api_key: apiKey
    })
    .then(() => alert("Cấu hình AI Agent đã được lưu vào hệ thống"))
    .catch((err) => alert("Lỗi khi lưu cấu hình: " + err.message))
    .finally(() => setLoading(false));
  };

  if (loading) return <div className="p-8">Đang tải cấu hình...</div>;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex flex-col gap-1">
            <Link href="/dashboard/narrative" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
                ← Về Chronicles
            </Link>
            <h2 className="text-3xl font-bold tracking-tight text-gradient-cosmos">Cấu hình Narrative Agent</h2>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="text-lg font-semibold mb-4">Nhân dạng & Persona</div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tên Agent</label>
              <input
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Giọng Narrative</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
              >
                <option value="Objective">Objective (Sử gia)</option>
                <option value="Dramatic">Dramatic (Bard)</option>
                <option value="Mysterious">Mysterious (Oracle)</option>
                <option value="Dark">Grim (Dark Fantasy)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="text-lg font-semibold mb-4">Cấu hình Model</div>
          <div className="space-y-4">
             <div className="space-y-2">
              <label className="text-sm font-medium">Nhà cung cấp Model</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={modelType}
                onChange={(e) => setModelType(e.target.value)}
              >
                <option value="local">Local AI (Ollama/LM Studio)</option>
                <option value="openai">OpenAI (Cloud)</option>
                <option value="anthropic">Anthropic (Cloud)</option>
              </select>
            </div>

            {modelType === "local" && (
                <div className="space-y-2">
                    <label className="text-sm font-medium">Local Endpoint</label>
                    <input
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={localEndpoint}
                        onChange={(e) => setLocalEndpoint(e.target.value)}
                        placeholder="http://localhost:11434/v1/chat/completions"
                    />
                    <p className="text-[10px] text-muted-foreground">Tương thích chuẩn OpenAI-API (Ollama, LM Studio, ...)</p>
                </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Tên Model</label>
              <input
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder={modelType === 'local' ? 'mistral' : 'gpt-4-turbo'}
              />
            </div>
            
             <div className="space-y-2">
              <label className="text-sm font-medium">API Key {modelType === 'local' && '(Tùy chọn)'}</label>
              <input
                type="password"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="text-lg font-semibold mb-4">Tham số sinh nội dung</div>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Sáng tạo / Chaos</label>
                <span className="text-sm text-muted-foreground">{creativity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                value={creativity}
                onChange={(e) => setCreativity(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Giá trị cao hơn thêm nhiều sự kiện ngẫu nhiên và yếu tố huyền thoại.
              </p>
            </div>
            
            <div className="space-y-2">
                <label className="text-sm font-medium">Chủ đề trọng tâm</label>
                <div className="flex flex-wrap gap-2 mb-2">
                    {themes.map(theme => (
                        <span key={theme} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                            {theme}
                            <button onClick={() => handleRemoveTheme(theme)} className="ml-1 hover:text-destructive">×</button>
                        </span>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input 
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        placeholder="Thêm chủ đề..."
                        value={newTheme}
                        onChange={(e) => setNewTheme(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTheme()}
                    />
                    <button onClick={handleAddTheme} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
                        Thêm
                    </button>
                </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
            <div className="text-lg font-semibold mb-4">Xem trước & Trạng thái</div>
            <div className="p-4 rounded-lg bg-muted/50 border border-dashed border-border text-sm italic text-muted-foreground min-h-[150px]">
                "{agentName} đang quan sát universe với góc nhìn {personality.toLowerCase()}. Mức entropy hiện tại gợi ý xác suất phân kỳ {creativity > 70 ? 'cao' : 'vừa'}. Tập trung vào: {themes.join(', ')}."
            </div>
            <div className="mt-4 flex justify-end">
                <button onClick={handleSave} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-8 py-2">
                    Lưu cấu hình
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
