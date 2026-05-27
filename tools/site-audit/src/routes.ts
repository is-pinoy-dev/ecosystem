import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  layout("routes/layout.tsx", [
    index("routes/overview.tsx"),
    route("/seo", "routes/seo.tsx"),
    route("/og", "routes/og.tsx"),
  ]),
  route("/_tools/site-audit/audit-proxy", "routes/audit-proxy.tsx"),
] satisfies RouteConfig;
