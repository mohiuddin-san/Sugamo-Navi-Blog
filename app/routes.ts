import { type RouteConfig, index } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"), 
  {
    path: "/login",
    component: "routes/home.tsx",
    loader: "routes/home.tsx",
  },
  {
    path: "/login",
    component: "routes/login.tsx",
    loader: "routes/login.tsx",
    action: "routes/login.tsx",
  },
  {
    path: "/logout",
    component: "routes/logout.tsx",
    action: "routes/logout.tsx",
  },
] satisfies RouteConfig;