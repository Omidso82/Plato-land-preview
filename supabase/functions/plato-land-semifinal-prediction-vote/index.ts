import "jsr:@supabase/functions-js/edge-runtime.d.ts";
const allowedOrigin = "https://platoland.org";
const headers = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Vary": "Origin",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8"
};
Deno.serve((req: Request) => {
  const origin = req.headers.get("Origin");
  if (origin && origin !== allowedOrigin) {
    return new Response(JSON.stringify({ error: "Origin not allowed" }), { status: 403, headers });
  }
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  return new Response(JSON.stringify({
    error: "مهلت پیش‌بینی نیمه‌نهایی به پایان رسیده و ثبت پیش‌بینی جدید امکان‌پذیر نیست."
  }), { status: 410, headers });
});
