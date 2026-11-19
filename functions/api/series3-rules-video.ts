interface R2Bucket {
  head(key: string): Promise<{ size: number; httpEtag?: string; httpMetadata?: { contentType?: string } } | null>;
  get(key: string, options?: { range?: { offset: number; length: number } }): Promise<{ body: ReadableStream<Uint8Array>; size: number; httpEtag?: string } | null>;
  put(key: string, value: ArrayBuffer, options?: { httpMetadata?: { contentType?: string; cacheControl?: string } }): Promise<{ size: number; httpEtag?: string }>;
}
interface Env { PLATO_MEDIA_BUCKET?: R2Bucket; }
type Context = { request: Request; env: Env };

const SUPABASE_URL = "https://dfrppbapaaydbjeflozw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_fuY9xR6e5pGB-6SnoV4-Hg_LNr23RzE";
const OBJECT_KEY = "plato-land/backgammon/series-3/videos/important-rules.mp4";
const MAX_BYTES = 100 * 1024 * 1024;
const ALLOWED_ORIGINS = new Set(["https://platoland.org"]);

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
function cors(origin: string): Headers {
  return new Headers({
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, Range",
    "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges, ETag",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  });
}
async function owner(request: Request): Promise<boolean> {
  const authorization = request.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) return false;
  const token = authorization.slice(7);
  if (!token || token.length > 8192) return false;
  const headers = { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: "Bearer " + token };
  const user = await fetch(SUPABASE_URL + "/auth/v1/user", { headers });
  if (!user.ok) return false;
  const role = await fetch(SUPABASE_URL + "/rest/v1/rpc/current_user_role", {
    method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: "{}",
  });
  if (!role.ok) return false;
  const value = await role.json();
  return value === "owner" || value === "مالک کل";
}
function parseRange(value: string, size: number): { start: number; end: number } | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(value.trim());
  if (!match || (!match[1] && !match[2])) return null;
  let start: number, end: number;
  if (!match[1]) {
    const suffix = Number(match[2]);
    if (!Number.isSafeInteger(suffix) || suffix <= 0) return null;
    start = Math.max(0, size - suffix); end = size - 1;
  } else {
    start = Number(match[1]); end = match[2] ? Number(match[2]) : size - 1;
  }
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= size || end < start) return null;
  return { start, end: Math.min(end, size - 1) };
}
function mediaHeaders(size: number, etag?: string): Headers {
  const h = new Headers({
    "Accept-Ranges": "bytes", "Cache-Control": "public, max-age=300, s-maxage=3600",
    "Content-Type": "video/mp4", "Content-Length": String(size), "X-Content-Type-Options": "nosniff",
  });
  if (etag) h.set("ETag", etag);
  return h;
}
export async function onRequest({ request, env }: Context): Promise<Response> {
  const origin = request.headers.get("Origin");
  const ownOrigin = new URL(request.url).origin;
  if (origin && origin !== ownOrigin && !ALLOWED_ORIGINS.has(origin)) return json({ error: "Origin is not allowed." }, 403);
  if (request.method === "OPTIONS") {
    if (!origin) return new Response(null, { status: 403 });
    return new Response(null, { status: 204, headers: cors(origin) });
  }
  const bucket = env.PLATO_MEDIA_BUCKET;
  if (!bucket) return json({ error: "R2 media binding unavailable." }, 503);

  let response: Response;
  if (request.method === "POST") {
    if (!origin || (origin !== ownOrigin && !ALLOWED_ORIGINS.has(origin))) return json({ error: "Approved site origin required." }, 403);
    if (!(await owner(request))) return json({ error: "Owner authorization required." }, 403);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return json({ error: "Media file is required." }, 400);
    if (file.type !== "video/mp4" || file.size <= 0 || file.size > MAX_BYTES || !file.name.toLowerCase().endsWith(".mp4")) {
      return json({ error: "Only non-empty MP4 files up to 100 MiB are accepted." }, 415);
    }
    const bytes = await file.arrayBuffer();
    if (bytes.byteLength !== file.size) return json({ error: "Incomplete upload." }, 400);
    const saved = await bucket.put(OBJECT_KEY, bytes, {
      httpMetadata: { contentType: "video/mp4", cacheControl: "public, max-age=300" },
    });
    response = json({ ok: true, size: saved.size, etag: saved.httpEtag || null });
  } else if (request.method === "GET" || request.method === "HEAD") {
    const head = await bucket.head(OBJECT_KEY);
    if (!head || head.size <= 0) response = new Response("Media not found", { status: 404 });
    else if (request.method === "HEAD") response = new Response(null, { status: 200, headers: mediaHeaders(head.size, head.httpEtag) });
    else {
      const rangeHeader = request.headers.get("Range");
      if (!rangeHeader) {
        const object = await bucket.get(OBJECT_KEY);
        response = object ? new Response(object.body, { status: 200, headers: mediaHeaders(object.size, object.httpEtag || head.httpEtag) }) : new Response("Media not found", { status: 404 });
      } else {
        const range = parseRange(rangeHeader, head.size);
        if (!range) response = new Response(null, { status: 416, headers: { "Content-Range": "bytes */" + head.size } });
        else {
          const length = range.end - range.start + 1;
          const object = await bucket.get(OBJECT_KEY, { range: { offset: range.start, length } });
          if (!object) response = new Response("Media not found", { status: 404 });
          else {
            const headers = mediaHeaders(length, object.httpEtag || head.httpEtag);
            headers.set("Content-Range", "bytes " + range.start + "-" + range.end + "/" + head.size);
            response = new Response(object.body, { status: 206, headers });
          }
        }
      }
    }
  } else response = new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD, POST, OPTIONS" } });

  if (origin && origin !== ownOrigin && ALLOWED_ORIGINS.has(origin)) {
    const headers = new Headers(response.headers);
    cors(origin).forEach((v, k) => headers.set(k, v));
    response = new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  }
  return response;
}
