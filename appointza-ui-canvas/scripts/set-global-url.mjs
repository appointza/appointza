#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uiRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(uiRoot, "..");

const rawBaseUrl = process.argv[2];

if (!rawBaseUrl) {
  console.error("Usage: npm run set:url -- https://your-domain.com");
  process.exit(1);
}

const normalizeUrl = (value) => {
  const trimmed = String(value || "").trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new Error(`Invalid URL "${value}". Use full URL with http/https.`);
  }
  return trimmed;
};

const baseUrl = normalizeUrl(rawBaseUrl);
const templateBaseUrl = `${baseUrl}/template`;

const updateFile = (filePath, transform) => {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  const original = fs.readFileSync(filePath, "utf8");
  const updated = transform(original);

  if (updated !== original) {
    fs.writeFileSync(filePath, updated, "utf8");
  }

  return true;
};

const replaceConfigUrls = (content) =>
  content
    .replace(/baseurl:\s*['"][^'"]*['"]/g, `baseurl: '${baseUrl}'`)
    .replace(/templateBaseUrl:\s*['"][^'"]*['"]/g, `templateBaseUrl: '${templateBaseUrl}'`);

const replaceEnvUrls = (content) =>
  content
    .replace(/^VITE_BASE_URL=.*$/m, `VITE_BASE_URL=${baseUrl}`)
    .replace(/^VITE_TEMPLATE_BASE_URL=.*$/m, `VITE_TEMPLATE_BASE_URL=${templateBaseUrl}`);

const replaceServerBaseUrl = (content) =>
  content.replace(/"baseUrl"\s*:\s*"[^"]*"/g, `"baseUrl": "${baseUrl}"`);

const replaceDefaultUrlTokens = (content) =>
  content
    .replace(/https:\/\/localhost:7117/g, baseUrl)
    .replace(/http:\/\/localhost:8083/g, baseUrl);

const files = [
  // UI runtime config
  { file: path.join(uiRoot, "public", "config.js"), transform: replaceConfigUrls },
  { file: path.join(uiRoot, "public", "config.dev.js"), transform: replaceConfigUrls },
  { file: path.join(uiRoot, "public", "config.prod.js"), transform: replaceConfigUrls },

  // Capacitor copied assets (if present locally)
  { file: path.join(uiRoot, "android", "app", "src", "main", "assets", "www", "config.js"), transform: replaceConfigUrls },
  { file: path.join(uiRoot, "android", "app", "src", "main", "assets", "www", "config.dev.js"), transform: replaceConfigUrls },
  { file: path.join(uiRoot, "android", "app", "src", "main", "assets", "www", "config.prod.js"), transform: replaceConfigUrls },

  // Vite env files
  { file: path.join(uiRoot, ".env"), transform: replaceEnvUrls },
  { file: path.join(uiRoot, ".env.development"), transform: replaceEnvUrls },
  { file: path.join(uiRoot, ".env.production"), transform: replaceEnvUrls },

  // SEO URL tokens in index pages
  { file: path.join(uiRoot, "index.html"), transform: replaceDefaultUrlTokens },
  { file: path.join(uiRoot, "android", "app", "src", "main", "assets", "www", "index.html"), transform: replaceDefaultUrlTokens },

  // Server config base URLs
  { file: path.join(repoRoot, "PlanItNoww_Server", "PlanItNoww", "appsettings.Development.json"), transform: replaceServerBaseUrl },
  { file: path.join(repoRoot, "PlanItNoww_Server", "PlanItNoww", "appsettings.Production.json"), transform: replaceServerBaseUrl },
  { file: path.join(repoRoot, "PlanItNoww_Server", "PlanItNoww", "appsettings.json"), transform: replaceServerBaseUrl },
];

const updated = [];
const skipped = [];

for (const entry of files) {
  try {
    const exists = updateFile(entry.file, entry.transform);
    if (exists) {
      updated.push(path.relative(repoRoot, entry.file));
    } else {
      skipped.push(path.relative(repoRoot, entry.file));
    }
  } catch (error) {
    console.error(`Failed to update ${entry.file}`);
    console.error(error);
    process.exit(1);
  }
}

console.log(`Global base URL set to: ${baseUrl}`);
console.log(`Template base URL set to: ${templateBaseUrl}`);
console.log("");
console.log("Updated files:");
updated.forEach((item) => console.log(`- ${item}`));

if (skipped.length > 0) {
  console.log("");
  console.log("Skipped (not found):");
  skipped.forEach((item) => console.log(`- ${item}`));
}

