import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/audit-proxy", "routes/audit-proxy.tsx"),
] satisfies RouteConfig;
