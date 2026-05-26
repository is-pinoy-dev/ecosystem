import type { AuditField } from "@is-pinoy-dev/schemas";

const STATUS_STYLES: Record<AuditField["status"], string> = {
  pass: "bg-primary text-primary-foreground",
  warn: "bg-yellow-400 text-black",
  fail: "bg-destructive text-white",
};

export function StatusBadge({ status }: { status: AuditField["status"] }) {
  return (
    <span
      className={`font-pixel text-[7px] px-2 py-1 whitespace-nowrap ${STATUS_STYLES[status]}`}
      style={{ boxShadow: "2px 2px 0px #000" }}
    >
      {status.toUpperCase()}
    </span>
  );
}
