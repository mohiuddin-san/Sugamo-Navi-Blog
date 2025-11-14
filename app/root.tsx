import type{ LinksFunction, MetaFunction } from "@remix-run/node";
import { DeviceProvider } from "~/routes/contexts/DeviceContext";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import '~/styles/app.css';
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
export const links: LinksFunction = () => [
  { rel: "stylesheet", href: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" },
  { href: "https://fonts.googleapis.com/css2?family=Sawarabi+Gothic&family=Cairo:wght@400;500;600;700&family=Courier+Prime&family=Cousine&display=swap", rel: "stylesheet" },
];

export const meta: MetaFunction = () => [
  { charset: "utf-8" },
  { title: "Sugamo Navi" },
  { name: "viewport", content: "width=device-width, initial-scale=1" },
];

export default function App() {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
         <DeviceProvider>
          <Outlet /> 
        </DeviceProvider>
        <ScrollRestoration />
        <Scripts />
        <script async src="https://www.tiktok.com/embed.js"></script>
      </body>
    </html>
  );
}