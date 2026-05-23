#!/usr/bin/env node
import { readFileSync } from "fs";
import { validateDomain } from "./validate.js";

const file = process.argv[2];

if (!file) {
  console.error("Usage: npx @is-pinoy-dev/validate <file>");
  process.exit(1);
}

let json: unknown;
try {
  json = JSON.parse(readFileSync(file, "utf-8"));
} catch {
  console.error(`Could not read file: ${file}`);
  process.exit(1);
}

const result = validateDomain(json as Parameters<typeof validateDomain>[0]);

if (!result.ok) {
  console.error(`Validation failed for ${file}:`);
  result.errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
} else {
  console.log(`✓ ${file} is valid`);
}
