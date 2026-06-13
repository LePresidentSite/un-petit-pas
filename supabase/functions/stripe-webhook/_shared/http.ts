export function corsHeaders(request: Request) {
  const appUrl = Deno.env.get("APP_URL") || "";
  const fallbackUrls = [
    ...(Deno.env.get("APP_FALLBACK_URLS") || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    "https://www.unpetitpas.net",
    "https://un-petit-pas.vercel.app"
  ];
  const allowedOrigins = [appUrl, ...fallbackUrls]
    .map(getOrigin)
    .filter(Boolean);
  const requestOrigin = request.headers.get("origin") || "";
  const allowedOrigin = allowedOrigins.includes(requestOrigin)
    ? requestOrigin
    : allowedOrigins[0] || "";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
    "Content-Type": "application/json"
  };
}

function getOrigin(value: string) {
  try {
    return value ? new URL(value).origin : "";
  } catch {
    return "";
  }
}

export function json(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders(request)
  });
}
