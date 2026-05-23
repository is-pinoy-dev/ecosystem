#!/usr/bin/env node

import { program } from "commander";
import { SchemaError } from "@is-pinoy/registry";
import { registerRegistryCommand } from "./commands/registry/index.js";
import { printSchemaError, error } from "./utils/output.js";

program
  .name("is-pinoy")
  .description("CLI for managing the Philippine domain DNS registry")
  .version("0.0.0");

registerRegistryCommand(program);

program.parseAsync().catch((err) => {
  if (err instanceof SchemaError) {
    printSchemaError(err.file, err.issues);
  } else {
    error(err instanceof Error ? err.message : String(err));
  }
  process.exit(1);
});
