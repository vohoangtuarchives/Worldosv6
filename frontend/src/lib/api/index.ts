/**
 * lib/api/index.ts
 * Top-level re-export — backward compatible với code cũ dùng `import { api } from '@/lib/api'`
 * Tất cả domain modules được re-export để dễ import riêng lẻ nếu cần.
 */

// Domain-specific exports cho patterns mới
export { authApi } from './auth';
export { universeApi } from './universe';
export { simulationApi } from './simulation';
export { actorsApi } from './actors';
export { ecologyApi } from './ecology';
export { narrativeApi } from './narrative';
export { auditApi } from './audit';
export { apiFetch, publicFetch, getToken, buildStreamUrl } from './fetch';

// Backward-compat: `api` object vẫn work như cũ
// ip-factory và các sub-namespaces được giữ nguyên để đảm bảo không break
export { api } from './legacy';
