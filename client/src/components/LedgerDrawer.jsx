import React, { useState } from "react";
import { X, Database, TrendingUp, CheckCircle2 } from "lucide-react";

/* Self-contained keyframes: no tailwind.config changes needed */
const drawerStyles = `
@keyframes ld-slide-in {
  0%   { transform: translateX(100%) scale(0.98); opacity: 0; filter: blur(6px); }
  60%  { transform: translateX(-1.5%) scale(1); opacity: 1; filter: blur(0); }
  100% { transform: translateX(0) scale(1); opacity: 1; filter: blur(0); }
}
@keyframes ld-fade-up {
  0%   { opacity: 0; transform: translateY(14px) scale(0.97); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes ld-backdrop { 0% { opacity: 0; } 100% { opacity: 1; } }
@keyframes ld-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
@keyframes ld-border-glow { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

/* ---------- blurred backdrop animation ---------- */
@keyframes ld-grid-drift { from { background-position: 0 0; } to { background-position: 24px 24px; } }
@keyframes ld-orb-a {
  0%   { transform: translate(-10%, -5%) scale(1); }
  50%  { transform: translate(35%, 25%) scale(1.25); }
  100% { transform: translate(10%, 60%) scale(0.95); }
}
@keyframes ld-orb-b {
  0%   { transform: translate(0, 0) scale(1.1); }
  50%  { transform: translate(-40%, 30%) scale(0.9); }
  100% { transform: translate(-15%, -30%) scale(1.2); }
}
@keyframes ld-orb-c {
  0%   { transform: translate(0, 0) scale(0.9); }
  50%  { transform: translate(30%, -35%) scale(1.15); }
  100% { transform: translate(-25%, -10%) scale(1); }
}
@keyframes ld-sweep {
  0%   { transform: translateX(-140%) skewX(-20deg); opacity: 0; }
  20%  { opacity: 1; }
  80%  { opacity: 1; }
  100% { transform: translateX(380%) skewX(-20deg); opacity: 0; }
}
@keyframes ld-rise {
  0%   { transform: translateY(0) scale(0.6); opacity: 0; }
  15%  { opacity: 0.8; }
  100% { transform: translateY(-260px) scale(1.1); opacity: 0; }
}

.ld-grid-anim { animation: ld-grid-drift 5s linear infinite; }
.ld-orb { position: absolute; border-radius: 9999px; pointer-events: none; will-change: transform; }
.ld-orb-a { animation: ld-orb-a 16s ease-in-out infinite alternate; }
.ld-orb-b { animation: ld-orb-b 20s ease-in-out infinite alternate; }
.ld-orb-c { animation: ld-orb-c 18s ease-in-out infinite alternate; }
.ld-sweep {
  position: absolute; top: 0; bottom: 0; left: 0;
  width: 18%;
  background: linear-gradient(90deg, transparent, rgba(251,146,60,0.12), transparent);
  animation: ld-sweep 9s ease-in-out infinite;
  pointer-events: none;
}
.ld-dot {
  position: absolute; bottom: -10px;
  border-radius: 9999px;
  background: radial-gradient(circle, rgba(253,186,116,0.95), rgba(244,63,94,0.4));
  animation: ld-rise linear infinite;
  pointer-events: none;
}

.ld-backdrop { animation: ld-backdrop 400ms ease-out both; }

.ld-panel {
  animation: ld-slide-in 560ms cubic-bezier(0.22, 1.2, 0.36, 1) both;
  will-change: transform, opacity;
}

/* animated gradient edge on the panel's left side */
.ld-panel::before {
  content: "";
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, transparent, #fbbf24, #f97316, #f43f5e, transparent);
  animation: ld-border-glow 3s ease-in-out infinite;
  pointer-events: none;
}

/* staggered entrance */
.ld-stagger { animation: ld-fade-up 480ms cubic-bezier(0.22, 1, 0.36, 1) both; }

/* KPI cards: lift + shine sweep */
.ld-kpi {
  position: relative;
  overflow: hidden;
  transition: transform 350ms cubic-bezier(0.22, 1, 0.36, 1),
              box-shadow 350ms ease, background-color 350ms ease;
}
.ld-kpi::after {
  content: "";
  position: absolute;
  top: 0; left: -80%;
  width: 50%; height: 100%;
  background: linear-gradient(120deg, transparent, rgba(255,255,255,0.14), transparent);
  transform: skewX(-20deg);
  transition: left 700ms ease;
  pointer-events: none;
}
.ld-kpi:hover { transform: translateY(-4px) scale(1.03); box-shadow: 0 14px 34px -12px rgba(249,115,22,0.45); }
.ld-kpi:hover::after { left: 130%; }
.ld-kpi:hover svg { animation: ld-float 1.2s ease-in-out infinite; }

/* ledger rows: accent bar + shine (no movement, right column stays still) */
.ld-row {
  position: relative;
  overflow: hidden;
  transition: box-shadow 300ms ease, background-color 300ms ease, border-color 300ms ease;
}
.ld-row::before {
  content: "";
  position: absolute;
  left: 0; top: 18%; bottom: 18%;
  width: 3px;
  border-radius: 0 4px 4px 0;
  background: linear-gradient(to bottom, #fbbf24, #f43f5e);
  transform: scaleY(0);
  transition: transform 300ms cubic-bezier(0.22, 1, 0.36, 1);
}
.ld-row::after {
  content: "";
  position: absolute;
  top: 0; left: -70%;
  width: 40%; height: 100%;
  background: linear-gradient(120deg, transparent, rgba(251,146,60,0.14), transparent);
  transform: skewX(-20deg);
  transition: left 650ms ease;
  pointer-events: none;
}
.ld-row:hover { box-shadow: 0 10px 28px -12px rgba(0,0,0,0.7); }
.ld-row:hover::before { transform: scaleY(1); }
.ld-row:hover::after { left: 130%; }

/* thin dark scrollbar */
.ld-scroll { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.18) transparent; }

/* respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .ld-panel, .ld-stagger, .ld-backdrop { animation: none !important; }
  .ld-kpi, .ld-row { transition: none !important; }
  .ld-kpi:hover svg, .ld-panel::before,
  .ld-grid-anim, .ld-orb, .ld-sweep, .ld-dot { animation: none !important; }
}
`;

