const DEFAULT_BACKEND_URL = "https://algomentor-backend-nc57.onrender.com";

/**
 * Rewrites Set-Cookie headers from the upstream Render backend so cookies are
 * stored as first-party cookies on the Cloudflare Pages domain.
 */
function rewriteCookieForFirstParty(cookie) {
  return cookie
    .replace(/;\s*Domain=[^;]+/gi, "")
    .replace(/;\s*SameSite=None/gi, "; SameSite=Lax");
}

/**
 * Cloudflare Pages Function catching all `/api/*` requests and proxying them
 * to the Render backend. Keeps auth cookies same-origin (first-party) and
 * streams Server-Sent Events (SSE) responses transparently.
 */
export async function onRequest(context) {
  const { request, params, env } = context;

  const backendBase = (env.BACKEND_URL || DEFAULT_BACKEND_URL).replace(/\/+$/, "");
  const pathSegments = Array.isArray(params.path)
    ? params.path
    : params.path
      ? [params.path]
      : [];
  const subPath = pathSegments.join("/");

  const incomingUrl = new URL(request.url);
  const targetUrl = `${backendBase}/${subPath}${incomingUrl.search}`;

  const upstreamHeaders = new Headers(request.headers);
  upstreamHeaders.delete("host");
  upstreamHeaders.set("x-forwarded-host", incomingUrl.host);
  upstreamHeaders.set("x-forwarded-proto", incomingUrl.protocol.replace(":", ""));

  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  try {
    const upstreamResponse = await fetch(targetUrl, {
      method: request.method,
      headers: upstreamHeaders,
      body: hasBody ? request.body : undefined,
      redirect: "manual",
    });

    const responseHeaders = new Headers(upstreamResponse.headers);

    if (typeof upstreamResponse.headers.getSetCookie === "function") {
      const setCookies = upstreamResponse.headers.getSetCookie();
      if (setCookies.length > 0) {
        responseHeaders.delete("set-cookie");
        for (const cookie of setCookies) {
          responseHeaders.append("set-cookie", rewriteCookieForFirstParty(cookie));
        }
      }
    }

    const contentType = upstreamResponse.headers.get("content-type") || "";
    if (contentType.includes("text/event-stream")) {
      responseHeaders.set("cache-control", "no-cache, no-transform");
    }

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        message: "Failed to reach AlgoMentor backend service.",
        error: err?.message || "Upstream proxy error",
      }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
