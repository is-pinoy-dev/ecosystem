---
"@is-pinoy-dev/validate": patch
---

Fix TypeScript rootDir inference — static JSON import of `../package.json` in `bin.ts` was causing `tsc` to expand `rootDir` to the project root, outputting compiled files to `dist/src/` instead of `dist/`. This broke CI builds from a clean checkout where no stale `dist/index.js` existed. Switched to runtime `readFileSync` to read the package version.
