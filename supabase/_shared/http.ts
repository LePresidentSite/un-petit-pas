export function corsHeaders(request: Request) {
  const appUrl = Deno.env.get("APP_URL") || "";
  const allowedOrigin = appUrl ? new URL(appUrl).origin : "";
  const requestOrigin = request.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": requestOrigin === allowedOrigin ? requestOrigin : allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };
}

export function json(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders(request)
  });
}
