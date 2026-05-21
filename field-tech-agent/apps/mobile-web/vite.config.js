import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5173,
    // Proxy /analyze to local API during dev so the PWA can call it without CORS issues
    proxy: {
      "/analyze": "http://localhost:3001",
    },
  },
});
