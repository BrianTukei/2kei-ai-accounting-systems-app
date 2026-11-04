import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

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
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/tesseract.js")) return "ocr";
          if (
            id.includes("node_modules/jspdf") ||
            id.includes("node_modules/html2canvas") ||
            id.includes("node_modules/pdfjs-dist")
          ) {
            return "pdf";
          }
          if (id.includes("node_modules/recharts")) return "charts";
        },
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});