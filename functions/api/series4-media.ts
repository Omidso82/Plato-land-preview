interface R2ObjectBody {
  body: ReadableStream<Uint8Array>;
  size: number;
  httpEtag?: string;
}
interface R2Bucket {
  head(key: string): Promise<{ size: number; httpEtag?: string; httpMetadata?: { contentType?: string } } | null>;
  get(key: string, options?: { range?: { offset: number; length: number } }): Promise<R2ObjectBody | null>;
  put(key: string, value: ArrayBuffer, options?: { httpMetadata?: { contentType?: string; cacheControl?: string } }): Promise<{ size: number; httpEtag?: string }>;
}
interface Env {
  PLATO_MEDIA_BUCKET?: R2Bucket;
}
type Context = { request: Request; env: Env };
const SUPABASE_URL = "https://dfrppbapaaydbjeflozw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_fuY9xR6e5pGB-6SnoV4-Hg_LNr23RzE";
const PREFIX = "plato-land/backgammon/series-4/owner-media/";
const MAX_IMAGE = 10 * 1024 * 1024;
const MAX_VIDEO = 100 * 1024 * 1024;
const ALLOWED_ORIGINS = new Set(["https://platoland.org"]);
const IMAGE_TYPES = new Set(["image/jpeg","image/png","image/webp"]);

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
function corsHeaders(origin: string): Headers {
  return new Headers({
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, Range",
    "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges, ETag",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  });
}
function isAllowedRequestOrigin(request: Request): boolean {
  const origin = request.headers.get("Origin");
  return !origin || origin === new URL(request.url).origin || ALLOWED_ORIGINS.has(origin);
}
function withCors(request: Request, response: Response): Response {
  const origin = request.headers.get("Origin");
  if (!origin || origin === new URL(request.url).origin || !ALLOWED_ORIGINS.has(origin)) return response;
  const headers = new Headers(response.headers);
  corsHeaders(origin).forEach((value, key) => headers.set(key, value));
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
function mediaHeaders(size: number, type: string, etag?: string): Headers {
  const headers = new Headers({
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, no-store",
    "Content-Type": type,
    "Content-Length": String(size),
    "X-Content-Type-Options": "nosniff",
    "Cross-Origin-Resource-Policy": "cross-origin",
  });
  if (etag) headers.set("ETag", etag);
  return headers;
}
async function isOwner(request: Request): Promise<boolean> {
  const authorization = request.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) return false;
  const token = authorization.slice(7);
  if (!token || token.length > 8192) return false;
  const headers = { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: "Bearer " + token };
  const userResponse = await fetch(SUPABASE_URL + "/auth/v1/user", { headers });
  if (!userResponse.ok) return false;
  const roleResponse = await fetch(SUPABASE_URL + "/rest/v1/rpc/current_user_role", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: "{}",
  });
  if (!roleResponse.ok) return false;
  const role = await roleResponse.json();
  return role === "owner" || role === "مالک کل";
}
function parseRange(value: string, size: number): { start: number; end: number } | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(value.trim());
  if (!match || (!match[1] && !match[2])) return null;
  let start: number;
  let end: number;
  if (!match[1]) {
    const suffix = Number(match[2]);
    if (!Number.isSafeInteger(suffix) || suffix <= 0) return null;
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : size - 1;
  }
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= size || end < start) return null;
  return { start, end: Math.min(end, size - 1) };
}

async function handleRequest({ request, env }: Context): Promise<Response> {
  const bucket = env.PLATO_MEDIA_BUCKET;
  if (!bucket) return json({ error: "R2 media binding unavailable." }, 503);
  const url = new URL(request.url);
  const assetName = url.searchParams.get("asset") || "";
  if (!/^(poster|teaser|rules|slide-(0[1-9]|1[0-7]))$/.test(assetName)) return json({error:"Unknown Series 4 media slot."},404);
  if (!(await isOwner(request))) return json({error:"Owner authorization required."},403);
  const video = assetName === "rules" || assetName === "teaser";
  const maxSize = video ? MAX_VIDEO : MAX_IMAGE;
  const slotPrefix = PREFIX + assetName + "/";
  if (request.method === "POST") {
    const origin = request.headers.get("Origin");
    if (!origin || (origin !== url.origin && !ALLOWED_ORIGINS.has(origin))) return json({ error: "Approved site origin required for upload." }, 403);
    const declaredLength = Number(request.headers.get("Content-Length") || "0");
    if (declaredLength > maxSize + 1024 * 1024) return json({ error: "Upload request is too large." }, 413);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return json({ error: "Media file is required." }, 400);
    if (!(video ? file.type === "video/mp4" : IMAGE_TYPES.has(file.type)) || file.size <= 0 || file.size > maxSize) {
      return json({ error: "Unsupported media type or file size." }, 415);
    }
    const bytes = await file.arrayBuffer();
    if (bytes.byteLength !== file.size) return json({ error: "Incomplete upload." }, 400);
    const objectKey = slotPrefix + crypto.randomUUID();
    const result = await bucket.put(objectKey, bytes, {
      httpMetadata: {
        contentType: file.type,
        cacheControl: "private, no-store",
      },
    });
    return json({ ok: true, asset: assetName, key: objectKey, size: result.size, etag: result.httpEtag || null });
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD, POST" } });
  }
  const objectKey = url.searchParams.get("key") || "";
  if (!objectKey.startsWith(slotPrefix) || !/^[a-f0-9-]{36}$/.test(objectKey.slice(slotPrefix.length))) {
    return json({error:"Invalid Series 4 media key."},400);
  }
  const head = await bucket.head(objectKey);
  if (!head || head.size <= 0) return new Response("Media not found", { status: 404 });
  const type = video ? "video/mp4" : (head.httpMetadata?.contentType || "application/octet-stream");
  if (request.method === "HEAD") return new Response(null, { status: 200, headers: mediaHeaders(head.size, type, head.httpEtag) });

  const rangeHeader = request.headers.get("Range");
  if (!rangeHeader) {
    const object = await bucket.get(objectKey);
    if (!object) return new Response("Media not found", { status: 404 });
    return new Response(object.body, { status: 200, headers: mediaHeaders(object.size, type, object.httpEtag || head.httpEtag) });
  }
  const range = parseRange(rangeHeader, head.size);
  if (!range) return new Response(null, { status: 416, headers: { "Content-Range": "bytes */" + head.size } });
  const length = range.end - range.start + 1;
  const object = await bucket.get(objectKey, { range: { offset: range.start, length } });
  if (!object) return new Response("Media not found", { status: 404 });
  const headers = mediaHeaders(length, type, object.httpEtag || head.httpEtag);
  headers.set("Content-Range", "bytes " + range.start + "-" + range.end + "/" + head.size);
  return new Response(object.body, { status: 206, headers });
}


export async function onRequest(context: Context): Promise<Response> {
  const { request } = context;
  const origin = request.headers.get("Origin");
  if (!isAllowedRequestOrigin(request)) {
    return json({ error: "Origin is not allowed." }, 403);
  }
  if (request.method === "OPTIONS") {
    if (!origin || !isAllowedRequestOrigin(request)) {
      return new Response(null, { status: 403 });
    }
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  const response = await handleRequest(context);
  return withCors(request, response);
}
