// server/models/Invoice.js
import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true },
    date: { type: String, required: true },
    businessName: { type: String, default: "Mohite Plumbing & Electrical Works" },
    businessGstin: { type: String, default: "27AABCM8492R1Z5" },
    businessPhone: String,
    upiId: { type: String, default: "mohite.works@okaxis" },
    client: {
      name: String,
      phone: String,
      address: String,
      gstin: String,
      matchedFromDb: Boolean,
    },
    taxRatePercent: Number,
    lineItems: [
      {
        id: String,
        description: String,
        category: { type: String, enum: ["MATERIALS", "LABOR"] },
        hsnSac: String,
        qty: Number,
        price: Number,
      },
    ],
    subtotal: Number,
    totalTax: Number,
    grandTotal: Number,
    status: { type: String, default: "LOGGED" },
    transcript: String,
    telemetry: {
      model: String,
      sentryTraceId: String,
      latencyMs: Number,
      tokens: Number,
      openCost: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Invoice", invoiceSchema);
