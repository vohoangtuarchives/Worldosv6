import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050508] text-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-900/20 via-[#050508] to-[#050508]" />
        <div className="relative mx-auto max-w-7xl px-8 py-24">
          <div className="text-center">
            <h1 className="mb-4 bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-6xl font-black italic tracking-tighter text-transparent">
              WorldOS
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-gray-400">
              Nen tang mo phong da vu tru voi AI narrative generation
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-8 py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <Link href="/dashboard" className="group">
            <div className="h-full rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/50 p-8 transition-all duration-300 hover:border-violet-500/50 hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/20 transition-colors group-hover:bg-violet-500/30">
                <svg className="h-6 w-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <h2 className="mb-3 text-2xl font-bold text-white transition-colors group-hover:text-violet-400">
                Dashboard
              </h2>
              <p className="text-sm leading-relaxed text-gray-400">
                Quan ly vu tru, theo doi simulation pulse, va dieu khien cac he thong core
              </p>
            </div>
          </Link>

          <Link href="/dashboard/loom-workshop" className="group">
            <div className="h-full rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/50 p-8 transition-all duration-300 hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.3)]">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20 transition-colors group-hover:bg-cyan-500/30">
                <svg className="h-6 w-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="mb-3 text-2xl font-bold text-white transition-colors group-hover:text-cyan-400">
                Loom Workshop
              </h2>
              <p className="text-sm leading-relaxed text-gray-400">
                Surface chinh cho narrative generation: submit run, office view, realtime monitoring, va review output
              </p>
            </div>
          </Link>

          <Link href="/narrative-cinema" className="group">
            <div className="h-full rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/50 p-8 transition-all duration-300 hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 transition-colors group-hover:bg-emerald-500/30">
                <svg className="h-6 w-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
              </div>
              <h2 className="mb-3 text-2xl font-bold text-white transition-colors group-hover:text-emerald-400">
                Narrative Cinema
              </h2>
              <p className="text-sm leading-relaxed text-gray-400">
                Xem va tuong tac voi cac chronicle da duoc tao ra duoi dang visual storytelling
              </p>
            </div>
          </Link>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-8 py-8">
          <p className="text-center text-sm text-gray-500">WorldOS Platform 2026</p>
        </div>
      </div>
    </div>
  );
}
