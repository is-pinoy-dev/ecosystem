import fs from "fs";
import path from "path";
import pc from "picocolors";
import {
  loadDomains,
  findVercelCleanupCandidates,
  probeVercelDomain,
  stripVercelVerificationTxt,
  type VercelCleanupCandidate,
  type VercelProbeResult,
} from "@is-pinoy-dev/registry";
import { success, warning, info, divider } from "../../utils/output.js";

interface CleanupReport {
  subdomain: string;
  file: string;
  fqdn: string;
  probe: VercelProbeResult;
  eligible: boolean;
  written: boolean;
}

// Surgical edit: re-read the raw JSON (loadDomains strips unknown keys such
// as $schema during validation) and only replace the TXT entries, so the
// file keeps every other field exactly as the user wrote it.
function removeTxtFromFile(dir: string, candidate: VercelCleanupCandidate): void {
  const filePath = path.join(dir, candidate.file);
  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8")) as {
    records: Parameters<typeof stripVercelVerificationTxt>[0];
  };
  raw.records = stripVercelVerificationTxt(raw.records).records;
  fs.writeFileSync(filePath, JSON.stringify(raw, null, 2) + "\n");
}

export async function handleVercelCleanup(
  dir: string,
  options: { write: boolean; json: boolean; timeout: number },
): Promise<void> {
  const domains = loadDomains(dir);
  const { candidates, skipped } = findVercelCleanupCandidates(domains);

  const reports: CleanupReport[] = await Promise.all(
    candidates.map(async (candidate) => {
      const probe = await probeVercelDomain(candidate.fqdn, {
        timeoutMs: options.timeout,
      });
      const eligible = probe.healthy;
      let written = false;
      if (eligible && options.write) {
        removeTxtFromFile(dir, candidate);
        written = true;
      }
      return {
        subdomain: candidate.subdomain,
        file: candidate.file,
        fqdn: candidate.fqdn,
        probe,
        eligible,
        written,
      };
    }),
  );

  if (options.json) {
    console.log(JSON.stringify({ reports, skipped }, null, 2));
    return;
  }

  if (candidates.length === 0 && skipped.length === 0) {
    success("No domains carry a Vercel verification TXT record.");
    return;
  }

  for (const report of reports) {
    const detail = report.probe.detail ? ` (${report.probe.detail})` : "";
    if (report.eligible) {
      success(
        `${pc.bold(report.fqdn)} — verified and live on Vercel; TXT no longer needed${
          report.written ? ", removed from " + report.file : ""
        }`,
      );
    } else if (report.probe.reason === "vercel-error") {
      warning(
        `${pc.bold(report.fqdn)} — not verified yet${detail}; keeping TXT`,
      );
    } else {
      info(
        `${pc.bold(report.fqdn)} — inconclusive: ${report.probe.reason}${detail}; keeping TXT`,
      );
    }
  }

  for (const skip of skipped) {
    info(`${pc.bold(skip.subdomain)} — skipped: ${skip.reason}`);
  }

  divider();
  const eligibleCount = reports.filter((r) => r.eligible).length;
  const writtenCount = reports.filter((r) => r.written).length;
  info(
    `${reports.length} probed, ${eligibleCount} eligible, ${
      options.write ? `${writtenCount} file(s) updated` : "no files changed (use --write)"
    }, ${skipped.length} skipped`,
  );
  if (!options.write && eligibleCount > 0) {
    info("Re-run with --write to remove the eligible TXT records, then open a PR with the changes.");
  }
}
