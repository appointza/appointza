import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
  base: "/appointzastay/",
  build: {
    outDir: "../appointzabuild/production/wwwroot/appointzastay",
    emptyOutDir: true,
    assetsDir: "assets",
    sourcemap: mode === "development",
  },
  server: {
    host: "::",
    port: 8088,
    proxy: {
      "/api": {
        target: "https://localhost:7117",
        changeOrigin: true,
        secure: false,
      },
      "/health": {
        target: "https://localhost:7117",
        changeOrigin: true,
        secure: false,
      },
      "/uploads": {
        target: env.VITE_MEDIA_ORIGIN || "https://localhost:7117",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  };
});
