import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  layout("routes/layout.tsx", [
    index("routes/overview.tsx"),
    route("/seo", "routes/seo.tsx"),
    route("/performance", "routes/performance.tsx"),
  ]),
  route("/audit-proxy", "routes/audit-proxy.tsx"),
  route("/psi-proxy", "routes/psi-proxy.tsx"),
] satisfies RouteConfig;
