import { cloudflareDevProxy } from "@react-router/dev/vite/cloudflare";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/_tools/site-audit/" : "/",
  plugins: [cloudflareDevProxy(), tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
}));
