// src/App.jsx
import React, { useCallback, useEffect, useState } from "react";
import confetti from "canvas-confetti";
import Navbar from "./components/Navbar";
import GeminiVoiceOrb from "./components/GeminiVoiceOrb";
import CoPilotSidebar from "./components/CoPilotSidebar";
import InvoiceWorkspace from "./components/InvoiceWorkspace";
import LedgerDrawer from "./components/LedgerDrawer";
import { DEMO_PRESETS, INITIAL_LEDGER_HISTORY } from "./data/demoPresets";
import { fetchLedger, processVoiceInvoice, saveInvoiceToLedger } from "./services/api";

export default function App() {
  const [viewMode, setViewMode] = useState("home"); // "home" | "workspace"
  const [activeModel, setActiveModel] = useState("openai/gpt-oss-120b");
  const [selectedTemplate, setSelectedTemplate] = useState("gst");
  const [processingStep, setProcessingStep] = useState(null);

  const [transcript, setTranscript] = useState(DEMO_PRESETS[0].transcript);
  const [ttsText, setTtsText] = useState(DEMO_PRESETS[0].ttsText);
  const [base64Audio, setBase64Audio] = useState(null);
  const [invoice, setInvoice] = useState(structuredClone(DEMO_PRESETS[0].invoice));
  const [telemetry, setTelemetry] = useState(DEMO_PRESETS[0].telemetry);

  const [ledgerItems, setLedgerItems] = useState(INITIAL_LEDGER_HISTORY);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [ledgerView, setLedgerView] = useState("invoices");
  const [isSavedToLedger, setIsSavedToLedger] = useState(false);

  const refreshLedger = useCallback(async () => {
    try {
      const items = await fetchLedger();
      setLedgerItems(items.map((item) => {
        const subtotal = Number(item.subtotal ?? item.lineItems?.reduce((sum, row) => sum + row.qty * row.price, 0) ?? 0);
        const gstCollected = Number(item.totalTax ?? Math.round(subtotal * Number(item.taxRatePercent || 0) / 100));
        const materials = (item.lineItems || []).filter((row) => row.category === "MATERIALS").reduce((sum, row) => sum + row.qty * row.price, 0);
        return {
          id: item.invoiceNumber || item._id,
          clientName: item.client?.name || "Client",
          date: item.date,
          categorySplit: `Materials: ₹${materials.toLocaleString("en-IN")} | Labor: ₹${(subtotal - materials).toLocaleString("en-IN")}`,
          gstCollected,
          grandTotal: Number(item.grandTotal ?? subtotal + gstCollected),
          subtotal,
          taxRatePercent: Number(item.taxRatePercent || 0),
          status: item.status || "LOGGED",
        };
      }));
    } catch (error) {
      console.error("Could not refresh tax ledger:", error.message);
    }
  }, []);

  useEffect(() => { refreshLedger(); }, [refreshLedger]);

  const openLedger = (view = "invoices") => {
    setLedgerView(view);
    setIsLedgerOpen(true);
    refreshLedger();
  };

  const executePipeline = async ({ audioBlob = null, preset = null }) => {
    const steps = [
      "Span 1: ElevenLabs Scribe STT transcribing audio...",
      "Span 2: MongoDB Atlas matching client & rates...",
      `Span 3: ${activeModel} extracting HSN/SAC & GST schema...`,
      "Span 4: Generating ElevenLabs voice confirmation & UPI QR...",
    ];

    setProcessingStep(steps[0]);
    for (let i = 1; i < steps.length; i++) {
      await new Promise((r) => setTimeout(r, 350));
      setProcessingStep(steps[i]);
    }

    let result;
    try {
      result = await processVoiceInvoice({ audioBlob, activeModel, presetFallback: preset });
    } catch (error) {
      setProcessingStep(null);
      window.alert(error.message || "Could not process the recording. Please try again.");
      return;
    }

    setProcessingStep(null);
    setTranscript(result.transcript);
    setTtsText(result.ttsText);
    setBase64Audio(result.base64Audio);
    setInvoice(result.invoice);
    setTelemetry(result.telemetry);
    setIsSavedToLedger(false);
    setViewMode("workspace");
    refreshLedger();
  };

  const handleSaveToLedger = async () => {
    try {
      await saveInvoiceToLedger(invoice);
      await refreshLedger();
      setIsSavedToLedger(true);
      confetti({
        particleCount: 70,
        spread: 75,
        origin: { y: 0.6 },
        colors: ["#fbbf24", "#f97316", "#f43f5e", "#ffffff"],
      });
    } catch (error) {
      console.error("Could not save invoice to tax ledger:", error.response?.data?.error || error.message);
      window.alert(error.response?.data?.error || "Could not save invoice to the tax ledger.");
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-y-auto bg-[#050408] p-3 sm:p-4 lg:p-6 flex flex-col items-center font-sans">
      {/* page-level ambient glow */}
      <div className="pointer-events-none fixed -top-40 left-1/4 w-[40rem] h-[40rem] rounded-full bg-orange-600/15 blur-[140px]" />
      <div className="pointer-events-none fixed -bottom-48 right-1/4 w-[40rem] h-[40rem] rounded-full bg-rose-600/15 blur-[150px]" />

      {/* Zoom-safe fluid outer container */}
      <div className="relative w-full max-w-[1400px] rounded-[2rem] bg-[#13101b]/90 border border-white/10 backdrop-blur-xl p-4 sm:p-6 flex flex-col shadow-[0_30px_120px_rgba(0,0,0,0.65)] my-auto">
        <Navbar
          viewMode={viewMode}
          setViewMode={setViewMode}
          activeModel={activeModel}
          setActiveModel={setActiveModel}
          ledgerCount={ledgerItems.length}
          onOpenLedger={() => openLedger("invoices")}
        />

        <div className="flex-1 pt-4">
          {viewMode === "home" ? (
            <GeminiVoiceOrb
              processingStep={processingStep}
              onVoiceCaptured={(blob) => executePipeline({ audioBlob: blob })}
              onPresetSelect={(preset) => executePipeline({ preset })}
            />
          ) : (
            <main className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-5">
                <CoPilotSidebar
                  transcript={transcript}
                  ttsText={ttsText}
                  base64Audio={base64Audio}
                  invoice={invoice}
                  setInvoice={setInvoice}
                  telemetry={telemetry}
                  onSaveToLedger={handleSaveToLedger}
                  isSaved={isSavedToLedger}
                />
              </div>
              <div className="lg:col-span-7">
                <InvoiceWorkspace
                  invoice={invoice}
                  setInvoice={setInvoice}
                  selectedTemplate={selectedTemplate}
                  setSelectedTemplate={setSelectedTemplate}
                />
              </div>
            </main>
          )}
        </div>

        <LedgerDrawer
          isOpen={isLedgerOpen}
          onClose={() => setIsLedgerOpen(false)}
          ledgerItems={ledgerItems}
          view={ledgerView}
        />
      </div>
    </div>
  );
}
