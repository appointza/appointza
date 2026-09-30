import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readPublicConfigField(name: string): string {
  const configPath = path.resolve(__dirname, "public/config.js");
  const raw = fs.readFileSync(configPath, "utf8");
  const match = raw.match(new RegExp(`\\b${name}\\s*:\\s*["']([^"']+)["']`));
  return (match?.[1] || "").replace(/\/+$/, "");
}

function stripSlash(url: string): string {
  return String(url || "").replace(/\/+$/, "");
}

function localUiPort(uiBaseUrl: string, fallback = 8083): number {
  try {
    const parsed = new URL(uiBaseUrl);
    const host = parsed.hostname.toLowerCase();
    if (host !== "localhost" && host !== "127.0.0.1") return fallback;
    if (parsed.port) return Number(parsed.port);
    return parsed.protocol === "https:" ? 443 : 80;
  } catch {
    return fallback;
  }
}

function stampConfigFile(filePath: string, apiUrl: string, uiUrl: string) {
  if (!fs.existsSync(filePath)) return;
  let raw = fs.readFileSync(filePath, "utf8");
  raw = raw.replace(/\bbaseurl\s*:\s*["'][^"']*["']/, `baseurl: "${apiUrl}"`);
  if (/\buiBaseUrl\s*:/.test(raw)) {
    raw = raw.replace(/\buiBaseUrl\s*:\s*["'][^"']*["']/, `uiBaseUrl: "${uiUrl}"`);
  }
  fs.writeFileSync(filePath, raw, "utf8");
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");
  const apiBaseUrl = stripSlash(env.VITE_API_BASE_URL || readPublicConfigField("baseurl"));
  const uiBaseUrl = stripSlash(
    env.VITE_UI_BASE_URL || readPublicConfigField("uiBaseUrl") || "http://localhost:8083",
  );

  if (!apiBaseUrl) {
    throw new Error(
      "Backend API URL is missing. Set VITE_API_BASE_URL in .env or baseurl in public/config.js",
    );
  }

  const devPort = localUiPort(uiBaseUrl);
  let resolvedOutDir = path.resolve(__dirname, "../appointzabuild/appointzaproduction/wwwroot");

  return {
    server: {
      host: "0.0.0.0",
      port: devPort,
      strictPort: true,
      allowedHosts: true,
      proxy: {
        "/api": {
          target: apiBaseUrl,
          changeOrigin: true,
          rewrite: (path) => path,
        },
        "/health": {
          target: apiBaseUrl,
          changeOrigin: true,
        },
      },
      middlewareMode: false,
    },
    preview: {
      host: "0.0.0.0",
      port: devPort,
      strictPort: true,
    },
    build: {
      outDir: "../appointzabuild/appointzaproduction/wwwroot",
      emptyOutDir: true,
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      {
        name: "appointza-stamp-config-urls",
        configResolved(config) {
          resolvedOutDir = path.resolve(config.root, config.build.outDir);
        },
        closeBundle() {
          stampConfigFile(path.join(resolvedOutDir, "config.js"), apiBaseUrl, uiBaseUrl);
          console.log("");
          console.log(`[appointza] Backend API URL (frontend calls this): ${apiBaseUrl}`);
          console.log(`[appointza] Frontend UI URL:                       ${uiBaseUrl}`);
          console.log("");
        },
      },
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
