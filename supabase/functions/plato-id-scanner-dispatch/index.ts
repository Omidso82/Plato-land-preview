import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BUCKET = "plato-id-scans";
const MAX_BYTES = 15 * 1024 * 1024;
const MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...headers, "Content-Type": "application/json", "Cache-Control": "no-store" },
});

function hex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes)).map((value) => value.toString(16).padStart(2, "0")).join("");
}

function detectedMime(bytes: Uint8Array): string | null {
  if (bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v)) return "image/png";
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "image/jpeg";
  if (bytes.length >= 12
    && String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF"
    && String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP") return "image/webp";
  return null;
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  if (request.method !== "POST") return reply({ error: "Method not allowed." }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return reply({ error: "Scanner service is not configured." }, 500);

  const authorization = request.headers.get("Authorization");
  if (!authorization) return reply({ error: "Unauthorized." }, 401);
  const token = authorization.toLowerCase().startsWith("bearer ")
    ? authorization.slice(7).trim()
    : authorization.trim();

  const authClient = createClient(url, anonKey, {
    global: { headers: { Authorization: "Bearer " + token } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: auth, error: authError } = await authClient.auth.getUser();
  if (authError || !auth.user || !auth.user.email_confirmed_at) return reply({ error: "Unauthorized." }, 401);

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)
    || typeof body.scan_id !== "string"
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.scan_id)) {
    return reply({ error: "A valid scan_id is required." }, 400);
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: roleRow, error: roleError } = await admin.from("user_roles")
    .select("role").eq("user_id", auth.user.id).maybeSingle();
  if (roleError) return reply({ error: "Could not verify Scanner permissions." }, 500);
  const isOwner = roleRow?.role === "owner";
  if (!isOwner) {
    const { data: access, error: accessError } = await admin.from("plato_id_scanner_access")
      .select("status").eq("user_id", auth.user.id).maybeSingle();
    if (accessError) return reply({ error: "Could not verify Scanner access." }, 500);
    if (access?.status !== "approved") return reply({ error: "Scanner operator approval is required." }, 403);
  }

  const { data: upload, error: uploadError } = await admin.from("plato_id_scanner_uploads")
    .select("id,operator_id,storage_path,content_type,file_size,status")
    .eq("id", body.scan_id).maybeSingle();
  if (uploadError) return reply({ error: "Could not load the Scanner upload." }, 500);
  if (!upload) return reply({ error: "Scanner upload not found." }, 404);
  if (!isOwner && upload.operator_id !== auth.user.id) return reply({ error: "Forbidden." }, 403);
  if (upload.status !== "uploaded" && upload.status !== "queued") {
    return reply({ error: "This upload is not eligible for OCR processing." }, 409);
  }

  const segments = String(upload.storage_path).split("/");
  if (segments.length !== 3 || segments[0] !== upload.operator_id
    || segments[1] !== upload.id || !/^[A-Za-z0-9_-]{1,100}\.(jpg|png|webp)$/.test(segments[2])) {
    return reply({ error: "Stored image locator failed validation." }, 409);
  }
  if (!MIME.has(upload.content_type) || !Number.isInteger(upload.file_size)
    || upload.file_size <= 0 || upload.file_size > MAX_BYTES) {
    return reply({ error: "Stored image metadata failed validation." }, 409);
  }

  const { data: file, error: downloadError } = await admin.storage.from(BUCKET).download(upload.storage_path);
  if (downloadError || !file) return reply({ error: "The private source image could not be read." }, 422);
  if (file.size !== upload.file_size || file.size <= 0 || file.size > MAX_BYTES) {
    return reply({ error: "Stored image size does not match its upload record." }, 409);
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const actualMime = detectedMime(bytes);
  if (!actualMime || actualMime !== upload.content_type) {
    return reply({ error: "Stored image content does not match its declared type." }, 415);
  }
  const digest = hex(await crypto.subtle.digest("SHA-256", bytes));

  const { data: job, error: enqueueError } = await admin.rpc("enqueue_plato_id_scanner_ocr_job", {
    p_scan_id: upload.id,
    p_source_sha256: digest,
  });
  if (enqueueError) {
    console.error("Scanner enqueue failed:", enqueueError.code ?? "UNKNOWN");
    return reply({ error: "OCR job could not be queued. The database queue migration may not yet be installed." }, 503);
  }

  return reply({
    queued: true,
    scan_id: upload.id,
    job_id: job?.id ?? null,
    status: job?.status ?? "queued",
    message: "The source image passed server-side validation. OCR execution requires a separately configured worker.",
  }, 202);
});
