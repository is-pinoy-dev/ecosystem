import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { domainSchema } from "../src/domain/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const jsonSchema = domainSchema.toJSONSchema();

const outputPath = resolve(__dirname, "../../../../domains/schemas/v1/subdomain.schema.json");
writeFileSync(outputPath, JSON.stringify(jsonSchema, null, 2) + "\n");
console.log(`Generated: ${outputPath}`);
