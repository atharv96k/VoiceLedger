import React from "react";
import { AudioLines, Cpu, ArrowLeft, BookOpen, ShieldCheck } from "lucide-react";

export default function Navbar({
  viewMode,
  setViewMode,
  activeModel,
  setActiveModel,
  ledgerCount,
  onOpenLedger,
}) {
  return (
    <header className="flex items-center justify-between gap-3 pb-5 border-b border-white/10 no-print font-sans">
      <style>{`
        select.nb-select option { background: #14111c; color: #fff; }
        @keyframes nb-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(251,146,60,.5);} 50% { box-shadow: 0 0 0 8px rgba(251,146,60,0);} }
        @media (prefers-reduced-motion: reduce) { .nb-anim { animation: none !important; } }
      `}</style>

      <div className="flex items-center gap-3">
        {viewMode === "workspace" && (
          <button
            onClick={() => setViewMode("home")}
            className="group px-3 py-2.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white/80 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
        )}

        <div
          onClick={() => setViewMode("home")}
          className="flex items-center gap-3 cursor-pointer select-none"
        >
          <div
            className="nb-anim w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-300 via-orange-500 to-rose-500 flex items-center justify-center shadow-[0_0_24px_rgba(251,146,60,.45)]"
            style={{ animation: "nb-pulse 3s ease-in-out infinite" }}
          >
            <AudioLines className="w-5 h-5 text-white" />
          </div>
          <div className="leading-tight">
            <span className="block font-extrabold text-lg tracking-tight text-white">
              Voice<span className="bg-gradient-to-r from-amber-200 to-orange-400 bg-clip-text text-transparent">Ledger</span>
            </span>
            <span className="hidden sm:block text-[10.5px] font-medium text-white/40">
              Speak the job. Get the GST invoice.
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/[0.06] border border-white/10 text-xs text-white/50">
          <Cpu className="w-4 h-4 text-orange-300" />
          <span>Model</span>
          <select
            value={activeModel}
            onChange={(e) => setActiveModel(e.target.value)}
            className="nb-select bg-transparent font-bold text-white focus:outline-none cursor-pointer"
          >
            <option value="openai/gpt-oss-120b">OpenAI GPT-OSS 120B</option>
            <option value="qwen/qwen3.8-27b">Qwen 3.8 27B</option>
            <option value="openai/gpt-oss-20b">OpenAI GPT-OSS 20B</option>
          </select>
        </div>

        <button
          onClick={onOpenLedger}
          className="px-4 py-2 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-white/25 text-xs font-bold text-white flex items-center gap-2 transition focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-300/30"
        >
          <BookOpen className="w-4 h-4 text-orange-300" />
          <span>Tax Ledger</span>
          <span className="min-w-[20px] text-center px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 text-white text-[10px] font-extrabold">
            {ledgerCount}
          </span>
        </button>

        <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-400/10 border border-emerald-400/25 text-emerald-300 text-xs font-bold">
          <span className="relative flex w-2 h-2">
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-70" />
            <span className="relative w-2 h-2 rounded-full bg-emerald-400" />
          </span>
          <ShieldCheck className="w-4 h-4" />
          <span>Sentry Active</span>
        </div>
      </div>
    </header>
  );
}