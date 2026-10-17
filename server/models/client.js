// server/models/Client.js
import mongoose from "mongoose";

const clientSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  aliases: [{ type: String }],
  phone: { type: String },
  address: { type: String },
  gstin: { type: String, default: "Unregistered / B2C" },
  defaultHourlyRate: { type: Number, default: 500 },
});

export default mongoose.model("Client", clientSchema);