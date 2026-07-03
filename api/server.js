"use strict";

const express = require("express");
const client = require("prom-client");

const app = express();
app.use(express.json());

const register = new client.Registry();
register.setDefaultLabels({ app: "vagas-api" });
client.collectDefaultMetrics({ register });

const sessions = new Set();
const registeredUsers = new Set();

// ----------------------------------------------------------------------------
// Rotas
// ----------------------------------------------------------------------------

app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});


// Liveness/health — usado por probes do Kubernetes.
app.get("/healthz", (_req, res) => res.json({ status: "ok" }));

// Raiz informativa.
app.get("/", (_req, res) =>
  res.json({ ok: true, service: "vagas-api", loggedIn: sessions.size })
);

app.get("/work", (_req, res) => {
  const delayMs = Math.random() * 400;
  setTimeout(() => res.json({ done: true, delayMs: Math.round(delayMs) }), delayMs);
});

const loggedInUsers = new client.Gauge({
  name: "app_logged_in_users",
  help: "Número de usuários com sessão ativa",
  registers: [register],
});

// Login: registra a sessao do usuario.
app.post("/login", (req, res) => {
  const user = (req.body && req.body.user) || `user-${Date.now()}`;
  const isNew = !registeredUsers.has(user);
  loggedInUsers.inc();
  sessions.add(user);
  if (isNew) {
    registeredUsers.add(user);
    registrations.inc();
  }
  res.json({ loggedIn: user, isNew, total: sessions.size });
});

const registrations = new client.Counter({
  name: "app_user_registrations_total",
  help: "Total de cadastros realizados",
  registers: [register],
});

// Logout: encerra a sessao do usuario.
app.post("/logout", (req, res) => {
  const user = req.body && req.body.user;
  const existed = !!(user && sessions.delete(user));
  if (existed) {
    loggedInUsers.dec();
  }
  res.json({ loggedOut: user || null, existed, total: sessions.size });
});


app.get("/users", (_req, res) =>
  res.json({ total: sessions.size, users: [...sessions] })
);

// Reserva de vaga de estacionamento.
app.post("/estacionamentos/:id/reservar", (_req, res) => {
  res.json({ ok: true, estacionamentoId: _req.params.id });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`vagas-api 
  ouvindo na porta ${PORT}`));
