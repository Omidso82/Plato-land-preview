import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requestGoogleVisionOcr, GoogleVisionRequestError } from "../_shared/plato-id-scanner-google-vision-client.ts";
import { scannerSha256, validateScannerStoredObject, SCANNER_BUCKET } from "../_shared/plato-id-scanner-dispatch-validation.ts";

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const VISION_SCOPE = "https://www.googleapis.com/auth/cloud-vision";

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function pemBytes(pem: string): ArrayBuffer {
  const encoded = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function googleAccessToken(credentialsJson: string): Promise<string> {
  let credentials: { client_email?: string; private_key?: string; token_uri?: string };
  try { credentials = JSON.parse(credentialsJson); } catch { throw new Error("GOOGLE_CREDENTIALS_INVALID"); }
  if (!credentials.client_email || !credentials.private_key) throw new Error("GOOGLE_CREDENTIALS_INVALID");
  if (credentials.token_uri && credentials.token_uri !== TOKEN_URL) throw new Error("GOOGLE_TOKEN_ENDPOINT_REJECTED");

  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(new TextEncoder().encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const claim = base64Url(new TextEncoder().encode(JSON.stringify({
    iss: credentials.client_email,
    scope: VISION_SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 300,
  })));
  const unsigned = header + "." + claim;
  let key: CryptoKey;
  try {
    key = await crypto.subtle.importKey(
      "pkcs8", pemBytes(credentials.private_key),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"],
    );
  } catch { throw new Error("GOOGLE_PRIVATE_KEY_INVALID"); }
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const assertion = unsigned + "." + base64Url(new Uint8Array(signature));
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    signal: AbortSignal.timeout(15_000),
  }).catch(() => { throw new Error("GOOGLE_TOKEN_NETWORK_ERROR"); });
  if (!response.ok) throw new Error(response.status === 429 || response.status >= 500
    ? "GOOGLE_TOKEN_UPSTREAM_UNAVAILABLE" : "GOOGLE_TOKEN_AUTH_FAILED");
  const result = await response.json().catch(() => null);
  if (typeof result?.access_token !== "string" || !result.access_token) throw new Error("GOOGLE_TOKEN_RESPONSE_INVALID");
  return result.access_token;
}

function constantTimeEqual(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a), right = new TextEncoder().encode(b);
  let difference = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let i = 0; i < length; i++) difference |= (left[i] ?? 0) ^ (right[i] ?? 0);
  return difference === 0;
}

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const configuredSecret = Deno.env.get("PLATO_SCANNER_WORKER_SECRET");
  const providedSecret = request.headers.get("x-plato-scanner-worker-secret") ?? "";
  if (!configuredSecret || !constantTimeEqual(configuredSecret, providedSecret)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const credentialsJson = Deno.env.get("GOOGLE_VISION_SERVICE_ACCOUNT_JSON");
  if (!supabaseUrl || !serviceKey || !credentialsJson) {
    return Response.json({ error: "OCR worker is not configured; no jobs were claimed." }, { status: 503 });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let accessToken: string;
  try { accessToken = await googleAccessToken(credentialsJson); }
  catch (error) {
    const code = error instanceof Error ? error.message : "GOOGLE_TOKEN_FAILED";
    console.error("Scanner Google credential step failed:", code);
    return Response.json({ error: "OCR provider authentication is unavailable; no jobs were claimed.", code }, { status: 503 });
  }

  const workerId = crypto.randomUUID();
  const { data: jobs, error: claimError } = await admin.rpc("claim_plato_id_scanner_ocr_jobs", {
    p_worker_id: workerId, p_limit: 1, p_lease_seconds: 180,
  });
  if (claimError) {
    console.error("Scanner queue claim failed:", claimError.code ?? "UNKNOWN");
    return Response.json({ error: "OCR queue is unavailable." }, { status: 503 });
  }
  if (!Array.isArray(jobs) || jobs.length === 0) return Response.json({ claimed: 0, processed: 0 });

  const job = jobs[0];
  const startedAt = new Date().toISOString();
  try {
    const { data: upload, error: uploadError } = await admin.from("plato_id_scanner_uploads")
      .select("id,operator_id,storage_path,content_type,file_size,status")
      .eq("id", job.scan_id).maybeSingle();
    if (uploadError || !upload || upload.status !== "queued") throw new Error("SCANNER_UPLOAD_NOT_PROCESSABLE");

    const { data: file, error: downloadError } = await admin.storage.from(SCANNER_BUCKET).download(upload.storage_path);
    if (downloadError || !file) throw new Error("SCANNER_SOURCE_UNAVAILABLE");
    if (file.size > MAX_IMAGE_BYTES) throw new Error("SCANNER_SOURCE_TOO_LARGE");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const validation = validateScannerStoredObject({
      operatorId: upload.operator_id, scanId: upload.id, storagePath: upload.storage_path,
      contentType: upload.content_type, declaredSize: upload.file_size,
      actualSize: file.size, bytes,
    });
    if (!validation.valid) throw new Error(validation.code);
    const digest = await scannerSha256(bytes);
    if (digest !== job.source_sha256) throw new Error("SCANNER_SOURCE_HASH_MISMATCH");

    const ocr = await requestGoogleVisionOcr({
      accessToken, imageBytes: bytes,
      context: {
        job_id: job.id, scan_id: job.scan_id, source_sha256: digest,
        started_at: startedAt, finished_at: new Date().toISOString(), api_version: "v1",
      },
    });
    ocr.finished_at = new Date().toISOString();
    const { error: completeError } = await admin.rpc("complete_plato_id_scanner_ocr_job", {
      p_job_id: job.id, p_attempt: job.attempt, p_worker_id: workerId,
      p_source_sha256: digest, p_result: ocr,
    });
    if (completeError) throw new Error("SCANNER_RESULT_PERSIST_FAILED");
    return Response.json({ claimed: 1, processed: 1, scan_id: job.scan_id, status: "needs_review" });
  } catch (error) {
    const rawCode = error instanceof GoogleVisionRequestError
      ? error.code
      : error instanceof Error ? error.message : "SCANNER_WORKER_FAILED";
    const retryable = error instanceof GoogleVisionRequestError ? error.retryable
      : ["SCANNER_SOURCE_UNAVAILABLE", "GOOGLE_TOKEN_NETWORK_ERROR"].includes(rawCode);
    const safeCode = /^[A-Z0-9_]{1,80}$/.test(rawCode) ? rawCode : "SCANNER_WORKER_FAILED";
    const { error: failError } = await admin.rpc("fail_plato_id_scanner_ocr_job", {
      p_job_id: job.id, p_attempt: job.attempt, p_worker_id: workerId,
      p_error_code: safeCode, p_retryable: retryable,
    });
    if (failError) console.error("Scanner failure audit could not be saved:", failError.code ?? "UNKNOWN");
    console.error("Scanner job failed:", safeCode);
    return Response.json({ claimed: 1, processed: 0, scan_id: job.scan_id, error: safeCode }, { status: 200 });
  }
});
