interface R2ObjectBodyLike {
  body: ReadableStream<Uint8Array>;
  size: number;
  httpEtag?: string;
  httpMetadata?: { contentType?: string; cacheControl?: string };
}
interface R2BucketRead {
  head(key: string): Promise<{ size: number; httpEtag?: string; httpMetadata?: { contentType?: string } } | null>;
  get(key: string, options?: { range?: { offset: number; length: number } }): Promise<R2ObjectBodyLike | null>;
}
interface Env { PLATO_MEDIA_BUCKET?: R2BucketRead }
type Context = { request: Request; env: Env };

const ASSETS = {
  teaser: {
    key: "plato-land/backgammon/series-3/videos/168302900751657886.MP4",
    contentType: "video/mp4",
  },
} as const;

function responseHeaders(size: number, etag?: string): Headers {
  const headers = new Headers({
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=300, s-maxage=3600",
    "Content-Type": "video/mp4",
    "Content-Length": String(size),
    "X-Content-Type-Options": "nosniff",
    "Cross-Origin-Resource-Policy": "same-origin",
  });
  if (etag) headers.set("ETag", etag);
  return headers;
}

export async function onRequest({ request, env }: Context): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
  }
  const bucket = env.PLATO_MEDIA_BUCKET;
  if (!bucket) return new Response("R2 binding unavailable", { status: 503 });

  const assetName = new URL(request.url).searchParams.get("asset");
  if (assetName !== "teaser") return new Response("Not found", { status: 404 });

  const asset = ASSETS[assetName];
  const head = await bucket.head(asset.key);
  if (!head || head.size <= 0) return new Response("Media not found", { status: 404 });

  const rangeHeader = request.headers.get("Range");
  if (request.method === "HEAD") return new Response(null, { status: 200, headers: responseHeaders(head.size, head.httpEtag) });

  if (!rangeHeader) {
    const object = await bucket.get(asset.key);
    if (!object) return new Response("Media not found", { status: 404 });
    return new Response(object.body, { status: 200, headers: responseHeaders(object.size, object.httpEtag) });
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
  if (!match || (!match[1] && !match[2])) {
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${head.size}` } });
  }

  let start: number;
  let end: number;
  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${head.size}` } });
    }
    start = Math.max(0, head.size - suffixLength);
    end = head.size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : head.size - 1;
  }
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= head.size || end < start) {
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${head.size}` } });
  }
  end = Math.min(end, head.size - 1);
  const length = end - start + 1;
  const object = await bucket.get(asset.key, { range: { offset: start, length } });
  if (!object) return new Response("Media not found", { status: 404 });
  const headers = responseHeaders(length, object.httpEtag || head.httpEtag);
  headers.set("Content-Range", `bytes ${start}-${end}/${head.size}`);
  return new Response(object.body, { status: 206, headers });
}
