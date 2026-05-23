import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node22",
  splitting: false,
  clean: true,
  dts: false,
  noExternal: [/@is-pinoy\/.*/],
});
