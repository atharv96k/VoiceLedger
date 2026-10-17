import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Mic,
  Square,
  Loader2,
  Sparkles,
  Wrench,
  Camera,
  Cake,
  Radio,
  ArrowUpRight,
  AudioLines,
  Languages,
  Database,
  Hash,
} from "lucide-react";
import { DEMO_PRESETS } from "../data/demoPresets";

/* -------------------------------------------------------------------------
   Canvas orb: a living, audio-reactive blob with a radial spectrum ring.
   States: idle (breathing) · listening (reacts to mic) · processing (orbit)
-------------------------------------------------------------------------- */
function useOrbCanvas(canvasRef, stateRef) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const SIZE = 380;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    ctx.scale(dpr, dpr);

    let raf;
    let level = 0;
    let spin = 0;
    const cx = SIZE / 2;
    const cy = SIZE / 2;
    const BARS = 72;

    const blob = (t, base, amp, phase, hue) => {
      const N = 90;
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const a = (i / N) * Math.PI * 2;
        const wobble =
          Math.sin(a * 3 + t * 1.3 + phase) * (3 + amp * 14) +
          Math.sin(a * 5 - t * 0.9 + phase * 2) * (2 + amp * 9) +
          Math.sin(a * 2 + t * 0.6) * (2 + amp * 6);
        const r = base + wobble;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      const g = ctx.createRadialGradient(cx - 24, cy - 30, 8, cx, cy, base + 30);
      g.addColorStop(0, `hsla(${hue}, 100%, 78%, 0.95)`);
      g.addColorStop(0.55, `hsla(${hue - 14}, 96%, 56%, 0.8)`);
      g.addColorStop(1, `hsla(${hue - 38}, 90%, 40%, 0.55)`);
      ctx.fillStyle = g;
      ctx.fill();
    };

    const draw = (ms) => {
      const t = ms / 1000;
      const s = stateRef.current;
      ctx.clearRect(0, 0, SIZE, SIZE);

      // Resolve audio level
      let target = 0.05 + Math.sin(t * 1.1) * 0.02; // idle breathing
      let freq = null;
      if (s.recording) {
        if (s.analyser && s.freqData) {
          s.analyser.getByteFrequencyData(s.freqData);
          freq = s.freqData;
          let sum = 0;
          for (let i = 0; i < 48; i++) sum += s.freqData[i];
          target = Math.min(1, (sum / 48 / 255) * 1.8);
        } else {
          target = 0.35 + Math.abs(Math.sin(t * 5)) * 0.3 * Math.abs(Math.sin(t * 1.7)); // simulated
        }
      } else if (s.processing) {
        target = 0.18 + Math.sin(t * 3) * 0.05;
      }
      level += (target - level) * 0.14;

      const base = 92 + level * 16;

      // Ambient glow
      const glow = ctx.createRadialGradient(cx, cy, 20, cx, cy, 190);
      glow.addColorStop(0, `rgba(255,140,40,${0.28 + level * 0.4})`);
      glow.addColorStop(0.5, `rgba(244,63,94,${0.1 + level * 0.2})`);
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, SIZE, SIZE);

      // Radial spectrum ring
      for (let i = 0; i < BARS; i++) {
        const a = (i / BARS) * Math.PI * 2 - Math.PI / 2;
        let v;
        if (freq) {
          const idx = Math.floor((i / BARS) * 56);
          v = freq[idx] / 255;
        } else if (s.recording) {
          v = 0.25 + Math.abs(Math.sin(t * 4 + i * 0.5)) * 0.5 * level * 2;
        } else {
          v = 0.04 + (Math.sin(t * 1.2 + i * 0.35) * 0.5 + 0.5) * 0.06;
        }
        const r0 = base + 26;
        const len = 4 + v * 52;
        ctx.strokeStyle = `hsla(${28 + (i / BARS) * 330 * 0.12}, 100%, ${60 + v * 20}%, ${0.25 + v * 0.7})`;
        ctx.lineWidth = 2.4;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
        ctx.lineTo(cx + Math.cos(a) * (r0 + len), cy + Math.sin(a) * (r0 + len));
        ctx.stroke();
      }

      // Layered liquid blobs
      ctx.globalCompositeOperation = "lighter";
      blob(t, base, level, 0, 34);
      blob(t * 1.15, base - 8, level, 2.1, 22);
      blob(t * 0.85, base - 16, level, 4.2, 348);
      ctx.globalCompositeOperation = "source-over";

      // Specular highlight
      const hl = ctx.createRadialGradient(cx - 30, cy - 38, 2, cx - 30, cy - 38, 60);
      hl.addColorStop(0, "rgba(255,255,255,0.55)");
      hl.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = hl;
      ctx.beginPath();
      ctx.arc(cx - 30, cy - 38, 60, 0, Math.PI * 2);
      ctx.fill();

      // Processing orbit
      if (s.processing) {
        spin += 0.045;
        for (let k = 0; k < 3; k++) {
          const rr = base + 44 + k * 14;
          ctx.strokeStyle = `rgba(255,${190 - k * 40},${90 - k * 20},${0.85 - k * 0.22})`;
          ctx.lineWidth = 2.5 - k * 0.5;
          ctx.lineCap = "round";
          ctx.beginPath();
          const start = spin * (k % 2 ? -1.3 : 1) + k;
          ctx.arc(cx, cy, rr, start, start + Math.PI * (0.7 - k * 0.15));
          ctx.stroke();
        }
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [canvasRef, stateRef]);
}

