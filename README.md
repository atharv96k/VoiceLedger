<div align="center">

<img src="client/public/Logo.png" alt="ColdOpen" width="420" />

### Open-Source AI Voice-to-Invoice & GST Tax Engine for Independent Contractors

<p align="center">
  <img src="https://img.shields.io/badge/Hacktoberfest-2026-ff6b35?style=flat-square" alt="Hacktoberfest 2026" />
  <img src="https://img.shields.io/badge/AI-Gemma%202%20%7C%20Llama%203.3-4285F4?style=flat-square" alt="Gemma 2 & Llama 3.3" />
  <img src="https://img.shields.io/badge/Speech-ElevenLabs%20Scribe-f1e05a?style=flat-square" alt="ElevenLabs Scribe" />
  <img src="https://img.shields.io/badge/React-Vite%20%7C%20Tailwind%20v4-61dafb?style=flat-square" alt="React Vite" />
  <img src="https://img.shields.io/badge/Node-Express%20%7C%20MongoDB-339933?style=flat-square" alt="Node Express MongoDB" />
  <img src="https://img.shields.io/badge/Tracing-Sentry-362d59?style=flat-square" alt="Sentry Agent Tracing" />
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License" />
</p>

VoiceLedger converts unstructured English and Hinglish voice notes into HSN/SAC-compliant GST invoices, automated tax ledgers, and scannable UPI QR payments in under two seconds.

