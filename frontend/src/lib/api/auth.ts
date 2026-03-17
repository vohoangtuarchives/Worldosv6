/**
 * lib/api/auth.ts — Authentication endpoints
 */
import { apiFetch } from './fetch';

export const authApi = {
  async login(email: string, password: string) {
    return apiFetch("/login", { method: "POST", body: JSON.stringify({ email, password }) });
  },
  async logout() {
    return apiFetch("/logout", { method: "POST" });
  },
  async me() {
    return apiFetch("/user");
  },
};
