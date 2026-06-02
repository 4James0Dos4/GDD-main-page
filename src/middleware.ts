import { gzipSync } from "node:zlib";
import { defineMiddleware } from "astro:middleware";
import { checkRateLimit, getClientIp } from "./lib/rateLimit";

const COMPRESSIBLE =
  /^text\/(?:html|css|plain|xml)|application\/(?:javascript|json|xml|ld\+json)/i;

async function maybeGzipResponse(request: Request, response: Response): Promise<Response> {
  const encoding = request.headers.get("accept-encoding") ?? "";
  if (!encoding.includes("gzip")) return response;
  if (response.headers.get("content-encoding")) return response;

  const type = response.headers.get("content-type") ?? "";
  if (!COMPRESSIBLE.test(type)) return response;

  try {
    const body = Buffer.from(await response.arrayBuffer());
    if (body.length < 512) return response;

    const compressed = gzipSync(body);
    if (compressed.length >= body.length) return response;

    const headers = new Headers(response.headers);
    headers.set("Content-Encoding", "gzip");
    headers.set("Vary", "Accept-Encoding");
    headers.delete("content-length");

    return new Response(compressed, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch {
    return response;
  }
}

function getWpImageOrigins(): string[] {
  const origins: string[] = [];
  for (const key of ["PUBLIC_WP_SITE_URL", "WP_API_URL"] as const) {
    const value = import.meta.env[key]?.trim();
    if (!value) continue;
    try {
      const origin = new URL(value).origin;
      if (!origins.includes(origin)) origins.push(origin);
    } catch {
      // ignore invalid env URLs
    }
  }
  return origins;
}

function securityHeaders(response: Response, isProd: boolean): void {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(self)",
  );

  const wpOrigins = getWpImageOrigins();
  const imgSrc = ["'self'", "data:", "https:", "blob:", ...wpOrigins].join(" ");

  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.fontshare.com https://cdnjs.cloudflare.com",
    "font-src 'self' https://fonts.gstatic.com https://api.fontshare.com https://cdn.fontshare.com https://cdnjs.cloudflare.com data:",
    `img-src ${imgSrc}`,
    "connect-src 'self' https://api.stripe.com",
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://checkout.stripe.com",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);

  if (isProd) {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  if (pathname === "/api/create-checkout-session" && context.request.method === "POST") {
    const ip = getClientIp(context.request, context.clientAddress);
    const limit = checkRateLimit(`checkout:${ip}`);
    if (!limit.ok) {
      return new Response(
        JSON.stringify({ error: "Zbyt wiele żądań. Spróbuj ponownie za chwilę." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(limit.retryAfter),
          },
        },
      );
    }
  }

  if (pathname.startsWith("/api/download/") && context.request.method === "GET") {
    const ip = getClientIp(context.request, context.clientAddress);
    const limit = checkRateLimit(`download:${ip}`, 20);
    if (!limit.ok) {
      return new Response("Zbyt wiele żądań. Spróbuj ponownie za chwilę.", {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfter) },
      });
    }
  }

  if (pathname === "/api/resend-audiobook-link" && context.request.method === "POST") {
    const ip = getClientIp(context.request, context.clientAddress);
    const limit = checkRateLimit(`resend-link:${ip}`, 5);
    if (!limit.ok) {
      return new Response(JSON.stringify({ error: "Zbyt wiele żądań. Spróbuj ponownie za chwilę." }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(limit.retryAfter),
        },
      });
    }
  }

  const response = await next();
  securityHeaders(response, import.meta.env.PROD);

  if (context.isPrerendered) return response;

  return await maybeGzipResponse(context.request, response);
});