[Overview](#overview) • [Architecture](#system-architecture) • [API Reference](#api-reference) • [Setup](#local-development-setup)

</div>

---

## Overview

Independent contractors plumbers, electricians, event photographers, mechanics, and home bakers frequently lose billable hours to manual evening paperwork, itemized quoting, and quarterly tax reconciliation. 

**VoiceLedger** eliminates manual data entry through a 5-stage open-weight AI agent pipeline. A contractor records a quick voice memo after finishing a job (or selects a pre-configured workflow preset). The backend transcribes the audio via **ElevenLabs Scribe**, retrieves repeat client billing records from **MongoDB Atlas**, extracts a strict JSON schema using open-weight **Google Gemma 2 (`gemma2-9b-it`)** or **Meta Llama 3.3 (`llama-3.3-70b-versatile`)**, verifies line-item arithmetic deterministically, and returns an editable multi-template invoice with a live UPI payment QR code and spoken audio confirmation.

### Why Open-Weight Innovation Matters

* **Unit Economics:** Closed frontier audio-and-reasoning pipelines cost approximately `$0.034` per multi-step extraction run. By pairing open-weight `gemma2-9b-it` / `llama-3.3-70b` inference with deterministic JavaScript math guardrails, VoiceLedger reduces per-invoice inference cost to `~$0.00011`, sustaining a **98.8% gross margin** on a flat `$9/month` subscription.
* **Zero Hallucinated Arithmetic:** Rather than relying on LLMs for tax math, the model only extracts `qty`, `price`, `category` (`MATERIALS` vs. `LABOR`), and `hsnSac` codes. The Express backend and React state compute subtotals, CGST/SGST splits, and grand totals deterministically.
* **Code-Switching & Regional Context:** Open-weight system prompts are tuned specifically for Indian contractor workflows, handling mixed Hinglish input, GST slabs (0%, 5%, 12%, 18%), and HSN/SAC classification out of the box.

---

## Key Features

* **Organic Voice Studio (`GeminiVoiceOrb.jsx`):** Browser-native `MediaRecorder` audio capture (`audio/webm`) paired with an interactive liquid-gradient sphere, live recording timer, and 1-click judge demo presets for microphone-free evaluation[cite: 5, 12, 20].
* **Client Context RAG (`MongoDB Atlas`):** Automatically fuzzy-matches spoken client names and aliases (e.g., *"Sharma ji"* $\rightarrow$ *Rajesh Sharma*) against the MongoDB `clients` collection to inject saved addresses, phone numbers, GSTINs, and default hourly rates into the LLM context window[cite: 5, 20].
* **Multi-Template Live Invoice Canvas (`InvoiceWorkspace.jsx`):**
  * **GST Pro:** Full compliance layout displaying `MATERIALS` vs. `LABOR` badges, HSN/SAC codes, and split CGST/SGST summaries[cite: 5, 20].
  * **Minimal Studio:** Clean editorial serif layout tailored for photographers, designers, and consultants[cite: 5, 20].
  * **Express Receipt:** High-contrast dark card designed for quick mobile billing and WhatsApp sharing[cite: 5, 20].
* **Dynamic Vector UPI QR & Instant Export:** Generates real-time SVG QR codes (`upi://pay?pa=...`) via `qrcode.react` that recalculate on every keystroke, paired with 1-click A4 PDF generation (`html2pdf.js`) and formatted WhatsApp deep links[cite: 5, 20].
* **Full-Stack Agent Observability (`Sentry`):** Instrumented via `@sentry/node` (`instrument.js`) to trace root pipeline transactions (`voice_to_invoice_agent`) and child spans across STT, database lookup, LLM extraction, and TTS synthesis[cite: 5, 20].
* **Interactive Tax Ledger Drawer (`LedgerDrawer.jsx`):** Slide-over panel with mouse-responsive spotlight gradients displaying total billed volume, accumulated GST, and persisted MongoDB invoice records[cite: 18, 20].

---

## System Architecture

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                        CLIENT (React + Vite + Tailwind v4)                 │
│  • Captures audio/webm via MediaRecorder or triggers Demo Preset           │
│  • Dispatches multipart/form-data POST to /api/voice-invoice               │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                     SERVER (Node.js + Express + Sentry)                    │
│  Root Transaction: "voice_to_invoice_agent" (op: "agent.pipeline")         │
│                                                                            │
│  ├─► Span 1: elevenlabs.scribe_stt (op: "ai.stt")                          │
│  │     Uploads audio buffer in memory via Multer to ElevenLabs scribe_v1   │
│  │                                                                         │
│  ├─► Span 2: mongodb.client_rag_lookup (op: "db.query")                    │
│  │     Matches transcript against Client schema names & aliases            │
│  │                                                                         │
│  ├─► Span 3: gemma.structured_invoice_extraction (op: "ai.chat_completions")│
│  │     Calls gemma2-9b-it / llama-3.3-70b-versatile in strict JSON mode    │
│  │     + Applies deterministic JS math guardrails for subtotal & GST       │
│  │                                                                         │
│  ├─► Span 4: elevenlabs.flash_tts (op: "ai.tts")                           │
│  │     Synthesizes spoken confirmation via eleven_flash_v2_5 (Base64 MP3)  │
│  │                                                                         │
│  └─► Persistence: Saves validated document to MongoDB Invoice collection   │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                        WORKSPACE RENDER & EXPORT                           │
│  • Auto-plays ElevenLabs audio confirmation (with Web Speech API fallback) │
│  • Populates inline-editable invoice table + dynamic UPI QR code           │
│  • Renders Sentry Trace ID, latency (ms), token count, and open-weight ROI │
└────────────────────────────────────────────────────────────────────────────┘

```
---

## Tech Stack

### Frontend (`/client`)

* **Framework:** React 19, Vite


* **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`), custom CSS glassmorphism utilities (`glass-panel`, `glass-card`, `glass-pill`), Google Fonts (`Poppins`)


* **Icons & UI:** `lucide-react`, `canvas-confetti`

* **Payments & Document Generation:** `qrcode.react` (SVG UPI QR generation), `html2pdf.js` (client-side A4 PDF rendering)


* **HTTP Client:** `axios`


### Backend (`/server`)

* **Runtime & Server:** Node.js (ES Modules), Express


* **AI Inference:** Open-weight `gemma2-9b-it` and `llama-3.3-70b-versatile` served via Groq REST API (`response_format: { type: "json_object" }`)
* **Speech Pipeline:** ElevenLabs Speech-to-Text (`scribe_v1`) and Text-to-Speech (`eleven_flash_v2_5`)
* **Database:** MongoDB Atlas with Mongoose ODM (`client.js`, `invoice.js`)


