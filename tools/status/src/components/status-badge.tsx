import { Badge } from "@is-pinoy-dev/ui/components/badge";
import type { OverallStatus } from "../../worker/types";

const CONFIG: Record<OverallStatus, { label: string; className: string }> = {
  operational: {
    label: "OPERATIONAL",
    className:
      "rounded-none bg-green-500 text-black border-2 border-black shadow-[2px_2px_0px_#000] font-pixel text-[8px] hover:bg-green-500",
  },
  propagating: {
    label: "PROPAGATING",
    className:
      "rounded-none bg-primary text-black border-2 border-black shadow-[2px_2px_0px_#000] font-pixel text-[8px] hover:bg-primary",
  },
  degraded: {
    label: "DEGRADED",
    className:
      "rounded-none bg-red-500 text-white border-2 border-black shadow-[2px_2px_0px_#000] font-pixel text-[8px] hover:bg-red-500",
  },
};

export function StatusBadge({ status }: { status: OverallStatus }) {
  const { label, className } = CONFIG[status];
  return <Badge className={className}>{label}</Badge>;
}
