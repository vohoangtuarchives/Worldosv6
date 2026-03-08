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
        <div className="container flex h-14 items-center">
          <div className="mr-4 hidden md:flex">
            <Link className="mr-6 flex items-center space-x-2" href="/dashboard">
              <div className="h-6 w-6 rounded-[var(--radius)] bg-[linear-gradient(135deg,hsl(var(--left-brain)),hsl(var(--cosmos)),hsl(var(--right-brain)))] glow-cosmos" />
              <span className="hidden font-bold sm:inline-block text-gradient-cosmos">WorldOS · Bảng điều khiển</span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link
                className="transition-colors hover:text-foreground/80 text-foreground/60"
                href="/dashboard"
              >
                Bảng điều khiển
              </Link>
              <Link
                className="transition-colors hover:text-foreground/80 text-foreground/60"
                href="/dashboard/cosmologic"
              >
                Cosmologic
              </Link>
              <Link
                className="transition-colors hover:text-foreground/80 text-foreground/60"
                href="/dashboard/narrative"
              >
                Narrative
              </Link>
              <Link
                className="transition-colors hover:text-foreground/80 text-foreground/60"
                href="/narrative-studio"
              >
                Narrative Studio
              </Link>
              <Link
                className="transition-colors hover:text-foreground/80 text-foreground/60"
                href="/ip-factory"
              >
                IP Factory
              </Link>
              <Link
                className="transition-colors hover:text-foreground/80 text-foreground/60"
                href="/dashboard/materials"
              >
                Material
              </Link>
              <Link
                className="transition-colors hover:text-foreground/80 text-foreground/60"
                href="/dashboard/networks"
              >
                Mạng lưới
              </Link>
              <Link
                className="transition-colors hover:text-foreground/80 text-foreground/60"
                href="/timeline"
              >
                Timeline
              </Link>
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none" />
            <div className="flex items-center gap-2">
              <UniverseSelector />
              <button onClick={logout} className="rounded-[var(--radius)] border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted">
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col min-h-0">{children}</main>
    </div>
  );
}
