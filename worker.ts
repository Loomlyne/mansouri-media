// Custom Worker entry. Order: "/" locale redirect, then OpenNext with security headers.
// Later plans insert the admin gate (01-09) and /media/* (01-05) before the OpenNext fall-through.
// @ts-ignore generated at build time
import { default as openNext } from "./.open-next/worker.js";
import { pickLocale } from "./lib/i18n/negotiate";

function withSecurityHeaders(response: Response): Response {
  const res = new Response(response.body, response);
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-Frame-Options", "DENY");
  return res;
}

export default {
  async fetch(request: Request, env: CloudflareEnv, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/") {
      const locale = pickLocale(request.headers.get("accept-language"));
      return new Response(null, {
        status: 307,
        headers: {
          Location: `/${locale}`,
          Vary: "Accept-Language",
          "Cache-Control": "no-store",
        },
      });
    }
    return withSecurityHeaders(await openNext.fetch(request, env, ctx));
  },
} satisfies ExportedHandler<CloudflareEnv>;
