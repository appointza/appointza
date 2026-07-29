// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react-swc";
// import path from "path";
// import { componentTagger } from "lovable-tagger";
// import { copyFileSync, existsSync } from "fs";

// // https://vitejs.dev/config/
// export default defineConfig(({ mode }) => {
//   // Determine which config file to use based on build mode
//   const isProduction = mode === 'production';
//   const configFileName = isProduction ? 'config.prod.js' : 'config.dev.js';
//   const configSourcePath = path.resolve(__dirname, `public/${configFileName}`);
  
//   // Use dist for Capacitor, or custom path for existing build
//   const useCapacitorBuild = process.env.CAPACITOR_BUILD !== 'false';
//   const outDir = useCapacitorBuild ? 'dist' : '../appointzabuild/wwwroot';
//   const configDestPath = path.resolve(__dirname, `${outDir}/config.js`);

//   return {
//     server: {
//       host: "::",
//       port: 8083,
//       allowedHosts: ["localhost", ".localhost"],
//     },
//     build: {
//       // Output to dist for Capacitor by default, or custom path if CAPACITOR_BUILD=false
//       outDir: outDir,
//       emptyOutDir: useCapacitorBuild, // Empty dist for Capacitor, preserve existing files for custom build
//       rollupOptions: {
//         plugins: [
//           {
//             name: 'copy-config',
//             generateBundle() {
//               // Copy the appropriate config file based on build mode
//               try {
//                 if (existsSync(configSourcePath)) {
//                   copyFileSync(configSourcePath, configDestPath);
//                   console.log(`✅ Copied ${configFileName} to build directory as config.js`);
//                   console.log(`📦 Build mode: ${mode} (${isProduction ? 'Production' : 'Development'})`);
//                 } else {
//                   console.warn(`⚠️ Config file not found: ${configSourcePath}`);
//                   console.warn(`⚠️ Falling back to default config.js`);
//                   // Fallback to default config.js if environment-specific file doesn't exist
//                   const defaultConfigPath = path.resolve(__dirname, 'public/config.js');
//                   if (existsSync(defaultConfigPath)) {
//                     copyFileSync(defaultConfigPath, configDestPath);
//                     console.log(`✅ Copied default config.js to build directory`);
//                   }
//                 }
//               } catch (error) {
//                 console.error(`❌ Error copying config file:`, error);
//               }
//             }
//           }
//         ]
//       }
//     },
//     plugins: [
//       react(),
//       mode === 'development' &&
//       componentTagger(),
//     ].filter(Boolean),
//     resolve: {
//       alias: {
//         "@": path.resolve(__dirname, "./src"),
//       },
//     },
//   };
// });

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { copyFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";

// ESM-safe __dirname (REQUIRED)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Determine which config file to use based on build mode
  const isProduction = mode === "production";
  const configFileName = isProduction ? "config.prod.js" : "config.dev.js";
  const configSourcePath = path.resolve(__dirname, `public/${configFileName}`);

  // Always build UI into appointzabuild/production — single config source: ../appointzabuild/production/config.js
  const outDir = "../appointzabuild/production/wwwroot";
  const configDestPath = path.resolve(__dirname, `${outDir}/config.js`);
  const rootProductionConfigPath = path.resolve(
    __dirname,
    "../appointzabuild/production/config.js"
  );

  return {
    server: {
      host: "::",
      port: 8083,
      allowedHosts: [
        "localhost",
        ".localhost",
        "127.0.0.1",
        ".127.0.0.1",
      ],
      proxy: {
        "/api": {
          target: "http://localhost:5117",
          changeOrigin: true,
          rewrite: (path) => path,
        },
        "/health": {
          target: "http://localhost:5117",
          changeOrigin: true,
        },
      },
      middlewareMode: false,
    },
    build: {
      // Always output to shared deploy folder for server + Android sync
      outDir: outDir,
      emptyOutDir: true,
      rollupOptions: {
        plugins: [
          {
            name: "copy-config",
            generateBundle() {
              try {
                // 1) Root production config (edit this for deploy; same file the server can read)
                if (existsSync(rootProductionConfigPath)) {
                  copyFileSync(rootProductionConfigPath, configDestPath);
                  console.log(
                    "Copied appointzabuild/production/config.js to wwwroot/config.js"
                  );
                  return;
                }
                // 2) Mode-specific from public/ (e.g. config.prod.js)
                if (existsSync(configSourcePath)) {
                  copyFileSync(configSourcePath, configDestPath);
                  console.log(
                    `Copied ${configFileName} to build directory as config.js`
                  );
                  console.log(
                    `Build mode: ${mode} (${isProduction ? "Production" : "Development"})`
                  );
                } else {
                  console.warn(`Config file not found: ${configSourcePath}`);
                  console.warn(`Falling back to public/config.js`);

                  const defaultConfigPath = path.resolve(
                    __dirname,
                    "public/config.js"
                  );
                  if (existsSync(defaultConfigPath)) {
                    copyFileSync(defaultConfigPath, configDestPath);
                    console.log(`Copied default config.js to build directory`);
                  }
                }
              } catch (error) {
                console.error(`Error copying config file:`, error);
              }
            },
          },
        ],
      },
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
