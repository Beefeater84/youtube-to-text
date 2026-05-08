import { defineConfig } from "vite";
import { crx } from "@crxjs/vite-plugin";
import { readFileSync } from "fs";
import { resolve } from "path";

const target = process.env.TARGET ?? "chrome";
const manifest = JSON.parse(
  readFileSync(resolve(__dirname, `manifests/${target}.json`), "utf-8"),
);

export default defineConfig({
  resolve: {
    alias: { "@": resolve(__dirname, "src") },
  },
  plugins: [crx({ manifest })],
  build: {
    outDir: `dist/${target}`,
    emptyOutDir: true,
  },
});
