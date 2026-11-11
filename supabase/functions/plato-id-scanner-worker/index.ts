import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requestGoogleVisionOcr, GoogleVisionRequestError } from "../_shared/plato-id-scanner-google-vision-client.ts";
import { scannerSha256, validateScannerStoredObject, SCANNER_BUCKET } from "../_shared/plato-id-scanner-dispatch-validation.ts";
import { adaptScannerWorkerSuccessToReviewPayload } from "../_shared/plato-id-scanner-result-adapter.ts";

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

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
  const googleVisionApiKey = Deno.env.get("GOOGLE_VISION_API_KEY");
  if (!supabaseUrl || !serviceKey || !googleVisionApiKey) {
    return Response.json({ error: "OCR worker is not configured; no jobs were claimed." }, { status: 503 });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

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
      apiKey: googleVisionApiKey, imageBytes: bytes,
      context: {
        job_id: job.id, scan_id: job.scan_id, source_sha256: digest,
        started_at: startedAt, finished_at: new Date().toISOString(), api_version: "v1",
      },
    });
    ocr.finished_at = new Date().toISOString();
    const reviewPayload = { ...ocr, ...adaptScannerWorkerSuccessToReviewPayload(ocr) };
    const { error: completeError } = await admin.rpc("complete_plato_id_scanner_ocr_job", {
      p_job_id: job.id, p_attempt: job.attempt, p_worker_id: workerId,
      p_source_sha256: digest, p_result: reviewPayload,
    });
    if (completeError) throw new Error("SCANNER_RESULT_PERSIST_FAILED");
    return Response.json({ claimed: 1, processed: 1, scan_id: job.scan_id, status: "needs_review" });
  } catch (error) {
    const rawCode = error instanceof GoogleVisionRequestError
      ? error.code
      : error instanceof Error ? error.message : "SCANNER_WORKER_FAILED";
    const retryable = error instanceof GoogleVisionRequestError ? error.retryable
      : ["SCANNER_SOURCE_UNAVAILABLE"].includes(rawCode);
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
