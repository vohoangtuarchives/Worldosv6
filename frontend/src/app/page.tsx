import Link from "next/link";

export default function Home() {
  const stars = Array.from({ length: 72 }, (_, i) => {
    const x = ((i * 37) % 10000) / 100;
    const y = ((i * 71) % 10000) / 100;
    const s = ((i * 13) % 10) / 10;
    const size = s < 0.2 ? 1 : s < 0.75 ? 2 : 3;
    const delay = ((i * 19) % 400) / 100;
    const duration = 2.8 + ((i * 23) % 50) / 10;
    return { x, y, size, delay, duration };
  });

  return (
    <div className="relative min-h-dvh overflow-hidden flex flex-col">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,hsl(var(--cosmos)/0.20),transparent_55%),radial-gradient(circle_at_80%_20%,hsl(var(--left-brain)/0.18),transparent_55%),radial-gradient(circle_at_50%_90%,hsl(var(--nebula)/0.16),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-starfield opacity-35 bg-starfield-drift-slow" />
      <div className="pointer-events-none absolute -inset-10 bg-starfield opacity-25 bg-starfield-drift-fast" />
      <div className="pointer-events-none absolute inset-0">
        {stars.map((s, idx) => (
          <span
            key={idx}
            className="absolute rounded-full bg-[hsl(var(--starlight))] opacity-40"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
            }}
          />
        ))}
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-[var(--radius)] bg-[linear-gradient(135deg,hsl(var(--left-brain)),hsl(var(--cosmos)),hsl(var(--right-brain)))] glow-cosmos" />
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-wide text-gradient-cosmos">
              WorldOS
            </div>
            <div className="text-xs text-muted-foreground">V6 Landing</div>
          </div>
        </div>

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a className="hover:text-foreground transition-colors" href="#features">
            Tính năng
          </a>
          <a className="hover:text-foreground transition-colors" href="#engine">
            Engine
          </a>
          <a className="hover:text-foreground transition-colors" href="#narrative">
            Dẫn truyện
          </a>
          <a className="hover:text-foreground transition-colors" href="#cta">
            Bắt đầu
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            className="hidden rounded-[var(--radius)] border border-border bg-card px-4 py-2 text-sm text-foreground/90 backdrop-blur transition-colors hover:bg-muted md:inline-flex"
            href="/"
          >
            Dashboard
          </Link>
          <a
            className="rounded-[var(--radius)] bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-left-brain transition-colors hover:bg-[hsl(var(--left-brain-glow))]"
            href="#cta"
          >
            Chạy Demo
          </a>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full px-6 flex-1 flex flex-col justify-center text-center">
        <section className="flex flex-col items-center justify-center gap-10">
          <div className="flex flex-col items-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-[hsl(var(--left-brain))] glow-left-brain" />
              <span>Simulation + Narrative + Forking</span>
            </div>

            <h1 className="text-balance text-5xl font-semibold tracking-tight md:text-7xl">
              <span className="text-gradient-cosmos">Civilizational Dynamics</span>{" "}
              Engine
            </h1>

            <p className="max-w-2xl text-pretty text-lg leading-8 text-muted-foreground md:text-xl">
              Mô phỏng sự trỗi dậy và sụp đổ của các nền văn minh thông qua cơ chế
              <span className="text-foreground"> Pressure → Decision → Cascade</span>.
              Khi khủng hoảng vượt ngưỡng, vũ trụ sẽ tự động phân nhánh.
            </p>

            <div className="flex flex-col justify-center gap-4 sm:flex-row pt-4">
              <a
                className="rounded-[var(--radius)] bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground glow-left-brain transition-colors hover:bg-[hsl(var(--left-brain-glow))]"
                href="#cta"
              >
                Khởi chạy ngay
              </a>
              <a
                className="rounded-[var(--radius)] border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground/90 backdrop-blur transition-colors hover:bg-muted"
                href="https://github.com/"
                target="_blank"
                rel="noreferrer"
              >
                Xem tài liệu
              </a>
            </div>

            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground pt-8">
              <div className="flex items-center gap-2 rounded-full border border-border bg-card/30 px-4 py-1.5 backdrop-blur transition-colors hover:bg-card/50">
                <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--left-brain))]"></span>
                Tick-based simulation
              </div>
              <div className="flex items-center gap-2 rounded-full border border-border bg-card/30 px-4 py-1.5 backdrop-blur transition-colors hover:bg-card/50">
                <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--cosmos))]"></span>
                Material mutation DAG
              </div>
              <div className="flex items-center gap-2 rounded-full border border-border bg-card/30 px-4 py-1.5 backdrop-blur transition-colors hover:bg-card/50">
                <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--right-brain))]"></span>
                Great Filter events
              </div>
            </div>
          </div>
        </section>

        {/* <section id="features" className="mt-20">
          <div className="flex items-end justify-between gap-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Tính năng cốt lõi
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Thiết kế dựa trên palette và hiệu ứng glow/gradient, tối ưu cho
                cảm giác “cosmic system UI”.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-[var(--radius)] border border-border bg-card/40 p-6 backdrop-blur">
              <div className="text-xs font-semibold text-gradient-left">
                Macro Loop
              </div>
              <div className="mt-2 text-lg font-semibold">Universe Runtime</div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Cập nhật vector trạng thái theo tick, ghi snapshot, đánh giá
                stability/entropy.
              </p>
            </div>
            <div className="rounded-[var(--radius)] border border-border bg-card/40 p-6 backdrop-blur">
              <div className="text-xs font-semibold text-gradient-cosmos">
                Forking
              </div>
              <div className="mt-2 text-lg font-semibold">Multiverse Graph</div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Khi criticality vượt ngưỡng, fork tạo universe nhánh và kích
                hoạt external shocks.
              </p>
            </div>
            <div className="rounded-[var(--radius)] border border-border bg-card/40 p-6 backdrop-blur">
              <div className="text-xs font-semibold text-gradient-right">
                Narratives
              </div>
              <div className="mt-2 text-lg font-semibold">Chronicles & Scars</div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Tầng perceived archive + residual injection tạo sử thi, ghi dấu
                trauma dài hạn.
              </p>
            </div>
          </div>
        </section> */}

        {/* <section id="cta" className="mt-20">
          <div className="relative overflow-hidden rounded-[calc(var(--radius)+12px)] border border-border bg-card/40 p-8 backdrop-blur md:p-10">
            <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-[hsl(var(--left-brain)/0.25)] blur-2xl" />
            <div className="pointer-events-none absolute -bottom-10 -right-10 h-44 w-44 rounded-full bg-[hsl(var(--right-brain)/0.25)] blur-2xl" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--cosmos)/0.18),transparent_60%)]" />

            <div className="relative">
              <div className="text-xs font-semibold text-gradient-cosmos">
                Ready to fork a universe?
              </div>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
                Chạy demo scenario ngay trong Docker
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Khởi động stack và chạy kịch bản Genesis → Stability → Crisis →
                Fork, sau đó xem Chronicles và Graph trên dashboard.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a
                  className="rounded-[var(--radius)] bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground glow-left-brain transition-colors hover:bg-[hsl(var(--left-brain-glow))]"
                  href="#"
                >
                  docker compose up -d
                </a>
                <a
                  className="rounded-[var(--radius)] border border-border bg-[hsl(var(--void))] px-5 py-3 text-sm font-semibold text-foreground/90 glow-cosmos transition-colors hover:bg-muted"
                  href="#"
                >
                  worldos:demo-scenario
                </a>
              </div>
            </div>
          </div>
        </section> */}

      </main>
      <footer className="relative z-10 mx-auto w-full px-6 py-8 border-t border-border/60 flex flex-col items-center justify-center gap-3 text-xs text-muted-foreground md:flex-row mt-auto backdrop-blur-sm bg-background/30">
        <div className="font-mono">WorldOS V6</div>
      </footer>
    </div>
  );
}
