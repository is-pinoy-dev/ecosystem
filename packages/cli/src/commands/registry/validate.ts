import { validateDomains } from "@is-pinoy-dev/registry/core/validate.js";
import { success, error } from "../../utils/output.js";

export function handleValidate(dir: string): void {
  const result = validateDomains(dir);

  if (result.ok) {
    success("All domains are valid.");
    process.exit(0);
  }

  for (const err of result.errors) {
    error(err);
  }
  process.exit(1);
}
