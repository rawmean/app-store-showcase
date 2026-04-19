import { existsSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const hasCustomDomain = existsSync("./CNAME") || existsSync("./public/CNAME");

export default defineConfig({
  base:
    process.env.GITHUB_PAGES === "true" && !hasCustomDomain
      ? "/app-store-showcase/"
      : "/",
  plugins: [react()],
});
