import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { copyFileSync, existsSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** npm run dev → config.dev.js | vite build → config.prod.js */
function appConfigPlugin(mode: string): Plugin {
  const isProduction = mode === "production";
  const srcName = isProduction ? "config.prod.js" : "config.dev.js";
  const src = path.resolve(__dirname, "public", srcName);
  const publicDest = path.resolve(__dirname, "public", "config.js");

  const syncToPublic = () => {
    if (!existsSync(src)) {
      console.warn(`[app-config] missing ${srcName}`);
      return;
    }
    copyFileSync(src, publicDest);
    console.log(`[app-config] ${isProduction ? "PRODUCTION" : "DEVELOPMENT"}: ${srcName} → config.js`);
  };

  return {
    name: "app-config",
    buildStart: syncToPublic,
    configureServer() {
      syncToPublic();
    },
    writeBundle(outputOptions) {
      const outDir = outputOptions.dir
        ? path.resolve(outputOptions.dir)
        : path.resolve(__dirname, "dist");
      if (!existsSync(src)) return;
      mkdirSync(outDir, { recursive: true });
      copyFileSync(src, path.join(outDir, "config.js"));
      console.log(`[app-config] wrote ${srcName} → ${path.join(outDir, "config.js")}`);
    },
  };
}

export default defineConfig(({ mode }) => ({
  base: "/",
  server: {
    host: "0.0.0.0",
    port: 8081,
    strictPort: true,
    proxy: {
      "/api": { target: "http://localhost:5000", changeOrigin: true, secure: false },
      "/health": { target: "http://localhost:5000", changeOrigin: true, secure: false },
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 8081,
    strictPort: true,
    proxy: {
      "/api": { target: "http://localhost:5000", changeOrigin: true, secure: false },
      "/health": { target: "http://localhost:5000", changeOrigin: true, secure: false },
    },
  },
  plugins: [appConfigPlugin(mode), react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
}));
