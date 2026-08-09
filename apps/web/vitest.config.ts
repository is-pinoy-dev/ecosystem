import { defineConfig } from "vitest/config"

export default defineConfig({
  // Match how Next compiles the app: the tsconfig leaves JSX to the bundler,
  // so components do not import React and the classic transform cannot compile
  // them.
  esbuild: { jsx: "automatic" },
  test: {
    environment: "node",
    include: ["components/**/*.test.tsx", "lib/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": new URL(".", import.meta.url).pathname,
    },
  },
})
