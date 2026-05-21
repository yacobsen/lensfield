import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5173,
    // Proxy /analyze to local API during dev so the PWA can call it without CORS issues
    proxy: {
      "/analyze": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
      },
      "/customer-report": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
      },
    },
  },
});
