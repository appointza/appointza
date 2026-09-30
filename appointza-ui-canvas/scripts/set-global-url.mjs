#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uiRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(uiRoot, "..");
const envPath = path.join(uiRoot, ".env");

const apiArg = process.argv[2];
const uiArg = process.argv[3];

if (!apiArg || !uiArg) {
  console.error("Set two URLs before build:");
  console.error("  1) Backend API  — port/host the API runs on (frontend calls this)");
  console.error("  2) Frontend UI  — public site URL");
  console.error("");
  console.error("Usage:");
  console.error("  npm run set:url -- <apiUrl> <uiUrl>");
  console.error("  npm run set:url -- https://localhost:7117 http://localhost:8083");
  console.error("  npm run set:url -- https://api.appointza.com https://appointza.com");
  process.exit(1);
}

const normalizeUrl = (value, label) => {
  const trimmed = String(value || "").trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new Error(`Invalid ${label} "${value}". Use a full URL with http/https.`);
  }
  return trimmed;
};

const apiUrl = normalizeUrl(apiArg, "API URL");
const uiUrl = normalizeUrl(uiArg, "UI URL");

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

const replaceConfigUrls = (content) => {
  let next = content.replace(/\bbaseurl\s*:\s*["'][^"']*["']/g, `baseurl: "${apiUrl}"`);
  if (/\buiBaseUrl\s*:/.test(next)) {
    next = next.replace(/\buiBaseUrl\s*:\s*["'][^"']*["']/g, `uiBaseUrl: "${uiUrl}"`);
  } else {
    next = next.replace(
      /\bbaseurl\s*:\s*["'][^"']*["']/,
      `baseurl: "${apiUrl}",\n  uiBaseUrl: "${uiUrl}"`,
    );
  }
  return next;
};

const upsertEnvUrls = (content) => {
  const lines = content.split(/\r?\n/);
  const setLine = (key, value) => {
    const prefix = `${key}=`;
    const idx = lines.findIndex((line) => line.startsWith(prefix) || line.startsWith(`# ${prefix}`));
    const next = `${key}=${value}`;
    if (idx >= 0) {
      lines[idx] = next;
    } else {
      lines.push(next);
    }
  };
  setLine("VITE_API_BASE_URL", apiUrl);
  setLine("VITE_UI_BASE_URL", uiUrl);
  return `${lines.filter((line, i) => !(line === "" && i === lines.length - 1)).join("\n").replace(/\n*$/, "\n")}`;
};

const files = [
  { file: path.join(uiRoot, "public", "config.js"), transform: replaceConfigUrls },
  {
    file: path.join(uiRoot, "android", "app", "src", "main", "assets", "www", "config.js"),
    transform: replaceConfigUrls,
  },
  { file: envPath, transform: upsertEnvUrls },
];

const updated = [];
const skipped = [];

for (const entry of files) {
  try {
    if (entry.file === envPath && !fs.existsSync(envPath)) {
      fs.writeFileSync(
        envPath,
        `VITE_API_BASE_URL=${apiUrl}\nVITE_UI_BASE_URL=${uiUrl}\n`,
        "utf8",
      );
      updated.push(path.relative(repoRoot, envPath));
      continue;
    }
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

console.log(`Backend API URL (frontend calls this): ${apiUrl}`);
console.log(`Frontend UI URL:                       ${uiUrl}`);
console.log("");
console.log("Updated files:");
updated.forEach((item) => console.log(`- ${item}`));

if (skipped.length > 0) {
  console.log("");
  console.log("Skipped (not found):");
  skipped.forEach((item) => console.log(`- ${item}`));
}
