/**
 * Observer Module — AI Key Pool API
 * Stub hooks — kết nối với backend Laravel khi endpoint sẵn sàng
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface AiKey {
  id: number;
  provider: string;
  label: string;
  key_preview: string;
  status: 'active' | 'cooldown' | 'disabled';
  is_free: boolean;
  usage_count: number;
}

export interface StoreAiKeyPayload {
  provider: string;
  api_key: string;
  label: string;
  is_free: boolean;
}

// ─── Stub data (thay bằng fetch thật khi backend sẵn sàng) ──────────────────
const MOCK_KEYS: AiKey[] = [
  { id: 1, provider: 'openai',    label: 'Tài khoản chính',  key_preview: 'sk-...a8Bx', status: 'active',   is_free: false, usage_count: 1342 },
  { id: 2, provider: 'anthropic', label: 'Dự phòng Claude',  key_preview: 'sk-...c3Qr', status: 'cooldown', is_free: true,  usage_count: 87 },
  { id: 3, provider: 'google',    label: 'Gemini Free Tier', key_preview: 'AIza...7kPm', status: 'active',  is_free: true,  usage_count: 230 },
];

async function fetchKeys(): Promise<AiKey[]> {
  // TODO: return fetch('/api/observer/ai-keys').then(r => r.json());
  return new Promise(res => setTimeout(() => res([...MOCK_KEYS]), 400));
}

async function storeKey(payload: StoreAiKeyPayload): Promise<AiKey> {
  // TODO: return fetch('/api/observer/ai-keys', { method: 'POST', body: JSON.stringify(payload) }).then(r => r.json());
  return new Promise(res =>
    setTimeout(() => res({
      id: Date.now(),
      provider: payload.provider,
      label: payload.label,
      key_preview: payload.api_key.slice(0, 4) + '...' + payload.api_key.slice(-4),
      status: 'active',
      is_free: payload.is_free,
      usage_count: 0,
    }), 600)
  );
}

async function deleteKey(_id: number): Promise<void> {
  // TODO: return fetch(`/api/observer/ai-keys/${_id}`, { method: 'DELETE' });
  return new Promise(res => setTimeout(res, 300));
}

// ─── Hooks ───────────────────────────────────────────────────────────────────
const QUERY_KEY = ['observer', 'ai-keys'] as const;

export function useAiKeys() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: fetchKeys });
}

export function useAiKeysMutation() {
  const qc = useQueryClient();

  const storeMutation = useMutation({
    mutationFn: storeKey,
    onSuccess: (newKey) => {
      qc.setQueryData<AiKey[]>(QUERY_KEY, (old = []) => [...old, newKey]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteKey,
    onSuccess: (_, variables) => {
      qc.setQueryData<AiKey[]>(QUERY_KEY, (old = []) => old.filter(k => k.id !== variables));
    },
  });

  return { storeMutation, deleteMutation };
}
