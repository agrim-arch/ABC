export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-slate-950 text-slate-100">
      <div className="max-w-2xl space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-800 rounded-full uppercase">
          Foundation Phase
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">
          InterviewForge AI
        </h1>

        <p className="text-xl text-slate-300 font-medium">
          Personalized AI Technical Interviewer
        </p>

        <div className="pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left text-sm">
          <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
            <span className="block font-semibold text-slate-200">Framework</span>
            <span className="text-slate-400">Next.js App Router</span>
          </div>
          <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
            <span className="block font-semibold text-slate-200">Database</span>
            <span className="text-slate-400">Supabase Client</span>
          </div>
          <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
            <span className="block font-semibold text-slate-200">API Route</span>
            <span className="text-slate-400">POST /api/interview</span>
          </div>
        </div>
      </div>
    </main>
  );
}
