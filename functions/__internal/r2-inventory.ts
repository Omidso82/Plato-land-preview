interface R2ListedObject {
  key: string;
  size: number;
  etag: string;
  uploaded: Date;
  httpMetadata?: { contentType?: string };
  checksums?: Record<string, unknown>;
}

interface R2ListResult {
  objects: R2ListedObject[];
  truncated: boolean;
  cursor?: string;
}

interface R2HeadObject {
  size: number;
  etag?: string;
  httpEtag?: string;
  uploaded?: Date;
  httpMetadata?: { contentType?: string; cacheControl?: string };
  checksums?: Record<string, unknown>;
}

interface R2ReadOnlyBucket {
  list(options: { prefix: string; limit: number; cursor?: string }): Promise<R2ListResult>;
  head(key: string): Promise<R2HeadObject | null>;
}

interface AuditEnv {
  PLATO_MEDIA_BUCKET?: R2ReadOnlyBucket;
  R2_AUDIT_TOKEN?: string;
}

type AuditContext = {
  request: Request;
  env: AuditEnv;
};

const PREFIX = "plato-land/";
const MAX_OBJECTS = 10000;

function html(): Response {
  return new Response(`<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>PLATO LAND R2 read-only inventory</title>
<style>
body{font:16px system-ui;max-width:720px;margin:32px auto;padding:0 16px;color:#171717}
input,button{font:inherit;padding:12px;width:100%;box-sizing:border-box;margin:8px 0}
button{cursor:pointer}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f4f4f4;padding:12px}
</style></head>
<body>
<h1>PLATO LAND – R2 inventory</h1>
<p>Temporary, read-only inventory for the preview environment. No object contents are downloaded or changed.</p>
<form id="audit"><label for="token">Preview audit token</label><input id="token" type="password" autocomplete="off" required>
<button type="submit">Generate inventory</button></form>
<p id="status" role="status"></p><a id="download" hidden download="plato-land-r2-inventory.json">Download JSON inventory</a>
<pre id="output"></pre>
<script>
const form=document.getElementById('audit');
form.addEventListener('submit',async(event)=>{
 event.preventDefault();
 const status=document.getElementById('status');
 const output=document.getElementById('output');
 const download=document.getElementById('download');
 status.textContent='Reading object metadata…'; output.textContent=''; download.hidden=true;
 try{
  const response=await fetch(location.pathname,{method:'POST',headers:{'Authorization':'Bearer '+document.getElementById('token').value}});
  const body=await response.json();
  if(!response.ok) throw new Error(body.error||('HTTP '+response.status));
  const json=JSON.stringify(body,null,2);
  output.textContent=json;
  const blob=new Blob([json],{type:'application/json'});
  download.href=URL.createObjectURL(blob); download.hidden=false;
  status.textContent='Inventory ready: '+body.objectCount+' objects';
 }catch(error){status.textContent='Inventory failed: '+(error instanceof Error?error.message:'Unknown error');}
});
</script></body></html>`, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "Content-Security-Policy": "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
}

export async function onRequest(context: AuditContext): Promise<Response> {
  const { request, env } = context;

  if (request.method === "GET") return html();
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, POST" } });
  }

  if (!env.R2_AUDIT_TOKEN) {
    return Response.json({ error: "Preview audit secret is not configured." }, { status: 503 });
  }
  if (!env.PLATO_MEDIA_BUCKET) {
    return Response.json({ error: "Preview R2 bucket binding is not configured." }, { status: 503 });
  }

  const expected = `Bearer ${env.R2_AUDIT_TOKEN}`;
  const supplied = request.headers.get("Authorization") ?? "";
  if (supplied.length !== expected.length || supplied !== expected) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const origin = request.headers.get("Origin");
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  const objects: Array<{
    key: string;
    size: number;
    etag: string;
    uploaded: string;
    contentType: string | null;
    checksums: Record<string, unknown> | null;
  }> = [];

  let cursor: string | undefined;
  let truncated = false;
  do {
    const page = await env.PLATO_MEDIA_BUCKET.list({
      prefix: PREFIX,
      limit: 1000,
      ...(cursor ? { cursor } : {}),
    });

    for (const object of page.objects) {
      objects.push({
        key: object.key,
        size: object.size,
        etag: object.etag,
        uploaded: object.uploaded.toISOString(),
        contentType: object.httpMetadata?.contentType ?? null,
        checksums: object.checksums ?? null,
      });
      if (objects.length > MAX_OBJECTS) {
        return Response.json({ error: "Inventory exceeds the safety limit; use paginated audit." }, { status: 413 });
      }
    }

    truncated = page.truncated;
    cursor = page.cursor;
    if (truncated && !cursor) {
      return Response.json({ error: "R2 returned a truncated page without a continuation cursor." }, { status: 502 });
    }
  } while (truncated);

  // Independently verify each listed key with R2 head(). This is read-only and
  // helps distinguish listing metadata anomalies from actual object metadata.
  const verifiedObjects = [];
  for (let offset = 0; offset < objects.length; offset += 20) {
    const batch = objects.slice(offset, offset + 20);
    const heads = await Promise.all(batch.map(async (object) => {
      try {
        const head = await env.PLATO_MEDIA_BUCKET!.head(object.key);
        return {
          key: object.key,
          listedSize: object.size,
          listedEtag: object.etag,
          headFound: Boolean(head),
          headSize: head?.size ?? null,
          headEtag: head?.httpEtag ?? head?.etag ?? null,
          headContentType: head?.httpMetadata?.contentType ?? null,
          headChecksums: head?.checksums ?? null,
          sizeMatches: head ? head.size === object.size : false,
          etagMatches: head ? (head.httpEtag ?? head.etag ?? null) === object.etag : false,
        };
      } catch {
        return {
          key: object.key,
          listedSize: object.size,
          listedEtag: object.etag,
          headFound: false,
          headError: true,
        };
      }
    }));
    verifiedObjects.push(...heads);
  }

  const totalBytes = objects.reduce((sum, object) => sum + object.size, 0);
  const headNonZeroCount = verifiedObjects.filter((object) => object.headFound && object.headSize && object.headSize > 0).length;
  const headMissingCount = verifiedObjects.filter((object) => !object.headFound).length;
  const headMismatchCount = verifiedObjects.filter((object) => object.headFound && (!object.sizeMatches || !object.etagMatches)).length;
  return Response.json({
    bucket: "plato-land-media",
    prefix: PREFIX,
    objectCount: objects.length,
    totalBytes,
    totalMiB: Number((totalBytes / (1024 * 1024)).toFixed(2)),
    readOnly: true,
    verification: {
      method: "R2 head() for every listed key; no object bodies read",
      checked: verifiedObjects.length,
      nonZeroObjectsByHead: headNonZeroCount,
      missingByHead: headMissingCount,
      metadataMismatches: headMismatchCount,
    },
    objects,
    verifiedObjects,
  }, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
