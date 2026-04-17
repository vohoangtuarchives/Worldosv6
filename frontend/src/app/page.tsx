import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050508] text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-900/20 via-[#050508] to-[#050508]" />
        <div className="relative max-w-7xl mx-auto px-8 py-24">
          <div className="text-center">
            <h1 className="text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400 mb-4">
              WorldOS
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Nền tảng mô phỏng đa vũ trụ với AI narrative generation
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Dashboard Card */}
          <Link href="/dashboard" className="group">
            <div className="h-full p-8 bg-gradient-to-br from-gray-900/80 to-gray-800/50 border border-white/10 rounded-2xl hover:border-violet-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]">
              <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-violet-500/30 transition-colors">
                <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-violet-400 transition-colors">
                Dashboard
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Quản lý vũ trụ, theo dõi simulation pulse, và điều khiển các hệ thống core
              </p>
            </div>
          </Link>

          {/* Narrative Studio Card */}
          <Link href="/narrative-studio" className="group">
            <div className="h-full p-8 bg-gradient-to-br from-gray-900/80 to-gray-800/50 border border-white/10 rounded-2xl hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(34,211,238,0.3)]">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-cyan-500/30 transition-colors">
                <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">
                Narrative Studio
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Theo dõi và điều khiển pipeline narrative generation với real-time visualization
              </p>
            </div>
          </Link>

          {/* Narrative Cinema Card */}
          <Link href="/narrative-cinema" className="group">
            <div className="h-full p-8 bg-gradient-to-br from-gray-900/80 to-gray-800/50 border border-white/10 rounded-2xl hover:border-emerald-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-500/30 transition-colors">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">
                Narrative Cinema
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Xem và tương tác với các chronicle đã được tạo ra dưới dạng visual storytelling
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <p className="text-center text-gray-500 text-sm">
            WorldOS Platform © 2026
          </p>
        </div>
      </div>
    </div>
  );
}
