import { validateDomains } from "@is-pinoy-dev/registry/core/validate.js";
import { success, error, warning } from "../../utils/output.js";

export function handleValidate(dir: string): void {
  const result = validateDomains(dir);

  for (const warn of result.warnings) {
    warning(warn);
  }

  if (result.ok) {
    success("All domains are valid.");
    process.exit(0);
  }

  for (const err of result.errors) {
    error(err);
  }
  process.exit(1);
}
