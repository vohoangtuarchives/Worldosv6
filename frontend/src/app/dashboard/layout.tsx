"use client";
import Link from "next/link";
import UniverseSelector from "@/components/UniverseSelector";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
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
            <Link className="mr-6 flex items-center space-x-2" href="/">
              <div className="h-6 w-6 rounded-[var(--radius)] bg-[linear-gradient(135deg,hsl(var(--left-brain)),hsl(var(--cosmos)),hsl(var(--right-brain)))] glow-cosmos" />
              <span className="hidden font-bold sm:inline-block text-gradient-cosmos">WorldOS Dashboard</span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link
                className="transition-colors hover:text-foreground/80 text-foreground/60"
                href="/dashboard"
              >
                Dashboard
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
                href="/dashboard/materials"
              >
                Material
              </Link>
              <a
                className="transition-colors hover:text-cyan-300 text-cyan-400 flex items-center gap-1"
                href="/timeline"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="font-bold tracking-wide">Multiverse Map </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" x2="21" y1="14" y2="3" />
                </svg>
              </a>
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
      <main className="flex-1">{children}</main>
    </div>
  );
}
