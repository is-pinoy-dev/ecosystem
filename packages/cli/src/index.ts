#!/usr/bin/env node

import { program } from "commander";
import { registerRegistryCommand } from "./commands/registry/index.js";

program
  .name("is-pinoy")
  .description("CLI for managing the Philippine domain DNS registry")
  .version("0.0.0");

registerRegistryCommand(program);

program.parse();
