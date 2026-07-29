import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

export default defineConfig({
  // Mirror the `@/*` path alias from tsconfig so modules under test resolve the
  // same imports the app uses.
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
      // Next supplies `server-only` during a build; it doesn't resolve here.
      // Stubbing it keeps server modules that declare the guard testable
      // without having to remove the guard to test them.
      "server-only": fileURLToPath(
        new URL("./test/stubs/server-only.ts", import.meta.url)
      ),
    },
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
})
