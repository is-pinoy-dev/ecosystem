#!/usr/bin/env node

import { program } from "commander";
import { SchemaError } from "@is-pinoy/registry";
import { registerRegistryCommand } from "./commands/registry/index.js";
import { printSchemaError, printBanner, error } from "./utils/output.js";

const VERSION = "0.0.0";

program
  .name("is-pinoy")
  .description("CLI for managing the Philippine domain DNS registry")
  .version(VERSION);

registerRegistryCommand(program);

program.hook("preAction", () => printBanner(VERSION));

program.parseAsync().catch((err) => {
  if (err instanceof SchemaError) {
    printSchemaError(err.file, err.issues);
  } else {
    error(err instanceof Error ? err.message : String(err));
  }
  process.exit(1);
});
