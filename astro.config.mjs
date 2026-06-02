// @ts-check
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

function readEnvFile() {
  const merged = { ...process.env };
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return merged;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    merged[key] = value;
  }
  return merged;
}

/** WordPress / CMS image hosts for astro:assets remote optimization. */
function wpRemotePatterns(env) {
  const patterns = [];
  const seen = new Set();
  for (const key of ["PUBLIC_WP_SITE_URL", "WP_API_URL"]) {
    const raw = env[key]?.trim();
    if (!raw) continue;
    try {
      const url = new URL(raw);
      const id = `${url.protocol}//${url.hostname}`;
      if (seen.has(id)) continue;
      seen.add(id);
      patterns.push({
        protocol: url.protocol.replace(":", ""),
        hostname: url.hostname,
      });
    } catch {
      // ignore invalid env URLs
    }
  }
  return patterns;
}

const env = readEnvFile();
const site =
  env.PUBLIC_SITE_URL || "https://www.xn--gospoda-dobrego-dwiku-z0c24t.pl";

export default defineConfig({
  site,
  output: "static",
  compressHTML: true,
  adapter: node({ mode: "standalone" }),
  integrations: [sitemap()],
  image: {
    remotePatterns: wpRemotePatterns(env),
  },
  build: {
    inlineStylesheets: "auto",
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
