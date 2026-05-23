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
        `[DRY RUN] CREATE ${action.fqdn} \u2192 ${action.record.type} \u2192 ${action.record.value}`,
      );
      break;
    case "UPDATE":
      console.log(
        `[DRY RUN] UPDATE ${action.fqdn} (${action.id}) \u2192 ${action.record.type} \u2192 ${action.record.value}`,
      );
      break;
    case "DELETE":
      console.log(`[DRY RUN] DELETE ${action.fqdn} (${action.id})`);
      break;
  }
}

export async function sync(actions: DNSAction[], isDryRun = false) {
  for (const action of actions) {
    if (isDryRun) {
      logAction(action);
      continue;
    }
    switch (action.type) {
      case "CREATE":
        await createRecord(action.record, action.fqdn);
        console.log(`CREATED ${action.fqdn}`);
        break;
      case "UPDATE":
        await updateRecord(action.id, action.record, action.fqdn);
        console.log(`UPDATED ${action.fqdn}`);
        break;
      case "DELETE":
        await deleteRecord(action.id);
        console.log(`DELETED ${action.fqdn}`);
        break;
    }
  }
}
