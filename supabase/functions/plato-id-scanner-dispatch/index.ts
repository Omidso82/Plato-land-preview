import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SCANNER_BUCKET, scannerSha256, validateScannerStoredObject } from "../_shared/plato-id-scanner-dispatch-validation.ts";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...headers, "Content-Type": "application/json", "Cache-Control": "no-store" },
});

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
  if (!["uploaded", "queued", "failed"].includes(upload.status)) {
    return reply({ error: "This upload is not eligible for OCR processing." }, 409);
  }

  const { data: file, error: downloadError } = await admin.storage.from(SCANNER_BUCKET).download(upload.storage_path);
  if (downloadError || !file) return reply({ error: "The private source image could not be read." }, 422);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const validation = validateScannerStoredObject({
    operatorId: upload.operator_id, scanId: upload.id, storagePath: upload.storage_path,
    contentType: upload.content_type, declaredSize: upload.file_size,
    actualSize: file.size, bytes,
  });
  if (!validation.valid) return reply({ error: "Stored image failed server-side validation.", code: validation.code }, 415);
  const digest = await scannerSha256(bytes);

  const { data: job, error: enqueueError } = await admin.rpc("enqueue_plato_id_scanner_ocr_job", {
    p_scan_id: upload.id,
    p_source_sha256: digest,
  });
  if (enqueueError) {
    console.error("Scanner enqueue failed:", enqueueError.code ?? "UNKNOWN");
    return reply({ error: "OCR job could not be queued. The database queue migration may not yet be installed." }, 503);
  }

  let worker: Record<string, unknown> = { invoked: false, reason: "WORKER_SECRET_NOT_CONFIGURED" };
  const workerSecret = Deno.env.get("PLATO_SCANNER_WORKER_SECRET");
  if (workerSecret) {
    try {
      const workerResponse = await fetch(url + "/functions/v1/plato-id-scanner-worker", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + serviceKey,
          apikey: anonKey,
          "Content-Type": "application/json",
          "x-plato-scanner-worker-secret": workerSecret,
        },
        body: JSON.stringify({}),
        signal: AbortSignal.timeout(30_000),
      });
      const workerBody = await workerResponse.text();
      let workerResult: Record<string, unknown> | null = null;
      try {
        const parsed: unknown = JSON.parse(workerBody);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          workerResult = parsed as Record<string, unknown>;
        }
      } catch {
        // Preserve only the known, non-sensitive plain-text auth failure.
      }
      worker = {
        invoked: true,
        http_status: workerResponse.status,
        ...(workerBody.trim() === "Unauthorized" ? { response_text: "Unauthorized" } : {}),
        ...(workerResult ?? {}),
      };
    } catch {
      worker = { invoked: true, error: "WORKER_INVOCATION_FAILED" };
    }
  }

  return reply({
    queued: true,
    scan_id: upload.id,
    job_id: job?.id ?? null,
    status: job?.status ?? "queued",
    worker,
    message: "The source image passed server-side validation. OCR status is reported separately from queue acceptance.",
  }, 202);
});