* **File Handling:** `multer` (in-memory buffer storage), `form-data`

* **Observability:** `@sentry/node` agent tracing and span instrumentation



---

## Database Schemas

### 1. Client Schema (`server/models/client.js`)

Stores repeat customer details for RAG lookup during voice transcription analysis.

* `name` (`String`, required, indexed): Full legal or billing name.
* `aliases` (`[String]`): Spoken shorthand or nicknames (e.g., `["sharma", "sharma ji", "rajesh"]`).
* `phone` (`String`): Client contact number.
* `address` (`String`): Billing address injected into the invoice header.
* `gstin` (`String`, default: `"Unregistered / B2C"`): Client GST Identification Number.
* `defaultHourlyRate` (`Number`, default: `500`): Contractor's standard rate for this client.

### 2. Invoice Schema (`server/models/invoice.js`)

Stores finalized invoices, tax splits, and execution telemetry.

* `invoiceNumber` (`String`, required): Generated identifier (e.g., `INV-2026-0842`).


* `date` (`String`, required): Formatted billing date.
* `businessName`, `businessGstin`, `upiId` (`String`): Contractor's merchant details.
* `client` (`Object`): Nested snapshot (`name`, `phone`, `address`, `gstin`, `matchedFromDb`).
* `taxRatePercent` (`Number`): Applicable GST slab (`0`, `5`, `12`, `18`).
* `lineItems` (`Array`): Structured items containing `id`, `description`, `category` (`MATERIALS` | `LABOR`), `hsnSac`, `qty`, and `price`.
* `subtotal`, `totalTax`, `grandTotal` (`Number`): Deterministically computed totals.
* `transcript` (`String`): Raw voice transcript.
* `telemetry` (`Object`): Execution metrics (`model`, `sentryTraceId`, `latencyMs`, `tokens`, `openCost`).

---

## API Reference

### `POST /api/voice-invoice`

Processes a recorded voice note through the 4-span AI agent pipeline and persists the resulting invoice.

* **Content-Type:** `multipart/form-data`
* **Form Fields:**
* `audio` (`File` / `Blob`, optional): Recorded `.webm` audio file from `MediaRecorder`. If omitted, the server uses a default fallback transcript for testing.
* `model` (`String`, optional): Target open-weight model identifier (`google/gemma-2-9b-it`, `google/gemma-3-27b-it`, or `meta/llama-3.3-70b`).


* **Response (`200 OK`):**
```json
{
  "success": true,
  "transcript": "Sharma ji ka 2 copper valve change kiya, 1400 parts ka laga, aur 2 ghante fitting labor at my standard 500 rate. 18% GST laga ke bill bana do.",
  "ttsText": "Got it! Invoice for Rajesh Sharma comes to 2832 rupees including 18% GST.",
  "base64Audio": "data:audio/mpeg;base64,...",
  "invoice": {
    "invoiceNumber": "INV-2026-4821",
    "date": "18 Oct 2026",
    "documentType": "TAX_INVOICE",
    "businessName": "Mohite Plumbing & Electrical Works",
    "businessGstin": "27AABCM8492R1Z5",
    "businessPhone": "+91 98231 55001",
    "upiId": "mohite.works@okaxis",
    "client": {
      "name": "Rajesh Sharma",
      "phone": "+91 98230 44120",
      "address": "Flat 402, Green Valley Society, Kothrud, Pune",
      "gstin": "27AAECS1209F1Z8",
      "matchedFromDb": true
    },
    "taxRatePercent": 18,
    "notes": "Payment due upon receipt.",
    "lineItems": [
      {
        "id": "item-1760790000-0",
        "description": "Copper Valves Replacement",
        "category": "MATERIALS",
        "hsnSac": "8481",
        "qty": 2,
        "price": 700
      },
      {
        "id": "item-1760790000-1",
        "description": "Fitting Labor",
        "category": "LABOR",
        "hsnSac": "9954",
        "qty": 2,
        "price": 500
      }
    ]
  },
  "telemetry": {
    "model": "google/gemma-2-9b-it",
    "sentryTraceId": "a1b2c3d4e5f60718",
    "latencyMs": 412,
    "sttLatencyMs": 520,
    "dbLookupMs": 64,
    "tokens": 486,
    "openCost": "$0.00010",
    "closedCost": "$0.03400"
  }
}

```



