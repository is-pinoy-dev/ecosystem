import { createFlagsDiscoveryEndpoint, getProviderData } from "flags/next"
import { dashboardFlags } from "@/lib/flags-server"

// Lets the Vercel Toolbar list the dashboard's flags and override them for
// your own browser. Guarded by FLAGS_SECRET — without it the endpoint refuses
// every request, which is the correct behaviour rather than a misconfiguration
// to fix: the flags themselves keep resolving from Edge Config either way.
export const GET = createFlagsDiscoveryEndpoint(async () =>
  getProviderData(dashboardFlags)
)
