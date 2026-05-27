import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  layout("routes/layout.tsx", [
    index("routes/overview.tsx"),
    route("/seo", "routes/seo.tsx"),
    route("/og", "routes/og.tsx"),
  ]),
  route("/audit-proxy", "routes/audit-proxy.tsx"),
] satisfies RouteConfig;
