const BASE = "/api";

async function jsonFetch(path, options) {
  const res = await fetch(BASE + path, options);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export const api = {
  health: () => jsonFetch("/healthz"),

  users: () => jsonFetch("/users"),

  login: (user) =>
    jsonFetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user }),
    }),

  logout: (user) =>
    jsonFetch("/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user }),
    }),

  reservar: (estacionamentoId) =>
    jsonFetch(`/estacionamentos/${estacionamentoId}/reservar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }),

  work: async () => {
    const t0 = performance.now();
    await jsonFetch("/work");
    return Math.round(performance.now() - t0);
  },
};
