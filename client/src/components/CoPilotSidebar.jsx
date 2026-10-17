import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  Volume2,
  Square,
  Play,
  Database,
  CheckCircle2,
  Activity,
  BookmarkCheck,
  Zap,
  IndianRupee,
} from "lucide-react";

/* Shared surface style — matches the dark Voice Studio stage */
const card =
  "relative overflow-hidden rounded-[1.5rem] bg-[#0a0810] border border-white/10 text-white p-5 no-print-card";
const fieldCls =
  "w-full rounded-xl bg-white/[0.06] border border-white/10 px-3 py-2 text-[13px] font-medium text-white placeholder-white/30 focus:outline-none focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20 transition";

/* Decorative mini waveform for the read-back player */
function MiniWave({ active }) {
  const bars = [0.4, 0.8, 0.55, 1, 0.65, 0.9, 0.45, 0.75, 0.5, 0.85, 0.6, 0.35];
  return (
    <div className="flex items-center gap-[3px] h-8" aria-hidden="true">
      {bars.map((h, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-gradient-to-t from-orange-500 to-amber-200"
          style={{
            height: `${h * 100}%`,
            opacity: active ? 1 : 0.35,
            transformOrigin: "center",
            animation: active ? `cp-bar 0.9s ease-in-out ${i * 70}ms infinite alternate` : "none",
          }}
        />
      ))}
    </div>
  );
}

