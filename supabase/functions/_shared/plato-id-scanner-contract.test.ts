import {
  validateScannerWorkerFailure,
  validateScannerWorkerJob,
  validateScannerWorkerSuccess,
} from "./plato-id-scanner-contract.ts";

const job = {
  contract_version: "1",
  job_id: "123e4567-e89b-42d3-a456-426614174000",
  scan_id: "123e4567-e89b-42d3-a456-426614174001",
  attempt: 1,
  source: {
    bucket: "plato-id-scans",
    object_key: "123e4567-e89b-42d3-a456-426614174002/123e4567-e89b-42d3-a456-426614174003/image.webp",
    content_type: "image/webp",
    sha256: "a".repeat(64),
  },
  requested_at: "2026-11-11T12:00:00.000Z",
};

const success = {
  contract_version: "1",
  job_id: job.job_id,
  scan_id: job.scan_id,
  outcome: "succeeded",
  engine: { name: "test-engine", version: "0.0.1" },
  source_sha256: job.source.sha256,
  raw_text: "raw OCR text: O0 I1",
  candidates: [
    { raw_value: "O0_I1", confidence: 0.72, geometry: null, flags: ["confusable_character"] },
    { raw_value: "unparsed candidate", confidence: null, geometry: null, flags: ["low_confidence"] },
  ],
  started_at: "2026-11-11T12:00:01.000Z",
  finished_at: "2026-11-11T12:00:02.000Z",
};

Deno.test("accepts a valid provider-neutral worker job", () => {
  if (!validateScannerWorkerJob(job)) throw new Error("Valid job rejected");
});

Deno.test("rejects unsupported bucket, traversal paths, MIME and malformed hash", () => {
  for (const mutate of [
    (v: any) => v.source.bucket = "other",
    (v: any) => v.source.object_key = "../private/image.png",
    (v: any) => v.source.object_key = "not-a-user/123e4567-e89b-42d3-a456-426614174003/image.webp",
    (v: any) => v.source.content_type = "image/gif",
    (v: any) => v.requested_at = "2026-11-11T12:00:00",
    (v: any) => v.source.sha256 = "not-a-hash",
  ]) {
    const candidate = structuredClone(job);
    mutate(candidate);
    if (validateScannerWorkerJob(candidate)) throw new Error("Malformed job accepted");
  }
});

Deno.test("rejects non-positive attempts and malformed identifiers", () => {
  const badAttempt = { ...job, attempt: 0 };
  const badId = { ...job, job_id: "not-a-uuid" };
  if (validateScannerWorkerJob(badAttempt) || validateScannerWorkerJob(badId)) {
    throw new Error("Invalid identity or attempt accepted");
  }
});

Deno.test("accepts raw OCR candidates without parsing or rewriting their text", () => {
  if (!validateScannerWorkerSuccess(success)) throw new Error("Valid OCR result rejected");
  if (success.candidates[0].raw_value !== "O0_I1") throw new Error("Raw candidate was altered");
});

Deno.test("rejects fabricated confidence values and invalid candidate structures", () => {
  const badConfidence = structuredClone(success);
  badConfidence.candidates[0].confidence = 1.2;
  const badFlags = structuredClone(success);
  badFlags.candidates[0].flags = "confusable_character" as any;
  if (validateScannerWorkerSuccess(badConfidence) || validateScannerWorkerSuccess(badFlags)) {
    throw new Error("Malformed OCR candidate accepted");
  }
});

Deno.test("rejects result timestamps that run backwards", () => {
  const bad = { ...success, finished_at: "2026-11-11T11:59:59.000Z" };
  if (validateScannerWorkerSuccess(bad)) throw new Error("Backwards processing interval accepted");
});

Deno.test("accepts a safe retryable failure envelope", () => {
  const failure = {
    contract_version: "1",
    job_id: job.job_id,
    scan_id: job.scan_id,
    outcome: "failed",
    error_code: "SOURCE_DECODE_FAILED",
    safe_message: "The image could not be processed.",
    retryable: true,
    attempt: 2,
    started_at: "2026-11-11T12:00:01.000Z",
    finished_at: "2026-11-11T12:00:02.000Z",
  };
  if (!validateScannerWorkerFailure(failure)) throw new Error("Valid failure envelope rejected");
});

Deno.test("rejects unsafe or incomplete failure envelopes", () => {
  const failure = {
    contract_version: "1",
    job_id: job.job_id,
    scan_id: job.scan_id,
    outcome: "failed",
    error_code: " ",
    safe_message: "Could not process.",
    retryable: true,
    attempt: 1,
    started_at: "2026-11-11T12:00:01.000Z",
    finished_at: "2026-11-11T12:00:02.000Z",
  };
  if (validateScannerWorkerFailure(failure)) throw new Error("Empty error code accepted");
});
