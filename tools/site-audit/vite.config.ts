import { cloudflareDevProxy } from "@react-router/dev/vite/cloudflare";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const devRedirect = {
  name: "dev-redirect",
  configureServer(server: import("vite").ViteDevServer) {
    server.middlewares.use((req, res, next) => {
      if (req.url === "/" || req.url === "") {
        res.writeHead(302, { Location: "/_tools/site-audit" });
        res.end();
        return;
      }
      next();
    });
  },
};

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/_tools/site-audit/" : "/",
  server: { open: "/_tools/site-audit" },
  plugins: [
    command === "serve" && devRedirect,
    cloudflareDevProxy(),
    tailwindcss(),
    reactRouter(),
  ].filter(Boolean),
  resolve: {
    tsconfigPaths: true,
  },
}));
