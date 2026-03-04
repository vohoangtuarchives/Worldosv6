"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    api
      .login(email, password)
      .then((res: { access_token: string }) => {
        const token = res.access_token;
        document.cookie = `auth_token=${encodeURIComponent(token)}; path=/`;
        const params = new URLSearchParams(window.location.search);
        const to = params.get("redirect") || "/dashboard/cosmologic";
        router.push(to);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Đăng nhập thất bại";
        setError(msg);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden">
       <div className="pointer-events-none absolute inset-0 bg-starfield opacity-35 bg-starfield-drift-slow" />
       <div className="pointer-events-none absolute -inset-10 bg-starfield opacity-25 bg-starfield-drift-fast" />
       
      <div className="z-10 w-full max-w-md space-y-8 rounded-2xl border border-border bg-card/50 p-10 backdrop-blur-xl">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-[var(--radius)] bg-[linear-gradient(135deg,hsl(var(--left-brain)),hsl(var(--cosmos)),hsl(var(--right-brain)))] glow-cosmos mb-4" />
          <h2 className="text-3xl font-bold tracking-tight text-gradient-cosmos">
            WorldOS Access
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Xác thực danh tính để truy cập hệ thống quản trị đa vũ trụ.
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && <div className="text-sm text-destructive">{error}</div>}
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full rounded-md border-0 bg-muted/50 py-3 text-foreground shadow-sm ring-1 ring-inset ring-border placeholder:text-muted-foreground focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 px-4"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full rounded-md border-0 bg-muted/50 py-3 text-foreground shadow-sm ring-1 ring-inset ring-border placeholder:text-muted-foreground focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 px-4"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-[var(--radius)] bg-primary px-3 py-3 text-sm font-semibold text-primary-foreground hover:bg-[hsl(var(--left-brain-glow))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-70 transition-all glow-left-brain"
            >
              {loading ? "Đang xác thực..." : "Truy cập System"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
