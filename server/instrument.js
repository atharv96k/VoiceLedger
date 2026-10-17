// server/instrument.js
import * as Sentry from "@sentry/node";
import dotenv from "dotenv";

dotenv.config();

if (process.env.SENTRY_DSN && !process.env.SENTRY_DSN.includes("examplePublicKey")) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV || "development",
  });
  console.log("🟢 Sentry Agent Tracing Initialized");
} else {
  console.log("⚪ Sentry DSN not set — running with local trace IDs");
}