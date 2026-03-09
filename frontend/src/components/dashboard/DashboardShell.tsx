"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSimulation } from "@/context/SimulationContext";
import { PageContainer } from "@/components/ui/page-container";
import { Loader2, LayoutDashboard, FlaskConical, Radio, Globe, BookOpen, Package, Network } from "lucide-react";
import { DashboardErrorBanner } from "./DashboardErrorBanner";

const navItems = [
  { href: "/dashboard/micro", label: "Micro", icon: LayoutDashboard },
  { href: "/dashboard/macro", label: "Macro", icon: FlaskConical },
  { href: "/dashboard/simulation", label: "Simulation", icon: Radio },
  { href: "/dashboard/cosmologic", label: "Cosmologic", icon: Globe },
  { href: "/dashboard/narrative", label: "Narrative", icon: BookOpen },
  { href: "/dashboard/materials", label: "Materials", icon: Package },
  { href: "/dashboard/networks", label: "Networks", icon: Network },
];

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const { universeId, refresh, loading: isProcessing, error: simError } = useSimulation();

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans flex-col">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-muted via-background to-background" />
      </div>

      <div className="relative z-10 flex flex-col flex-1 min-w-0">
        <header className="flex-shrink-0 border-b border-border bg-card/50">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
            <h1 className="text-base font-semibold text-foreground tracking-tight">
              Đài quan sát văn minh
            </h1>
            <nav className="flex items-center gap-0.5 overflow-x-auto">
              {navItems.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-md whitespace-nowrap transition-colors ${
                      isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </nav>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground font-mono hidden sm:inline">
                Universe {universeId ?? "—"}
              </span>
              <button
                onClick={() => refresh()}
                disabled={isProcessing}
                className="rounded-md border border-border bg-muted px-2.5 py-1.5 text-sm text-foreground hover:bg-muted/80 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                ) : (
                  "Làm mới"
                )}
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-auto">
          <PageContainer className="space-y-6 py-6">
            {simError && <DashboardErrorBanner message={simError} />}
            {children}
          </PageContainer>
        </div>
      </div>
    </div>
  );
}
