import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("three") || id.includes("@react-three")) return "three";
          if (id.includes("framer-motion")) return "framer";
          if (id.includes("react") || id.includes("scheduler")) return "framer";
          return undefined;
        },
      },
    },
  },
});