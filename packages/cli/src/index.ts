#!/usr/bin/env node

import fs from "fs";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { join, dirname } from "path";
import { program } from "commander";
import { config as loadEnv } from "dotenv";
import { SchemaError } from "@is-pinoy-dev/registry";
import { registerRegistryCommand } from "./commands/registry/index.js";
import { printSchemaError, printBanner, error } from "./utils/output.js";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = require(join(__dirname, "../package.json")) as { version: string };
const VERSION = pkg.version;

program
  .name("is-pinoy")
  .description("CLI for managing the Philippine domain DNS registry")
  .version(VERSION)
  .option("--dotenv <path>", "Path to a .env file to load");

registerRegistryCommand(program);

program.hook("preAction", (thisCommand) => {
  const envFile = thisCommand.optsWithGlobals().dotenv as string | undefined;
  if (envFile) {
    if (!fs.existsSync(envFile)) {
      error(`env file not found: ${envFile}`);
      process.exit(1);
    }
    loadEnv({ path: envFile, override: true, quiet: true });
  }
  printBanner(VERSION);
});

program.parseAsync().catch((err) => {
  if (err instanceof SchemaError) {
    printSchemaError(err.file, err.issues);
  } else {
    error(err instanceof Error ? err.message : String(err));
  }
  process.exit(1);
});