const particles = [
  { left: "8%",  size: 5, dur: 11, delay: 0 },
  { left: "18%", size: 3, dur: 14, delay: 3 },
  { left: "29%", size: 4, dur: 12, delay: 6 },
  { left: "41%", size: 3, dur: 15, delay: 1 },
  { left: "52%", size: 5, dur: 13, delay: 8 },
  { left: "63%", size: 3, dur: 10, delay: 4 },
  { left: "74%", size: 4, dur: 16, delay: 2 },
  { left: "86%", size: 3, dur: 12, delay: 7 },
];

export default function LedgerDrawer({ isOpen, onClose, ledgerItems, view = "invoices" }) {
  // Hooks must run before any early return
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  if (!isOpen) return null;

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  const totalRevenue = ledgerItems.reduce((s, i) => s + i.grandTotal, 0);
  const totalGst = ledgerItems.reduce((s, i) => s + (i.gstCollected || 0), 0);
  const gstBreakdown = Object.values(ledgerItems.reduce((groups, item) => {
    const key = item.taxRatePercent == null ? "unknown" : String(Number(item.taxRatePercent));
    const rate = key === "unknown" ? null : Number(key);
    if (!groups[key]) groups[key] = { rate, count: 0, taxable: 0, gst: 0 };
    groups[key].count += 1;
    groups[key].taxable += Number(item.subtotal || Math.max(0, item.grandTotal - (item.gstCollected || 0)));
    groups[key].gst += Number(item.gstCollected || 0);
    return groups;
  }, {})).sort((a, b) => (a.rate ?? Infinity) - (b.rate ?? Infinity));

  return (
    <div
      onMouseMove={handleMouseMove}
      className="absolute inset-0 z-50 rounded-[2rem] overflow-hidden flex justify-end no-print group font-sans"
    >
      <style>{drawerStyles}</style>

      {/* ===================================================================
          ANIMATED BLURRED BACKDROP + MOUSE-FOLLOWING GLOW
         =================================================================== */}
      <div className="ld-backdrop absolute inset-0 bg-[#050408]/75 backdrop-blur-md pointer-events-none overflow-hidden">
        {/* Slowly drifting grid pattern */}
        <div className="ld-grid-anim absolute inset-0 bg-[linear-gradient(to_right,#ffffff0d_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0d_1px,transparent_1px)] bg-[size:24px_24px]" />

        {/* Floating colour orbs */}
        <div className="ld-orb ld-orb-a left-[5%] top-[8%] w-[320px] h-[320px] bg-orange-500/30 blur-[90px]" />
        <div className="ld-orb ld-orb-b right-[15%] top-[35%] w-[360px] h-[360px] bg-rose-500/25 blur-[100px]" />
        <div className="ld-orb ld-orb-c left-[25%] bottom-[0%] w-[300px] h-[300px] bg-amber-400/20 blur-[90px]" />

        {/* Soft light sweep */}
        <div className="ld-sweep" />

        {/* Rising particles */}
        {particles.map((p, i) => (
          <span
            key={i}
            className="ld-dot"
            style={{
              left: p.left,
              width: p.size,
              height: p.size,
              animationDuration: `${p.dur}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}

        {/* Dynamic Spotlight Glow following cursor */}
        <div
          className="absolute w-[500px] h-[500px] bg-gradient-to-tr from-amber-400/25 via-orange-500/20 to-rose-500/25 rounded-full blur-[100px] transition-[left,top] duration-500 ease-out pointer-events-none -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${mousePos.x}%`,
            top: `${mousePos.y}%`,
          }}
        />
      </div>

      {/* ===================================================================
          SLIDE-OVER PANEL
         =================================================================== */}
      <div className="ld-panel relative z-10 w-full max-w-md h-full bg-[#0a0810]/95 backdrop-blur-2xl border-l border-white/10 text-white p-6 flex flex-col justify-between shadow-[-30px_0_80px_rgba(0,0,0,0.6)] transition-shadow duration-500 hover:shadow-[-30px_0_90px_rgba(249,115,22,0.18)]">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-400/10 border border-emerald-400/20 text-emerald-300 transition-transform duration-300 group-hover:scale-110">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-sm tracking-tight">
                  {view === "reports" ? "GST Reports" : "Tax Ledger"}
                </h3>
                <p className="text-[11px] text-white/45">
                  Auto-classified HSN/SAC records
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close ledger"
              className="p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.14] border border-white/10 text-white/70 hover:text-white transition-all duration-200 hover:rotate-90 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-300/30"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* KPI Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div
              className="ld-stagger ld-kpi p-4 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-500/[0.04] border border-orange-400/25"
              style={{ animationDelay: "200ms" }}
            >
              <div className="text-[10.5px] uppercase tracking-wider text-orange-200/80 font-bold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Total Billed
              </div>
              <div className="text-xl font-extrabold text-white mt-1.5 tabular-nums">
                ₹{totalRevenue.toLocaleString("en-IN")}
              </div>
            </div>

            <div
              className="ld-stagger ld-kpi p-4 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-emerald-400/[0.04] border border-emerald-400/25"
              style={{ animationDelay: "280ms" }}
            >
              <div className="text-[10.5px] uppercase tracking-wider text-emerald-200/80 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> GST Collected
              </div>
              <div className="text-xl font-extrabold text-white mt-1.5 tabular-nums">
                ₹{totalGst.toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          {/* Active invoices or GST rate summary */}
          <div className="ld-scroll space-y-3 overflow-y-auto overflow-x-hidden max-h-[calc(100vh-320px)] pr-1">
            <div
              className="ld-stagger text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/35"
              style={{ animationDelay: "340ms" }}
            >
              {view === "reports" ? "GST summary by rate" : `Persisted invoices (${ledgerItems.length})`}
            </div>

            {view === "reports" ? (
              gstBreakdown.length ? gstBreakdown.map((group) => (
                <div
                  key={group.rate ?? "unknown"}
                  className="ld-stagger p-4 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-sm text-white">{group.rate == null ? "Rate unavailable" : `${group.rate}% GST`}</div>
                    <div className="text-[10.5px] text-white/45 mt-1">{group.count} invoice{group.count === 1 ? "" : "s"} · Taxable sales ₹{group.taxable.toLocaleString("en-IN")}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-extrabold text-emerald-300 tabular-nums">₹{group.gst.toLocaleString("en-IN")}</div>
                    <div className="text-[9.5px] uppercase tracking-wider text-white/40">GST collected</div>
                  </div>
                </div>
              )) : <p className="p-4 rounded-2xl bg-white/[0.05] border border-white/10 text-xs text-white/50">No saved invoices to report yet.</p>
            ) : ledgerItems.map((entry, idx) => (
              <div
                key={entry.id}
                className="ld-stagger ld-row p-3.5 rounded-2xl bg-white/[0.05] border border-white/10 hover:bg-white/[0.09] hover:border-white/20 flex items-center justify-between gap-3 cursor-pointer"
                style={{ animationDelay: `${400 + Math.min(idx, 10) * 60}ms` }}
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="font-bold text-xs text-white truncate">
                    {entry.clientName}
                  </div>
                  <div className="text-[10px] font-mono text-orange-300 font-semibold">
                    {entry.id}
                  </div>
                  <div className="text-[10px] text-white/45">
                    {entry.categorySplit || entry.date}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-extrabold text-white tabular-nums">
                    ₹{entry.grandTotal.toLocaleString("en-IN")}
                  </div>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-emerald-400/15 border border-emerald-400/25 text-emerald-300 text-[9px] font-bold">
                    {entry.status || "LOGGED"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Status */}
        <div
          className="ld-stagger pt-4 border-t border-white/10 text-[11px] text-white/45 flex items-center justify-between"
          style={{ animationDelay: "500ms" }}
        >
          <span className="font-mono">Cluster: voiceledger-prod-0</span>
          <span className="text-emerald-300 font-bold flex items-center gap-1.5">
            <span className="relative flex w-2 h-2">
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-70" />
              <span className="relative w-2 h-2 rounded-full bg-emerald-400" />
            </span>
            Connected
          </span>
        </div>
      </div>
    </div>
  );
}
