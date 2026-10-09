import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    // Terser produces ~15-20 % smaller output than the default esbuild minifier
    minify: "terser",
    terserOptions: {
      compress: { drop_console: true, passes: 2 },
      format: { comments: false },
    },
    // Inline assets < 2 kB; anything larger gets its own hashed file
    assetsInlineLimit: 2048,
    // Warn only above 600 kB per chunk (three.js is inherently large)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        /**
         * Granular manual chunks — each heavy library loads only when the
         * section that needs it is lazy-imported.
         *
         *  react        → shared by every section, tiny (~7 kB gz)
         *  framer       → only sections with motion components
         *  three        → only the 3-D scene (lazy)
         *  drei         → same as three; split from three to avoid one monster chunk
         */
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("@react-three/drei")) return "drei";
          if (id.includes("three") || id.includes("@react-three/fiber")) return "three";
          if (id.includes("framer-motion")) return "framer";
          if (id.includes("react-dom")) return "react-dom";
          if (id.includes("react") || id.includes("scheduler")) return "react";
          return "vendor";
        },
        // Stable filenames for long-term caching
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});