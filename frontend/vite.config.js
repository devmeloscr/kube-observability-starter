import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// O painel chama /api/* e o Vite faz proxy para a vagas-api, evitando CORS.
// Por padrão aponta para o port-forward do cluster (localhost:8080).
// Para apontar para a API rodando local (npm run dev na api), use:
//   VITE_API_TARGET=http://localhost:3000 npm run dev
const target = process.env.VITE_API_TARGET || "http://localhost:8080";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    allowedHosts: true,
    proxy: {
      "/api": {
        target,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
