// client/src/services/api.js
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export async function processVoiceInvoice({ audioBlob, activeModel, presetFallback }) {
  try {
    const formData = new FormData();
    if (audioBlob) {
      formData.append("audio", audioBlob, "voice-note.webm");
    }
    formData.append("model", activeModel);
    if (!audioBlob && presetFallback?.transcript) {
      formData.append("transcript", presetFallback.transcript);
      formData.append("presetId", presetFallback.id);
    }

    // Calls your live Express backend agent pipeline
    const response = await axios.post(`${API_BASE_URL}/api/voice-invoice`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 30000, // 30s timeout for AI + ElevenLabs transcription
    });

    return response.data;
  } catch (error) {
    const message = error.response?.data?.error || error.message;
    console.error("Voice invoice request failed:", message);
    throw new Error(message);
  }
}

export async function fetchLedger() {
  const response = await axios.get(`${API_BASE_URL}/api/ledger`, { timeout: 10000 });
  return response.data.items || [];
}

export async function saveInvoiceToLedger(invoice) {
  const response = await axios.post(`${API_BASE_URL}/api/ledger`, invoice, {
    headers: { "Content-Type": "application/json" },
    timeout: 10000,
  });
  return response.data.item;
}