### `GET /api/ledger`

Retrieves the 20 most recent invoices stored in MongoDB Atlas, sorted by `createdAt` descending.

* **Response (`200 OK`):**
```json
{
  "items": [ ... ]
}

```



---

## Local Development Setup

### Prerequisites

* **Node.js:** v18.0.0 or higher (tested on Node.js v24)
* **MongoDB Atlas:** Connection URI (optional for initial testing; server includes graceful in-memory fallback)
* **API Keys:** Groq API key (`GROQ_API_KEY`), ElevenLabs API key (`ELEVENLABS_API_KEY`), and Sentry DSN (`SENTRY_DSN`)

### 1. Clone the Repository

```bash
git clone [https://github.com/atharv96k/voiceledger.git](https://github.com/atharv96k/voiceledger.git)
cd voiceledger

```

### 2. Configure & Start the Backend (`/server`)

```bash
cd server
npm install

```

Create a `.env` file inside the `server/` directory:

```env
PORT=5000
NODE_ENV=development

# Open-Weight LLM Inference (Groq API)
GROQ_API_KEY=gsk_your_groq_api_key_here

# ElevenLabs Speech-to-Text (Scribe) & Flash TTS
ELEVENLABS_API_KEY=sk_your_elevenlabs_api_key_here
ELEVENLABS_VOICE_ID=JBFqnCBsd6RMkjVDRZzb

# MongoDB Atlas Connection URI
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/voiceledger?retryWrites=true&w=majority

# Sentry Agent Tracing DSN
SENTRY_DSN=[https://yourPublicKey@o0.ingest.sentry.io/0](https://yourPublicKey@o0.ingest.sentry.io/0)

```

(Note: Ensure your ElevenLabs API key has both **Speech to Text** and **Text to Speech** permissions enabled, and do not wrap your MongoDB password in `<` or `>` brackets).

Start the backend with Sentry preload instrumentation:

```bash
npm run dev

```

The server will start on `http://localhost:5000` and automatically seed two default contractor clients (*Rajesh Sharma* and *Priya Deshmukh*) if the `clients` collection is empty.

### 3. Configure & Start the Frontend (`/client`)

Open a second terminal window:

```bash
cd client
npm install

```

Create a `.env` file inside the `client/` directory:

```env
VITE_API_BASE_URL=http://localhost:5000

```

Start the Vite development server:

```bash
npm run dev

```

Open `http://localhost:5173` in your browser.

---

## Built-In Test Scenarios

You can test the live voice pipeline by speaking any of the following prompts into the microphone or clicking the preset cards on the dashboard:

1. **Plumber & Electrical (Hinglish + 18% GST):**
> *"Sharma ji ka 2 copper valve change kiya, 1400 parts ka laga, aur 2 ghante fitting labor at my standard 500 rate. 18% GST laga ke bill bana do."*
> 


2. **Wedding Photographer (Service SAC + 18% GST):**
> *"Bill Priya Deshmukh for the pre-wedding shoot in Kolhapur. 6 hours coverage at 2500 per hour, plus 4000 for drone reel editing. Add 18% GST."*
> 


3. **Artisanal Home Baker (B2C + 5% Food GST):**
> *"Create an order bill for Neha Kulkarni: 2 kg Belgian chocolate truffle cake at 1200 per kg, and 12 assorted artisanal cupcakes at 90 each. Apply 5% GST."*
> 



---

## License

Distributed under the **MIT License**.

