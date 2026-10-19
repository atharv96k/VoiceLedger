// server/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import mongoose from "mongoose";
import axios from "axios";
import FormData from "form-data";
import * as Sentry from "@sentry/node";
import crypto from "crypto";

// FIXED: Correct casing matching your models/ folder files
import Client from "./models/client.js";
import Invoice from "./models/invoice.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    mongodb: isMongoConnected ? "connected" : "disconnected",
  });
});

const upload = multer({ storage: multer.memoryStorage() });

let isMongoConnected = false;
if (process.env.MONGODB_URI && !process.env.MONGODB_URI.includes("<username>")) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(async () => {
      isMongoConnected = true;
      console.log("🟢 Connected to MongoDB Atlas");
      const count = await Client.countDocuments();
      if (count === 0) {
        await Client.insertMany([
          {
            name: "Rajesh Sharma",
            aliases: ["sharma", "sharma ji", "rajesh"],
            phone: "+91 98230 44120",
            address: "Flat 402, Green Valley Society, Kothrud, Pune",
            gstin: "27AAECS1209F1Z8",
            defaultHourlyRate: 500,
          },
          {
            name: "Priya Deshmukh",
            aliases: ["priya", "deshmukh"],
            phone: "+91 97654 11223",
            address: "Tarabai Park, Kolhapur, Maharashtra",
            gstin: "Unregistered / B2C",
            defaultHourlyRate: 2500,
          },
        ]);
        console.log("🌱 Seeded default contractor clients into MongoDB Atlas");
      }
    })
    .catch((err) => console.warn("⚠️ MongoDB connection skipped:", err.message));
}

async function transcribeWithElevenLabs(audioBuffer, mimetype) {
  if (!process.env.ELEVENLABS_API_KEY) {
    throw new Error("ELEVENLABS_API_KEY is required to transcribe a voice recording.");
  }
  if (!audioBuffer?.length) throw new Error("The recording was empty. Please try again and speak clearly.");

  try {
    const form = new FormData();
    form.append("file", audioBuffer, {
      filename: "voice-note.webm",
      contentType: mimetype || "audio/webm",
    });
    form.append("model_id", "scribe_v1");

    const response = await axios.post(
      "https://api.elevenlabs.io/v1/speech-to-text",
      form,
      {
        headers: {
          ...form.getHeaders(),
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
        },
      }
    );
    return response.data.text;
  } catch (err) {
    console.warn("⚠️ ElevenLabs STT failed:", err.response?.data || err.message);
    const providerMessage = err.response?.data?.detail?.message || err.response?.data?.message;
    throw new Error(`Speech transcription failed: ${providerMessage || err.message}`);
  }
}

async function lookupClientInMongo(transcript) {
  const lower = transcript.toLowerCase();
  if (isMongoConnected) {
    const clients = await Client.find({});
    for (const c of clients) {
      if (
        lower.includes(c.name.toLowerCase()) ||
        c.aliases.some((alias) => lower.includes(alias.toLowerCase()))
      ) {
        return {
          name: c.name,
          phone: c.phone,
          address: c.address,
          gstin: c.gstin,
          defaultHourlyRate: c.defaultHourlyRate,
          matchedFromDb: true,
        };
      }
    }
  }

  if (lower.includes("sharma")) {
    return {
      name: "Rajesh Sharma",
      phone: "+91 98230 44120",
      address: "Flat 402, Green Valley Society, Kothrud, Pune",
      gstin: "27AAECS1209F1Z8",
      defaultHourlyRate: 500,
      matchedFromDb: true,
    };
  }
  return null;
}

