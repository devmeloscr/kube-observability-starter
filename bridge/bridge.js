"use strict";

const express = require("express");
const app = express();
app.use(express.json());

const GCHAT_URL = process.env.GCHAT_WEBHOOK_URL || "";
const DISCORD_URL = process.env.DISCORD_WEBHOOK_URL || "";

function render(payload) {
  const lines = (payload.alerts || []).map((a) => {
    const name = a.labels.alertname || "alert";
    const sev = a.labels.severity || "none";
    const team = a.labels.team || "-";
    const summary = a.annotations?.summary || "";
    const description = a.annotations?.description || "";
    const emoji = a.status === "firing" ? "🔴" : "✅";
    return [
      `${emoji} *[${a.status.toUpperCase()}]* ${name}`,
      `• severity: ${sev} | team: ${team}`,
      summary && `• ${summary}`,
      description && `  ${description}`,
    ].filter(Boolean).join("\n");
  });
  return lines.join("\n\n") || "Alerta sem detalhes";
}

async function post(url, body) {
  if (!url) return;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

app.post("/alert", async (req, res) => {
  const text = render(req.body);
  try {
    await post(GCHAT_URL, { text });
    await post(DISCORD_URL, { content: text });
  } catch (e) {
    console.error("Falha ao notificar:", e.message);
  }
  res.sendStatus(200);
});

app.get("/healthz", (_, res) => res.send("ok"));
app.listen(8080, () => console.log("alert-bridge ouvindo na 8080"));
