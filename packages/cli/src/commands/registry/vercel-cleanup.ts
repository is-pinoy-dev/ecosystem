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
import { filterDomainsByChangedFiles } from "../../utils/filter.js";
import { success, warning, info, error, divider } from "../../utils/output.js";

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
  options: {
    write: boolean;
    json: boolean;
    timeout: number;
    check?: boolean;
    only?: string[];
  },
): Promise<void> {
  let domains = loadDomains(dir);
  if (options.only && options.only.length > 0) {
    domains = filterDomainsByChangedFiles(domains, options.only);
  }
  const { candidates, skipped } = findVercelCleanupCandidates(domains);

  const reports: CleanupReport[] = await Promise.all(
    candidates.map(async (candidate) => {
      const probe = await probeVercelDomain(candidate.fqdn, {
        timeoutMs: options.timeout,
      });
      const eligible = probe.healthy;
      let written = false;
      // Check mode is a read-only gate — never mutate files even with --write.
      if (eligible && options.write && !options.check) {
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

  // Check mode: fail if any (scoped) domain still declares a vc-domain-verify
  // TXT for a domain that is already attached and verified on Vercel. That's a
  // re-add of a single-use challenge the cleanup already removed — the record
  // must be dropped again before merge, or the next cleanup run just re-strips
  // it. Domains not yet verified probe unhealthy and are correctly allowed.
  if (options.check) {
    const violations = reports.filter((r) => r.eligible);
    if (options.json) {
      console.log(JSON.stringify({ violations, reports, skipped }, null, 2));
    }
    if (violations.length > 0) {
      if (!options.json) {
        for (const v of violations) {
          error(
            `${pc.bold(v.fqdn)} is already verified and live on Vercel — remove its vc-domain-verify TXT record from ${v.file} (it is single-use and no longer needed).`,
          );
        }
      }
      process.exit(1);
    }
    if (!options.json) {
      success("No re-added verification TXT records.");
    }
    return;
  }

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