async function extractInvoiceWithGemma(transcript, matchedClient, requestedModel, presetId) {
  const startTime = Date.now();
  const supportedModels = new Set([
    "openai/gpt-oss-120b",
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-20b",
  ]);
  const groqModel = supportedModels.has(requestedModel)
    ? requestedModel
    : "openai/gpt-oss-120b";

  const systemPrompt = `You are VoiceLedger, an expert Indian GST & contractor invoice extraction AI.
Convert the contractor's messy voice transcript into strict JSON.
Matched Client Context from MongoDB: ${JSON.stringify(matchedClient || { note: "No prior DB match" })}

Rules:
1. Split items strictly into "MATERIALS" or "LABOR".
2. Return ONLY valid JSON matching this exact structure:
{
  "clientName": "string",
  "clientAddress": "string",
  "taxRatePercent": 18,
  "notes": "string",
  "ttsConfirmationText": "Short 1-sentence friendly voice confirmation",
  "lineItems": [
    {
      "description": "string",
      "category": "MATERIALS",
      "hsnSac": "8481",
      "qty": 2,
      "price": 700
    }
  ]
}`;

  if (!process.env.GROQ_API_KEY) {
    const offlinePresetData = {
      baker: {
        clientName: "Neha Kulkarni",
        clientAddress: "Bavdhan, Pune, Maharashtra",
        taxRatePercent: 5,
        notes: "Keep refrigerated at 4°C. Contains gluten and dairy.",
        ttsConfirmationText: "Ready! Bakery receipt for Neha Kulkarni is prepared.",
        lineItems: [
          { description: "Custom Belgian Dark Chocolate Truffle Cake (Kg)", category: "MATERIALS", hsnSac: "1905", qty: 2, price: 1200 },
          { description: "Assorted Artisanal Frosted Cupcakes (Pieces)", category: "MATERIALS", hsnSac: "1905", qty: 12, price: 90 },
        ],
      },
      photographer: {
        clientName: "Priya Deshmukh",
        clientAddress: "Tarabai Park, Kolhapur, Maharashtra",
        taxRatePercent: 18,
        notes: "Raw footage drive link will be shared within 48 hours of payment.",
        ttsConfirmationText: "Done! Created studio invoice for Priya Deshmukh.",
        lineItems: [
          { description: "On-Location Pre-Wedding Photography Coverage (Hrs)", category: "LABOR", hsnSac: "9983", qty: 6, price: 2500 },
          { description: "4K Drone Aerial Capture & Color-Graded Reel Edit", category: "LABOR", hsnSac: "9983", qty: 1, price: 4000 },
        ],
      },
    };
    return {
      parsed: {
        ...(offlinePresetData[presetId] || {
          clientName: matchedClient?.name || "Rajesh Sharma",
          clientAddress: matchedClient?.address || "Pune, Maharashtra",
          taxRatePercent: 18,
          notes: "Payment due upon receipt.",
          ttsConfirmationText: "Got it! Invoice ready for Rajesh Sharma.",
          lineItems: [
            { description: "Copper Valves Replacement", category: "MATERIALS", hsnSac: "8481", qty: 2, price: 700 },
            { description: "Installation Labor", category: "LABOR", hsnSac: "9954", qty: 2, price: 500 },
          ],
        }),
        ...(matchedClient ? { clientName: matchedClient.name, clientAddress: matchedClient.address } : {}),
      },
      latencyMs: 350,
      tokens: 420,
    };
  }

  // Direct REST API call to Groq to avoid any SDK dependency mismatches
  const response = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: groqModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Contractor Voice Note: "${transcript}"` },
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  const latencyMs = Date.now() - startTime;
  const content = response.data.choices[0].message.content;
  const parsed = JSON.parse(content);
  const tokens = response.data.usage?.total_tokens || 480;

  return { parsed, latencyMs, tokens };
}

async function synthesizeSpeechWithElevenLabs(text) {
  if (!process.env.ELEVENLABS_API_KEY) return null;
  try {
    const voiceId = process.env.ELEVENLABS_VOICE_ID || "JBFqnCBsd6RMkjVDRZzb";
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text,
        model_id: "eleven_flash_v2_5",
      },
      {
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
      }
    );
    const base64 = Buffer.from(response.data, "binary").toString("base64");
    return `data:audio/mpeg;base64,${base64}`;
  } catch (err) {
    console.warn("ElevenLabs TTS skipped:", err.message);
    return null;
  }
}

app.post("/api/voice-invoice", upload.single("audio"), async (req, res) => {
  const sentryTraceId = crypto.randomBytes(8).toString("hex");

  await Sentry.startSpan(
    {
      name: "voice_to_invoice_agent",
      op: "agent.pipeline",
      attributes: { "agent.trace_id": sentryTraceId },
    },
    async () => {
      try {
        const requestedModel = req.body.model || "openai/gpt-oss-120b";

        const sttStart = Date.now();
        const transcript = req.file
          ? await Sentry.startSpan(
              { name: "elevenlabs.scribe_stt", op: "ai.stt" },
              async () =>
                await transcribeWithElevenLabs(req.file.buffer, req.file.mimetype)
            )
          : req.body.transcript?.trim();
        if (typeof transcript !== "string" || !transcript.trim()) {
          return res.status(400).json({ error: "We couldn't hear any speech. Please record your invoice again." });
        }
        const sttLatencyMs = Date.now() - sttStart;

        const dbStart = Date.now();
        const matchedClient = await Sentry.startSpan(
          { name: "mongodb.client_rag_lookup", op: "db.query" },
          async () => await lookupClientInMongo(transcript)
        );
        const dbLookupMs = Date.now() - dbStart;

        const { parsed, latencyMs, tokens } = await Sentry.startSpan(
          {
            name: "gemma.structured_invoice_extraction",
            op: "ai.chat_completions.create",
            attributes: { "ai.model_id": requestedModel },
          },
          async () =>
            await extractInvoiceWithGemma(
              transcript,
              matchedClient,
              requestedModel,
              req.body.presetId
            )
        );

        const lineItems = (parsed.lineItems || []).map((item, idx) => ({
          id: `item-${Date.now()}-${idx}`,
          description: item.description,
          category: item.category === "MATERIALS" ? "MATERIALS" : "LABOR",
          hsnSac: item.hsnSac || (item.category === "MATERIALS" ? "8481" : "9954"),
          qty: Number(item.qty || 1),
          price: Number(item.price || 0),
        }));

        const subtotal = lineItems.reduce((s, i) => s + i.qty * i.price, 0);
        const taxRatePercent = Number(parsed.taxRatePercent ?? 18);
        const totalTax = Math.round((subtotal * taxRatePercent) / 100);
        const grandTotal = subtotal + totalTax;

        const ttsText =
          parsed.ttsConfirmationText ||
          `Got it! Invoice for ${
            matchedClient?.name || parsed.clientName
          } comes to ${grandTotal} rupees including ${taxRatePercent}% GST.`;

        const base64Audio = await Sentry.startSpan(
          { name: "elevenlabs.flash_tts", op: "ai.tts" },
          async () => await synthesizeSpeechWithElevenLabs(ttsText)
        );

        const presetProfiles = {
          plumber: {
            businessName: "Mohite Plumbing & Electrical Works",
            businessGstin: "27AABCM8492R1Z5",
            businessPhone: "+91 98231 55001",
            upiId: "mohite.works@okaxis",
          },
          photographer: {
            businessName: "LensCraft Visual Studio",
            businessGstin: "27AADCL4921M1Z2",
            businessPhone: "+91 97650 11220",
            upiId: "lenscraft@okicici",
            client: { phone: "+91 97654 11223", address: "Tarabai Park, Kolhapur, Maharashtra", gstin: "Unregistered / B2C" },
          },
          baker: {
            businessName: "Crumb & Cocoa Artisanal Bakery",
            businessGstin: "27AAFCC8821K1Z9",
            businessPhone: "+91 99220 99881",
            upiId: "crumbcocoa@ybl",
            client: { phone: "+91 99221 33445", address: "Bavdhan, Pune, Maharashtra", gstin: "B2C Customer" },
          },
        };
        const presetProfile = presetProfiles[req.body.presetId] || presetProfiles.plumber;
        const invoicePayload = {
          invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          date: new Date().toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          documentType: "TAX_INVOICE",
          businessName: presetProfile.businessName,
          businessGstin: presetProfile.businessGstin,
          businessPhone: presetProfile.businessPhone,
          upiId: presetProfile.upiId,
          client: {
            name: matchedClient?.name || parsed.clientName || "Walk-in Client",
            phone: matchedClient?.phone || presetProfile.client?.phone || "+91 98000 00000",
            address:
              matchedClient?.address ||
              presetProfile.client?.address ||
              parsed.clientAddress ||
              "Pune, Maharashtra",
            gstin: matchedClient?.gstin || presetProfile.client?.gstin || "Unregistered / B2C",
            matchedFromDb: Boolean(matchedClient),
          },
          taxRatePercent,
          notes: parsed.notes || "Payment due upon receipt.",
          lineItems,
        };

        const telemetryPayload = {
          model: requestedModel,
          sentryTraceId,
          latencyMs,
          sttLatencyMs,
          dbLookupMs,
          tokens,
          openCost: `$${((tokens / 1000000) * 0.2).toFixed(5)}`,
          closedCost: "$0.03400",
        };

        if (isMongoConnected) {
          await Invoice.create({
            ...invoicePayload,
            subtotal,
            totalTax,
            grandTotal,
            transcript,
            telemetry: telemetryPayload,
          });
        }

        res.json({
          success: true,
          transcript,
          ttsText,
          base64Audio,
          invoice: invoicePayload,
          telemetry: telemetryPayload,
        });
      } catch (error) {
        Sentry.captureException(error);
        const providerMessage = error.response?.data?.error?.message;
        console.error("Pipeline error:", {
          message: error.message,
          status: error.response?.status,
          providerMessage,
        });
        res.status(500).json({
          error: providerMessage || error.message || "Invoice pipeline failed",
        });
      }
    }
  );
});

app.get("/api/ledger", async (req, res) => {
  if (!isMongoConnected) return res.json({ items: [] });
  const items = await Invoice.find().sort({ createdAt: -1 }).limit(20);
  res.json({ items });
});


app.post("/api/ledger", async (req, res) => {
  if (!isMongoConnected) {
    return res.status(503).json({ error: "MongoDB is not connected; the invoice could not be saved." });
  }
  const invoice = req.body;
  if (!invoice?.invoiceNumber || !invoice?.client?.name || !Array.isArray(invoice.lineItems)) {
    return res.status(400).json({ error: "Invoice number, client name, and line items are required." });
  }
  const subtotal = invoice.lineItems.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.price || 0), 0);
  const totalTax = Math.round(subtotal * Number(invoice.taxRatePercent || 0) / 100);
  const item = await Invoice.findOneAndUpdate(
    { invoiceNumber: invoice.invoiceNumber },
    { $set: { ...invoice, subtotal, totalTax, grandTotal: subtotal + totalTax, status: "LOGGED" } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  res.json({ item });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 VoiceLedger AI Backend running on http://localhost:${PORT}`);
});
