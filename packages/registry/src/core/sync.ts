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

export async function sync(actions: DNSAction[], isDryRun = false) {
  if (isDryRun) {
    actions.forEach(logAction);
    return;
  }

  const results = await Promise.allSettled(actions.map(executeAction));

  for (const result of results) {
    if (result.status === "fulfilled") {
      console.log(result.value);
    } else {
      console.error(`FAILED: ${String(result.reason)}`);
    }
  }
}
