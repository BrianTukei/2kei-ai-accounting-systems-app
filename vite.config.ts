import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Minimal config — no manualChunks (stable production builds)
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  preview: {
    allowedHosts: [
      "briantukei-2kei-ai-accounting-systems-app.onrender.com",
      "2kei-ai-accounting-systems-app.onrender.com",
    ],
  },
  build: {
    chunkSizeWarningLimit: 2500,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