export default function CoPilotSidebar({
  transcript,
  ttsText,
  base64Audio,
  invoice,
  setInvoice,
  telemetry,
  onSaveToLedger,
  isSaved,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  const playAudio = () => {
    if (isPlaying) return stopAudio();
    if (base64Audio) {
      const audio = new Audio(base64Audio);
      audioRef.current = audio;
      setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
      audio.play();
      return;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(ttsText);
      u.onstart = () => setIsPlaying(true);
      u.onend = () => setIsPlaying(false);
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div className="space-y-4 no-print font-sans">
      <style>{`
        @keyframes cp-bar { from { transform: scaleY(.35);} to { transform: scaleY(1);} }
        @keyframes cp-rise { from { opacity:0; transform: translateY(10px);} to { opacity:1; transform: translateY(0);} }
        @media (prefers-reduced-motion: reduce) { .cp-anim { animation: none !important; } }
        select.cp-select option { background: #14111c; color: #fff; }
      `}</style>

      {/* ------------------ Transcript & Voice Read-back ------------------ */}
      <div className={`${card} cp-anim`} style={{ animation: "cp-rise .45s ease-out both" }}>
        <div className="pointer-events-none absolute -top-16 -left-10 w-52 h-52 rounded-full bg-orange-500/20 blur-[70px]" />
        <div className="relative space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">
              <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center">
                <Mic className="w-3.5 h-3.5 text-orange-300" />
              </span>
              ElevenLabs Scribe
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.07] border border-white/10 font-mono text-[10.5px] text-white/60">
              <Zap className="w-3 h-3 text-amber-300" />
              {telemetry.sttLatencyMs}ms
            </span>
          </div>

          <blockquote className="relative rounded-2xl bg-white/[0.05] border border-white/10 p-3.5 pl-4 text-[13px] leading-relaxed text-white/80 italic">
            <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-gradient-to-b from-amber-300 via-orange-500 to-rose-500" />
            &ldquo;{transcript}&rdquo;
          </blockquote>

          {/* Read-back player */}
          <div className="rounded-2xl bg-gradient-to-br from-orange-500/15 via-rose-500/10 to-transparent border border-orange-400/20 p-3.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-orange-200/80">
              <Volume2 className="w-3.5 h-3.5" /> Voice Read-Back
            </div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-white/60">{ttsText}</p>
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={playAudio}
                aria-label={isPlaying ? "Stop read-back" : "Play read-back"}
                className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-amber-300 via-orange-500 to-rose-500 text-white flex items-center justify-center shadow-[0_6px_24px_rgba(251,146,60,.45)] hover:scale-110 active:scale-95 transition focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-300/50"
              >
                {isPlaying ? (
                  <Square className="w-4 h-4 fill-white" />
                ) : (
                  <Play className="w-4 h-4 fill-white ml-0.5" />
                )}
              </button>
              <MiniWave active={isPlaying} />
              <span className="ml-auto text-[11px] font-semibold text-white/50">
                {isPlaying ? "Playing…" : "Hear it"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------ Client & Tax ------------------------ */}
      <div className={card} style={{ animation: "cp-rise .45s ease-out .08s both" }}>
        <div className="pointer-events-none absolute -bottom-20 -right-10 w-56 h-56 rounded-full bg-emerald-500/10 blur-[80px]" />
        <div className="relative space-y-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">
              <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center">
                <Database className="w-3.5 h-3.5 text-emerald-300" />
              </span>
              Atlas Match
            </span>
            {invoice.client.matchedFromDb && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-400/15 border border-emerald-400/30 text-[10.5px] font-bold text-emerald-300">
                <CheckCircle2 className="w-3 h-3" /> Verified
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1.5 text-[10.5px] font-bold uppercase tracking-wider text-white/40">
                Client Name
              </label>
              <input
                type="text"
                value={invoice.client.name}
                onChange={(e) =>
                  setInvoice({
                    ...invoice,
                    client: { ...invoice.client, name: e.target.value },
                  })
                }
                className={fieldCls}
              />
            </div>
            <div>
              <label className="block mb-1.5 text-[10.5px] font-bold uppercase tracking-wider text-white/40">
                GST Slab
              </label>
              <select
                value={invoice.taxRatePercent}
                onChange={(e) =>
                  setInvoice({ ...invoice, taxRatePercent: Number(e.target.value) })
                }
                className={`${fieldCls} cp-select`}
              >
                <option value={0}>0% Exempt</option>
                <option value={5}>5% GST</option>
                <option value={12}>12% GST</option>
                <option value={18}>18% GST</option>
              </select>
            </div>
          </div>

          <button
            onClick={onSaveToLedger}
            disabled={isSaved}
            className={`w-full py-3 rounded-2xl text-[13px] font-extrabold flex items-center justify-center gap-2 transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-300/40 ${
              isSaved
                ? "bg-emerald-400/15 text-emerald-300 border border-emerald-400/30 cursor-default"
                : "bg-gradient-to-r from-amber-300 via-orange-500 to-rose-500 text-white shadow-[0_8px_30px_rgba(251,146,60,.4)] hover:shadow-[0_10px_40px_rgba(251,146,60,.6)] hover:-translate-y-0.5 active:translate-y-0"
            }`}
          >
            {isSaved ? <CheckCircle2 className="w-4 h-4" /> : <BookmarkCheck className="w-4 h-4" />}
            {isSaved ? "Saved to MongoDB Atlas" : "Log Invoice to MongoDB"}
          </button>
        </div>
      </div>

      {/* ----------------------- Sentry Telemetry ----------------------- */}
      <div className={`${card} !p-4`} style={{ animation: "cp-rise .45s ease-out .16s both" }}>
        <div className="pointer-events-none absolute -top-14 right-0 w-48 h-48 rounded-full bg-fuchsia-500/15 blur-[70px]" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">
              <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center">
                <Activity className="w-3.5 h-3.5 text-fuchsia-300" />
              </span>
              Agent Trace
            </span>
            <span className="font-mono text-[10px] text-white/40 px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/10">
              #{telemetry.sentryTraceId}
            </span>
          </div>

          <div className="mt-3.5 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-white/[0.05] border border-white/10 py-2.5">
              <div className="text-[9.5px] uppercase tracking-wider text-white/40 font-bold">Latency</div>
              <div className="mt-0.5 text-sm font-extrabold text-white tabular-nums">{telemetry.latencyMs}ms</div>
            </div>
            <div className="rounded-2xl bg-emerald-400/10 border border-emerald-400/25 py-2.5">
              <div className="text-[9.5px] uppercase tracking-wider text-emerald-300/70 font-bold flex items-center justify-center gap-0.5">
                <IndianRupee className="w-2.5 h-2.5" /> Open
              </div>
              <div className="mt-0.5 text-sm font-extrabold text-emerald-300 tabular-nums">{telemetry.openCost}</div>
            </div>
            <div className="rounded-2xl bg-rose-400/10 border border-rose-400/25 py-2.5">
              <div className="text-[9.5px] uppercase tracking-wider text-rose-300/70 font-bold">Closed</div>
              <div className="mt-0.5 text-sm font-extrabold text-rose-300 line-through decoration-rose-400/70 tabular-nums">
                {telemetry.closedCost}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}