import React, { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  FileText,
  Download,
  Share2,
  Plus,
  Trash2,
  QrCode,
  Pencil,
} from "lucide-react";

const TEMPLATES = [
  { id: "gst", name: "GST Pro" },
  { id: "minimal", name: "Minimal" },
  { id: "express", name: "Express" },
  { id: "artisan", name: "Artisan" },
];

export default function InvoiceWorkspace({
  invoice,
  setInvoice,
  selectedTemplate,
  setSelectedTemplate,
}) {
  const invoiceRef = useRef(null);

  const subtotal = invoice.lineItems.reduce(
    (s, i) => s + Number(i.qty) * Number(i.price),
    0
  );
  const totalTax = Math.round((subtotal * invoice.taxRatePercent) / 100);
  const grandTotal = subtotal + totalTax;
  const demoQrContent = `VOICELEDGER DEMO ONLY | ${invoice.invoiceNumber} | NOT A PAYMENT REQUEST`;

  const isDarkPaper = selectedTemplate === "express";
  const accentText = isDarkPaper ? "text-orange-300" : "text-orange-600";

  const updateLineItem = (id, field, value) => {
    setInvoice((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addLineItem = () => {
    setInvoice((prev) => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        {
          id: `item-${Date.now()}`,
          description: "New Item / Service",
          category: "LABOR",
          hsnSac: "9954",
          qty: 1,
          price: 500,
        },
      ],
    }));
  };

  const removeLineItem = (id) => {
    if (invoice.lineItems.length <= 1) return;
    setInvoice((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((i) => i.id !== id),
    }));
  };

  const handleDownloadPdf = () => {
    if (!invoiceRef.current) return;
    const previousTitle = document.title;
    document.title = invoice.invoiceNumber || "Invoice";
    window.addEventListener(
      "afterprint",
      () => {
        document.title = previousTitle;
      },
      { once: true }
    );
    window.print();
  };

  return (
    <div className="space-y-4 font-sans">
      <style>{`
        @keyframes iw-rise { from { opacity:0; transform: translateY(12px);} to { opacity:1; transform: translateY(0);} }
        .invoice-print input:focus { outline: none; box-shadow: 0 0 0 2px rgba(249,115,22,.45); border-radius: 6px; }
        @media (prefers-reduced-motion: reduce) { .iw-anim { animation: none !important; } }
      `}</style>

      {/* ------------------------ Template Toolbar ------------------------ */}
      <div className="relative overflow-hidden rounded-[1.5rem] bg-[#0a0810] border border-white/10 p-2.5 flex flex-wrap items-center justify-between gap-2 no-print">
        <div className="pointer-events-none absolute -top-10 left-1/3 w-56 h-24 rounded-full bg-orange-500/15 blur-[60px]" />

        <div className="relative flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
            <FileText className="w-4 h-4 text-orange-300" />
          </span>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.05] border border-white/10">
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => setSelectedTemplate(tpl.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                  selectedTemplate === tpl.id
                    ? "bg-gradient-to-r from-amber-300 via-orange-500 to-rose-500 text-white shadow-[0_4px_18px_rgba(251,146,60,.45)]"
                    : "text-white/55 hover:text-white hover:bg-white/10"
                }`}
              >
                {tpl.name}
              </button>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-2">
          <button
            onClick={handleDownloadPdf}
            className="px-3.5 py-2 rounded-xl bg-white/[0.07] hover:bg-white/[0.14] border border-white/10 text-white text-xs font-bold flex items-center gap-1.5 transition focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-300/30"
          >
            <Download className="w-3.5 h-3.5 text-orange-300" /> Save PDF
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              `Invoice ${invoice.invoiceNumber} for ₹${grandTotal.toLocaleString("en-IN")}. This is a demo only and not a payment request.`
            )}`}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs font-bold shadow-[0_6px_22px_rgba(16,185,129,.35)] flex items-center gap-1.5 transition hover:-translate-y-0.5"
          >
            <Share2 className="w-3.5 h-3.5" /> WhatsApp
          </a>
        </div>
      </div>

      {/* hint */}
      <div className="no-print flex items-center gap-1.5 px-2 text-[11px] text-white/40">
        <Pencil className="w-3 h-3" />
        Live preview — click any description, quantity or rate to edit it.
      </div>

      {/* --------------------- Printable Invoice Canvas --------------------- */}
      <div className="relative">
        <div className="no-print pointer-events-none absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-orange-500/20 via-rose-500/10 to-transparent blur-2xl" />
        <div
          ref={invoiceRef}
          className={`iw-anim invoice-print invoice-template-${selectedTemplate} relative rounded-3xl p-6 sm:p-8 shadow-[0_30px_80px_rgba(0,0,0,.55)] transition-all duration-300 ${
            selectedTemplate === "minimal"
              ? "bg-[#FAF8F5] text-stone-900 font-serif border border-stone-200"
              : selectedTemplate === "express"
              ? "bg-[#0d0b12] text-white border-2 border-orange-500/50"
              : selectedTemplate === "artisan"
              ? "bg-[#f3f7ee] text-emerald-950 border border-emerald-200 border-t-8 border-t-emerald-700"
              : "bg-white text-slate-900 border border-slate-100 border-t-8 border-t-orange-500"
          }`}
          style={{ animation: "iw-rise .5s ease-out both" }}
        >
          <div className="flex justify-between items-start pb-6 border-b border-current/10">
            <div>
              <h3 className="text-xl font-extrabold">{invoice.businessName}</h3>
              <p className="text-xs opacity-70">GSTIN: {invoice.businessGstin}</p>
            </div>
            <div className="text-right text-xs space-y-0.5">
              <div className="font-mono font-bold">{invoice.invoiceNumber}</div>
              <div className="opacity-70">{invoice.date}</div>
              <div className="font-bold mt-1">To: {invoice.client.name}</div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-current/15 opacity-70 uppercase text-[10px]">
                  <th className="py-2">Description</th>
                  <th className="py-2 text-center w-12">Qty</th>
                  <th className="py-2 text-right w-20">Rate</th>
                  <th className="py-2 text-right w-20">Total</th>
                  <th className="w-6 no-print"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-current/10">
                {invoice.lineItems.map((item) => (
                  <tr key={item.id} className="group">
                    <td className="py-3">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) =>
                          updateLineItem(item.id, "description", e.target.value)
                        }
                        className="w-full bg-transparent font-medium focus:outline-none focus:underline"
                      />
                    </td>
                    <td className="py-3 text-center">
                      <input
                        type="number"
                        value={item.qty}
                        onChange={(e) =>
                          updateLineItem(item.id, "qty", Number(e.target.value))
                        }
                        className="w-12 text-center bg-current/5 rounded py-0.5"
                      />
                    </td>
                    <td className="py-3 text-right">
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) =>
                          updateLineItem(item.id, "price", Number(e.target.value))
                        }
                        className="w-16 text-right bg-current/5 rounded py-0.5 px-1"
                      />
                    </td>
                    <td className="py-3 text-right font-bold">
                      ₹{item.qty * item.price}
                    </td>
                    <td className="py-3 text-right no-print">
                      <button
                        onClick={() => removeLineItem(item.id)}
                        aria-label="Remove line item"
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-rose-500 hover:text-rose-600 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button
              onClick={addLineItem}
              className={`mt-3 inline-flex items-center gap-1 text-xs font-bold hover:opacity-80 transition no-print ${accentText}`}
            >
              <Plus className="w-3.5 h-3.5" /> Add Line Item
            </button>
          </div>

          {/* QR Code + Totals */}
          <div className="mt-6 pt-5 border-t border-current/15 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-current/5 border border-current/10">
              <div className="p-1 rounded-lg bg-white">
                <QRCodeSVG value={demoQrContent} size={64} level="M" />
              </div>
              <div className="text-[11px] space-y-0.5">
                <div className="font-bold flex items-center gap-1">
                  <QrCode className={`w-3.5 h-3.5 ${accentText}`} /> Demo QR only
                </div>
                <div className="font-bold text-rose-600">Not payable</div>
              </div>
            </div>

            <div className="w-full sm:w-52 space-y-1 text-xs">
              <div className="flex justify-between opacity-75">
                <span>Subtotal:</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between opacity-75">
                <span>GST ({invoice.taxRatePercent}%):</span>
                <span>₹{totalTax.toLocaleString("en-IN")}</span>
              </div>
              <div className="pt-2 border-t border-current/15 flex justify-between font-extrabold text-sm">
                <span>Grand Total:</span>
                <span className={accentText}>₹{grandTotal.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}