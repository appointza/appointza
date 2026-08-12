import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { copyFileSync, existsSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * npm run dev  → mode development → public/config.dev.js → config.js
 * vite build   → mode production  → public/config.prod.js → config.js
 */
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
    // Dev server + build both start here
    buildStart: syncToPublic,
    configureServer() {
      syncToPublic();
    },
    // After dist is written, ensure config.js is the production/dev file (not stale)
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

/** Local/dev uses base `/` on its own port. Combined path deploy overrides via `vite build --base /stay/`. */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_API_PROXY || "http://localhost:5000";

  return {
    base: "/",
    build: {
      outDir: "dist",
      emptyOutDir: true,
      assetsDir: "assets",
      sourcemap: mode === "development",
    },
    server: {
      host: "0.0.0.0",
      port: 8088,
      strictPort: true,
      proxy: {
        "/api": { target: apiTarget, changeOrigin: true, secure: false },
        "/health": { target: apiTarget, changeOrigin: true, secure: false },
        "/uploads": {
          target: env.VITE_MEDIA_ORIGIN || apiTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      host: "0.0.0.0",
      port: 8088,
      strictPort: true,
      proxy: {
        "/api": { target: apiTarget, changeOrigin: true, secure: false },
        "/health": { target: apiTarget, changeOrigin: true, secure: false },
        "/uploads": {
          target: env.VITE_MEDIA_ORIGIN || apiTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [appConfigPlugin(mode), react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
