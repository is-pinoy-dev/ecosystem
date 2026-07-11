---
"@is-pinoy-dev/cli": patch
---

Pin figlet to 1.11.0. figlet 1.11.1 ships a broken CommonJS build (`fileURLToPath(undefined)` throws on require), which crashed the CLI on startup for any fresh install.