const fmt = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export default function GeminiVoiceOrb({
  processingStep,
  onVoiceCaptured,
  onPresetSelect,
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioCtxRef = useRef(null);
  const speechCheckRef = useRef(null);
  const speechDurationRef = useRef(0);
  const [captureMessage, setCaptureMessage] = useState("");

  const canvasRef = useRef(null);
  const orbState = useRef({ recording: false, processing: false, analyser: null, freqData: null });
  useOrbCanvas(canvasRef, orbState);

  // keep orb state in sync with React state
  orbState.current.recording = isRecording;
  orbState.current.processing = Boolean(processingStep);

  const teardownAudio = useCallback(() => {
    orbState.current.analyser = null;
    orbState.current.freqData = null;
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearInterval(speechCheckRef.current);
      teardownAudio();
    };
  }, [teardownAudio]);

  const startTimer = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    timerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
  };

  const startRecording = async () => {
    speechDurationRef.current = 0;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      // live analyser for the orb
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        const actx = new AC();
        const analyser = actx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        actx.createMediaStreamSource(stream).connect(analyser);
        audioCtxRef.current = actx;
        orbState.current.analyser = analyser;
        orbState.current.freqData = new Uint8Array(analyser.frequencyBinCount);
        const samples = new Float32Array(analyser.fftSize);
        speechDurationRef.current = 0;
        speechCheckRef.current = setInterval(() => {
          analyser.getFloatTimeDomainData(samples);
          const rms = Math.sqrt(samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length);
          if (rms > 0.012) speechDurationRef.current += 100;
        }, 100);
      } catch (_) {
        /* orb falls back to simulated motion */
      }

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        clearInterval(speechCheckRef.current);
        teardownAudio();
        if (speechDurationRef.current < 250 || audioBlob.size < 300) {
          setCaptureMessage("No speech detected. Please try again and speak clearly after starting the recording.");
          return;
        }
        onVoiceCaptured(audioBlob);
      };

      recorder.start();
      setCaptureMessage("");
      startTimer();
    } catch (err) {
      setIsRecording(false);
      setCaptureMessage("Microphone access is unavailable. Allow microphone access and try again.");
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    } else {
      teardownAudio();
      setCaptureMessage("No recording was captured. Please try again.");
    }
  };

  const handleOrbAction = () => {
    if (processingStep) return;
    isRecording ? stopRecording() : startRecording();
  };

  const presetMeta = (id) => {
    switch (id) {
      case "plumber":
        return { icon: <Wrench className="w-4 h-4" />, tint: "from-amber-400/25 to-amber-600/5", text: "text-amber-300" };
      case "photographer":
        return { icon: <Camera className="w-4 h-4" />, tint: "from-rose-400/25 to-rose-600/5", text: "text-rose-300" };
      case "baker":
        return { icon: <Cake className="w-4 h-4" />, tint: "from-orange-400/25 to-orange-600/5", text: "text-orange-300" };
      default:
        return { icon: <Radio className="w-4 h-4" />, tint: "from-amber-400/25 to-amber-600/5", text: "text-amber-300" };
    }
  };

  const status = processingStep
    ? "Processing"
    : isRecording
    ? "Listening"
    : "Ready";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch font-sans">
      <style>{`
        @keyframes vo-float { 0%,100% { transform: translate3d(0,0,0) scale(1);} 50% { transform: translate3d(30px,-20px,0) scale(1.15);} }
        @keyframes vo-float2 { 0%,100% { transform: translate3d(0,0,0) scale(1);} 50% { transform: translate3d(-40px,24px,0) scale(1.1);} }
        @keyframes vo-shimmer { 0% { background-position: -200% 0;} 100% { background-position: 200% 0;} }
        @keyframes vo-ripple { 0% { transform: scale(1); opacity: .55;} 100% { transform: scale(2.1); opacity: 0;} }
        @keyframes vo-rise { from { opacity: 0; transform: translateY(10px);} to { opacity: 1; transform: translateY(0);} }
        .vo-grain { background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='.5'/></svg>"); }
        .vo-shimmer-text { background: linear-gradient(90deg,#fde68a,#fff,#fdba74,#fff,#fde68a); background-size: 200% 100%; -webkit-background-clip: text; background-clip: text; color: transparent; animation: vo-shimmer 3s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .vo-anim { animation: none !important; } }
      `}</style>

      {/* ------------------------------ Rail ------------------------------ */}
      <aside className="hidden lg:flex lg:col-span-3 flex-col gap-2 rounded-[1.75rem] bg-[#0d0b12] border border-white/10 p-3 text-white">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-300 via-orange-500 to-rose-500 flex items-center justify-center shadow-[0_0_20px_rgba(251,146,60,.5)]">
            <AudioLines className="w-4 h-4 text-white" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold tracking-tight">Vaani Studio</div>
            <div className="text-[10px] text-white/40">Voice → Invoice agent</div>
          </div>
        </div>

        <div className="text-[10px] uppercase tracking-[0.18em] text-white/30 font-bold px-3 mt-3 mb-1">
          Workspace
        </div>

        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.07] border border-white/10 text-sm font-semibold">
          <span className="relative flex w-2 h-2">
            <span className="absolute inset-0 rounded-full bg-orange-400 animate-ping opacity-60" />
            <span className="relative w-2 h-2 rounded-full bg-orange-400" />
          </span>
          Voice Studio
        </div>
        <div className="mt-auto rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-3.5 text-xs text-white/55 leading-relaxed">
          <div className="flex items-center gap-1.5 text-white/80 font-semibold mb-1">
            <Database className="w-3.5 h-3.5 text-emerald-400" /> MongoDB Atlas
          </div>
          Every confirmed job is logged with HSN/SAC mapping, ready for GST filing.
        </div>
      </aside>

      {/* ------------------------------ Stage ------------------------------ */}
      <section className="lg:col-span-9 relative overflow-hidden rounded-[1.75rem] bg-[#0a0810] border border-white/10 text-white px-5 sm:px-8 pt-7 pb-6 flex flex-col items-center text-center">
        {/* aurora */}
        <div className="vo-anim pointer-events-none absolute -top-32 -left-24 w-[26rem] h-[26rem] rounded-full bg-orange-500/25 blur-[110px]" style={{ animation: "vo-float 14s ease-in-out infinite" }} />
        <div className="vo-anim pointer-events-none absolute -bottom-40 -right-24 w-[28rem] h-[28rem] rounded-full bg-rose-600/25 blur-[120px]" style={{ animation: "vo-float2 17s ease-in-out infinite" }} />
        <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 w-[30rem] h-40 bg-amber-400/10 blur-[90px]" />
        <div className="vo-grain pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay" />

        {/* status chip */}
        <div className="relative z-10 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.07] border border-white/10 backdrop-blur text-[11px] font-semibold text-white/80">
          <span className="relative flex w-2 h-2">
            <span
              className={`absolute inset-0 rounded-full animate-ping opacity-70 ${
                isRecording ? "bg-rose-400" : processingStep ? "bg-amber-300" : "bg-emerald-400"
              }`}
            />
            <span
              className={`relative w-2 h-2 rounded-full ${
                isRecording ? "bg-rose-400" : processingStep ? "bg-amber-300" : "bg-emerald-400"
              }`}
            />
          </span>
          {status}
          <span className="text-white/25">•</span>
          <span className="text-white/50 font-medium">Step 1 of 3</span>
        </div>

        <h2 className="relative z-10 mt-4 text-3xl sm:text-[2.6rem] leading-[1.05] font-extrabold tracking-tight">
          What job did you{" "}
          <span className="bg-gradient-to-r from-amber-200 via-orange-400 to-rose-400 bg-clip-text text-transparent">
            wrap up today?
          </span>
        </h2>
        <p className="relative z-10 mt-2.5 max-w-md text-sm text-white/55 leading-relaxed">
          Just talk. Speak in English or Hinglish — the agent pulls out line items, maps HSN/SAC
          codes and files the invoice.
        </p>

        {/* ---------------------------- Orb ---------------------------- */}
        <div className="relative z-10 mt-4 w-[300px] h-[300px] sm:w-[360px] sm:h-[360px]">
          {/* ripples while listening */}
          {isRecording && (
            <>
              <span className="vo-anim absolute left-1/2 top-1/2 -ml-[70px] -mt-[70px] w-[140px] h-[140px] rounded-full border border-orange-400/50" style={{ animation: "vo-ripple 2.4s ease-out infinite" }} />
              <span className="vo-anim absolute left-1/2 top-1/2 -ml-[70px] -mt-[70px] w-[140px] h-[140px] rounded-full border border-rose-400/40" style={{ animation: "vo-ripple 2.4s ease-out .8s infinite" }} />
            </>
          )}
          <canvas ref={canvasRef} className="absolute inset-0" aria-hidden="true" />

          {/* center control */}
          <button
            onClick={handleOrbAction}
            disabled={Boolean(processingStep)}
            aria-label={isRecording ? "Stop recording" : "Start voice recording"}
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[76px] h-[76px] rounded-full flex items-center justify-center border border-white/40 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,.45)] transition-all duration-300 hover:scale-110 active:scale-95 disabled:cursor-wait focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-300/60 ${
              isRecording ? "bg-rose-600/90" : "bg-black/45 hover:bg-black/60"
            }`}
          >
            {processingStep ? (
              <Loader2 className="w-7 h-7 text-amber-200 animate-spin" />
            ) : isRecording ? (
              <Square className="w-6 h-6 fill-white text-white" />
            ) : (
              <Mic className="w-7 h-7 text-white" />
            )}
          </button>
        </div>

        {/* caption / timer */}
        <div className="relative z-10 mt-1 min-h-[52px] flex flex-col items-center justify-center gap-1.5">
          {processingStep ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.07] border border-white/10 backdrop-blur">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="vo-shimmer-text text-xs font-bold tracking-wide">{processingStep}</span>
            </div>
          ) : isRecording ? (
            <>
              <div className="font-mono text-2xl font-bold tabular-nums tracking-widest text-white">
                {fmt(recordingSeconds)}
              </div>
              <div className="text-xs text-white/50">Listening… tap the orb when you're done</div>
            </>
          ) : (
            <div className={`text-sm ${captureMessage ? "text-rose-300" : "text-white/50"}`}>
              {captureMessage || <>Tap the orb and describe your job<span className="text-white/30"> — e.g. “Fixed 2 taps, ₹1,800, GST included”</span></>}
            </div>
          )}
        </div>

        {/* capability chips */}
        <div className="relative z-10 mt-3 flex flex-wrap justify-center gap-2">
          {[
            { i: <Languages className="w-3 h-3" />, t: "English + Hinglish" },
            { i: <Hash className="w-3 h-3" />, t: "Auto HSN / SAC" },
            { i: <Database className="w-3 h-3" />, t: "Saved to Atlas" },
          ].map((c) => (
            <span
              key={c.t}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-medium text-white/60 bg-white/[0.05] border border-white/10"
            >
              {c.i}
              {c.t}
            </span>
          ))}
        </div>

        {/* ------------------------- Presets ------------------------- */}
        <div className="relative z-10 w-full max-w-2xl mt-7">
          <div className="flex items-center gap-3 mb-3">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/15" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40">
              or try an instant demo
            </span>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/15" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {DEMO_PRESETS.map((preset, idx) => {
              const m = presetMeta(preset.id);
              return (
                <button
                  key={preset.id}
                  onClick={() => onPresetSelect(preset)}
                  disabled={Boolean(processingStep)}
                  style={{ animation: `vo-rise .5s ease-out ${idx * 90}ms both` }}
                  className="group relative text-left rounded-2xl p-3.5 border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/25 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none overflow-hidden"
                >
                  <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${m.tint} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  <div className="relative flex items-center justify-between">
                    <div className={`flex items-center gap-2 ${m.text}`}>
                      <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">{m.icon}</span>
                      <span className="text-sm font-bold text-white">{preset.label}</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                  </div>
                  <p className="relative mt-2.5 text-[11.5px] leading-relaxed text-white/50 group-hover:text-white/75 line-clamp-3 transition-colors">
                    &ldquo;{preset.transcript}&rdquo;
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
