import type { EntryContext } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { renderToString } from "react-dom/server";

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  const html = renderToString(<RemixServer context={remixContext} url={request.url} />);
  return new Response("<!DOCTYPE html>" + html, {
    status: responseStatusCode,
    headers: {
      ...responseHeaders,
      "Content-Type": "text/html",
    },
  });
}