import { type DNSAction } from "@is-pinoy-dev/schemas";
import {
  createRecord,
  updateRecord,
  deleteRecord,
} from "../providers/cloudflare/client.js";

function logAction(action: DNSAction) {
  switch (action.type) {
    case "CREATE":
      console.log(
        `[DRY RUN] CREATE ${action.fqdn} → ${action.record.type} → ${action.record.value}`,
      );
      break;
    case "UPDATE":
      console.log(
        `[DRY RUN] UPDATE ${action.fqdn} (${action.id}) → ${action.record.type} → ${action.record.value}`,
      );
      break;
    case "DELETE":
      console.log(`[DRY RUN] DELETE ${action.fqdn} (${action.id})`);
      break;
  }
}

function executeAction(action: DNSAction): Promise<string> {
  switch (action.type) {
    case "CREATE":
      return createRecord(action.record, action.fqdn).then(
        () => `CREATED ${action.fqdn}`,
      );
    case "UPDATE":
      return updateRecord(action.id, action.record, action.fqdn).then(
        () => `UPDATED ${action.fqdn}`,
      );
    case "DELETE":
      return deleteRecord(action.id).then(() => `DELETED ${action.fqdn}`);
  }
}

/**
 * Apply the actions, and report how many did not.
 *
 * Every action is still attempted — one rejected call must not strand the rest
 * half-applied — but the count comes back so the caller can exit non-zero. A
 * sync that logs `FAILED:` and then reports success is how a token missing one
 * permission ends up looking like a green run with a broken zone behind it.
 */
export async function sync(
  actions: DNSAction[],
  isDryRun = false,
): Promise<number> {
  if (isDryRun) {
    actions.forEach(logAction);
    return 0;
  }

  const results = await Promise.allSettled(actions.map(executeAction));

  let failed = 0;
  for (const result of results) {
    if (result.status === "fulfilled") {
      console.log(result.value);
    } else {
      failed++;
      console.error(`FAILED: ${String(result.reason)}`);
    }
  }
  return failed;
}
