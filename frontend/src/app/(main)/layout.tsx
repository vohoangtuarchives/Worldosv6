"use client";

import Link from "next/link";
import UniverseSelector from "@/components/UniverseSelector";
import { useRouter } from "next/navigation";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const logout = () => {
    document.cookie = "auth_token=; Max-Age=0; path=/";
    router.push("/login");
  };
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center gap-6">
          <Link className="flex items-center space-x-2 shrink-0" href="/dashboard">
            <div className="h-6 w-6 rounded-[var(--radius)] bg-[linear-gradient(135deg,hsl(var(--left-brain)),hsl(var(--cosmos)),hsl(var(--right-brain)))] glow-cosmos" />
            <span className="hidden font-bold sm:inline-block text-gradient-cosmos">WorldOS</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <Link
              className="px-3 py-2 rounded-md transition-colors hover:bg-muted text-foreground/80 hover:text-foreground"
              href="/dashboard"
            >
              Bảng điều khiển
            </Link>
            <Link
              className="px-3 py-2 rounded-md transition-colors hover:bg-muted text-foreground/60 hover:text-foreground"
              href="/narrative-studio"
            >
              Narrative Studio
            </Link>
            <Link
              className="px-3 py-2 rounded-md transition-colors hover:bg-muted text-foreground/60 hover:text-foreground"
              href="/ip-factory"
            >
              IP Factory
            </Link>
            <Link
              className="px-3 py-2 rounded-md transition-colors hover:bg-muted text-foreground/60 hover:text-foreground"
              href="/timeline"
            >
              Timeline
            </Link>
          </nav>
          <div className="flex-1 min-w-0" />
          <div className="flex items-center gap-2 shrink-0">
            <UniverseSelector />
            <button onClick={logout} className="rounded-[var(--radius)] border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted">
              Đăng xuất
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col min-h-0">{children}</main>
    </div>
  );
}
