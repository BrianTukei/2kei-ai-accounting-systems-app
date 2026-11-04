import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
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
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("tesseract.js")) return "ocr";
          if (id.includes("jspdf") || id.includes("html2canvas") || id.includes("pdfjs"))
            return "pdf";
          if (id.includes("recharts") || id.includes("d3-")) return "charts";
          if (id.includes("@supabase")) return "supabase";
          if (id.includes("react-dom") || id.includes("react-router") || id.includes("/react/"))
            return "react-vendor";
          if (id.includes("@radix-ui") || id.includes("lucide-react")) return "ui";
          return "vendor";
        },
      },
    },
  },
  plugins: [react()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));